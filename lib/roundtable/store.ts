import { create } from "zustand";
import { DEFAULT_TEMPLATE_ID, getTemplateById } from "./templates";
import type {
  AgentId,
  MeetingConclusion,
  MeetingPhase,
  MeetingStatus,
  RoundtableMessage,
  SSEEventType,
} from "./types";

interface RoundtableStore {
  abortController: AbortController | null;
  conclusion: MeetingConclusion | null;
  currentAgentId: AgentId | null;
  currentPhase: MeetingPhase | null;
  currentRound: number;
  error: string | null;
  messages: RoundtableMessage[];
  reset: () => void;
  startMeeting: (
    topic: string,
    templateId?: string,
    rounds?: number
  ) => Promise<void>;
  status: MeetingStatus;
  stopMeeting: () => void;
  templateId: string;
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
  set: (partial: Partial<RoundtableStore>) => void,
  get: () => RoundtableStore
) {
  const eventType = event as SSEEventType;

  switch (eventType) {
    case "meeting-start": {
      set({ status: "meeting" });
      break;
    }

    case "phase-start": {
      const phase = data.phase as MeetingPhase;
      set({ currentPhase: phase });
      break;
    }

    case "agent-start": {
      const agentId = data.agentId as AgentId;
      const round = data.round as number;
      const phase = data.phase as MeetingPhase;
      const agentName = data.agentName as string;
      const agentColor = data.agentColor as string;
      const agentIcon = data.agentIcon as RoundtableMessage["agentIcon"];
      const agentArchetype =
        data.agentArchetype as RoundtableMessage["agentArchetype"];
      set({
        currentAgentId: agentId,
        messages: [
          ...get().messages,
          {
            agentArchetype,
            agentColor,
            agentIcon,
            agentId,
            agentName,
            isStreaming: true,
            phase,
            round,
            text: "",
          },
        ],
      });
      break;
    }

    case "text-delta": {
      const agentId = data.agentId as AgentId;
      const textDelta = data.textDelta as string;
      const round = data.round as number;
      const messages = get().messages.map((msg) => {
        if (msg.agentId === agentId && msg.isStreaming && msg.round === round) {
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

    case "phase-end":
      break;

    case "handoff":
      break;

    case "conclusion": {
      const conclusion = data as unknown as MeetingConclusion;
      set({ conclusion });
      break;
    }

    case "meeting-end": {
      const messages = get().messages.map((msg) => ({
        ...msg,
        isStreaming: false,
      }));
      set({
        abortController: null,
        currentAgentId: null,
        currentPhase: null,
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

export const useRoundtableStore = create<RoundtableStore>((set, get) => ({
  abortController: null,
  conclusion: null,
  currentAgentId: null,
  currentPhase: null,
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
      conclusion: null,
      currentAgentId: null,
      currentPhase: null,
      currentRound: 0,
      error: null,
      messages: [],
      status: "idle",
      topic: "",
      totalRounds: 2,
    });
  },

  startMeeting: async (
    topic: string,
    templateId: string = DEFAULT_TEMPLATE_ID,
    rounds?: number
  ) => {
    if (get().status === "starting" || get().status === "meeting") {
      return;
    }

    const template = getTemplateById(templateId);
    if (!template) {
      set({ error: "Template not found", status: "error" });
      return;
    }

    const effectiveRounds = rounds ?? template.defaultRounds;

    const abortController = new AbortController();

    set({
      abortController,
      conclusion: null,
      currentAgentId: null,
      currentPhase: null,
      currentRound: 0,
      error: null,
      messages: [],
      status: "starting",
      templateId,
      topic,
      totalRounds: effectiveRounds,
    });

    try {
      const response = await fetch("/api/roundtable", {
        body: JSON.stringify({ rounds: effectiveRounds, templateId, topic }),
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

      // If status is still starting/meeting, the stream ended unexpectedly
      const currentStatus = get().status;
      if (currentStatus === "starting" || currentStatus === "meeting") {
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

  stopMeeting: () => {
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
  templateId: DEFAULT_TEMPLATE_ID,
  topic: "",
  totalRounds: 2,
}));
