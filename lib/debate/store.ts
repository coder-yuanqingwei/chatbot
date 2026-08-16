import { create } from "zustand";
import { generateSessionId, saveSession } from "@/lib/session-archive";
import { DEFAULT_ROUNDS } from "./agents";
import type {
  AgentId,
  DebateMessage,
  DebateStatus,
  SSEEventType,
} from "./types";

interface DebateStore {
  abortController: AbortController | null;
  currentAgentId: AgentId | null;
  currentRound: number;
  error: string | null;
  messages: DebateMessage[];
  reset: () => void;
  sessionId: string | null;

  startDebate: (topic: string, rounds?: number) => Promise<void>;
  status: DebateStatus;
  stopDebate: () => void;
  topic: string;
  totalRounds: number;
}

function parseSSEChunk(chunk: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const blocks = chunk.split("\n\n");

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) {
      continue;
    }

    let event = "message";
    let data = "";

    for (const line of trimmed.split("\n")) {
      if (line.startsWith("event: ")) {
        event = line.slice(7).trim();
      } else if (line.startsWith("data: ")) {
        data += line.slice(6);
      }
    }

    if (data) {
      events.push({ data, event });
    }
  }

  return events;
}

function handleSSEEvent(
  event: string,
  data: Record<string, unknown>,
  set: (partial: Partial<DebateStore>) => void,
  get: () => DebateStore
) {
  const eventType = event as SSEEventType;

  switch (eventType) {
    case "round-start": {
      const round = data.round as number;
      const totalRounds = data.totalRounds as number;
      set({
        currentRound: round,
        status: "debating",
        totalRounds,
      });
      break;
    }

    case "agent-start": {
      const agentId = data.agentId as AgentId;
      const round = data.round as number;
      set({
        currentAgentId: agentId,
        messages: [
          ...get().messages,
          { agentId, isStreaming: true, round, text: "" },
        ],
      });
      break;
    }

    case "text-delta": {
      const agentId = data.agentId as AgentId;
      const textDelta = data.textDelta as string;
      const messages = get().messages.map((msg) => {
        if (
          msg.agentId === agentId &&
          msg.isStreaming &&
          msg.round === get().currentRound
        ) {
          return { ...msg, text: msg.text + textDelta };
        }
        return msg;
      });
      set({ messages });
      break;
    }

    case "agent-end": {
      const agentId = data.agentId as AgentId;
      const round = data.round as number;
      const messages = get().messages.map((msg) => {
        if (msg.agentId === agentId && msg.round === round) {
          return { ...msg, isStreaming: false };
        }
        return msg;
      });
      set({ messages });
      break;
    }

    case "handoff":
      break;

    case "debate-end": {
      const messages = get().messages.map((msg) => ({
        ...msg,
        isStreaming: false,
      }));
      const store = get();
      if (store.topic && store.sessionId) {
        saveSession({
          createdAt: Date.now(),
          id: store.sessionId,
          title: store.topic,
          type: "debate",
        });
      }
      set({
        abortController: null,
        currentAgentId: null,
        messages,
        status: "finished",
      });
      break;
    }

    case "error": {
      set({
        abortController: null,
        error: (data.message as string) || "Unknown error",
        status: "error",
      });
      break;
    }

    default:
      break;
  }
}

export const useDebateStore = create<DebateStore>((set, get) => ({
  abortController: null,
  currentAgentId: null,
  currentRound: 0,
  error: null,
  messages: [],

  reset: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      abortController: null,
      currentAgentId: null,
      currentRound: 0,
      error: null,
      messages: [],
      sessionId: null,
      status: "idle",
      topic: "",
      totalRounds: DEFAULT_ROUNDS,
    });
  },
  sessionId: null,

  startDebate: async (topic: string, rounds: number = DEFAULT_ROUNDS) => {
    if (get().status === "starting" || get().status === "debating") {
      return;
    }

    const abortController = new AbortController();
    const sessionId = generateSessionId();

    set({
      abortController,
      currentAgentId: null,
      currentRound: 0,
      error: null,
      messages: [],
      sessionId,
      status: "starting",
      topic,
      totalRounds: rounds,
    });

    try {
      const response = await fetch("/api/debate", {
        body: JSON.stringify({ rounds, topic }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
        signal: abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        set({
          abortController: null,
          error: errorText || `HTTP ${response.status}`,
          status: "error",
        });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        set({
          abortController: null,
          error: "No response body",
          status: "error",
        });
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        const lastDoubleNewline = buffer.lastIndexOf("\n\n");
        if (lastDoubleNewline === -1) {
          continue;
        }

        const completeChunk = buffer.slice(0, lastDoubleNewline + 2);
        buffer = buffer.slice(lastDoubleNewline + 2);

        const events = parseSSEChunk(completeChunk);
        for (const { event, data } of events) {
          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;
            handleSSEEvent(event, parsed, set, get);
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Process any remaining buffered data
      if (buffer.trim()) {
        const events = parseSSEChunk(buffer);
        for (const { event, data } of events) {
          try {
            const parsed = JSON.parse(data) as Record<string, unknown>;
            handleSSEEvent(event, parsed, set, get);
          } catch {
            // Skip
          }
        }
      }

      // If status is still starting/debating, the stream ended unexpectedly
      const currentStatus = get().status;
      if (currentStatus === "starting" || currentStatus === "debating") {
        set({
          abortController: null,
          currentAgentId: null,
          messages: get().messages.map((m) => ({ ...m, isStreaming: false })),
          status: "finished",
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        const messages = get().messages.map((m) => ({
          ...m,
          isStreaming: false,
        }));
        set({
          abortController: null,
          currentAgentId: null,
          messages,
          status: get().messages.length > 0 ? "finished" : "idle",
        });
      } else {
        set({
          abortController: null,
          error: err instanceof Error ? err.message : "Unknown error",
          status: "error",
        });
      }
    }
  },
  status: "idle",

  stopDebate: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    const messages = get().messages.map((m) => ({ ...m, isStreaming: false }));
    set({
      abortController: null,
      currentAgentId: null,
      messages,
      status: get().messages.length > 0 ? "finished" : "idle",
    });
  },
  topic: "",
  totalRounds: DEFAULT_ROUNDS,
}));
