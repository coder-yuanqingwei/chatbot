import { create } from "zustand";
import type {
  CaseConclusion,
  CaseData,
  Deduction,
  DetectiveMessage,
  DetectiveStatus,
  InterrogationExchange,
  Phase,
  SSEEventType,
} from "./types";

interface DetectiveStore {
  abortController: AbortController | null;
  caseData: CaseData | null;
  conclusion: CaseConclusion | null;
  currentPhase: Phase | null;
  deductions: Deduction[];
  error: string | null;
  interrogationLog: InterrogationExchange[];
  messages: DetectiveMessage[];
  reset: () => void;
  sendUserInput: (input: string) => Promise<void>;
  startCase: (scenario: string) => Promise<void>;
  status: DetectiveStatus;
  stopInvestigation: () => void;
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
  set: (partial: Partial<DetectiveStore>) => void,
  get: () => DetectiveStore
) {
  const eventType = event as SSEEventType;

  switch (eventType) {
    case "case-generating": {
      set({ status: "generating" });
      break;
    }

    case "case-generated": {
      const caseData = data as unknown as CaseData;
      set({ caseData });
      break;
    }

    case "phase-start": {
      const phase = data.phase as Phase;
      set({ currentPhase: phase });
      break;
    }

    case "agent-start": {
      const agentId = data.agentId as string;
      const agentName = data.agentName as string;
      const agentColor = data.agentColor as string;
      const agentIcon = data.agentIcon as string;
      const phase = data.phase as Phase;
      const round = data.round as number;
      const id = data.id as string;
      set({
        messages: [
          ...get().messages,
          {
            agentColor,
            agentIcon,
            agentId,
            agentName,
            id,
            isStreaming: true,
            phase,
            round,
            text: "",
          },
        ],
        status: "investigating",
      });
      break;
    }

    case "text-delta": {
      const agentId = data.agentId as string;
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
      const agentId = data.agentId as string;
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

    case "interrogation-exchange": {
      const exchange = data as unknown as InterrogationExchange;
      set({ interrogationLog: [...get().interrogationLog, exchange] });
      break;
    }

    case "deduction-update": {
      const deduction = data as unknown as Deduction;
      const existing = get().deductions;
      const idx = existing.findIndex(
        (d) => d.suspectId === deduction.suspectId
      );
      if (idx >= 0) {
        const updated = [...existing];
        updated[idx] = deduction;
        set({ deductions: updated });
      } else {
        set({ deductions: [...existing, deduction] });
      }
      break;
    }

    case "waiting-input": {
      set({ status: "waiting_input" });
      break;
    }

    case "conclusion": {
      const conclusion = data as unknown as CaseConclusion;
      set({ conclusion });
      break;
    }

    case "case-end": {
      const messages = get().messages.map((msg) => ({
        ...msg,
        isStreaming: false,
      }));
      set({
        abortController: null,
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

async function consumeSSEStream(
  response: Response,
  set: (partial: Partial<DetectiveStore>) => void,
  get: () => DetectiveStore,
  _abortController: AbortController
) {
  const reader = response.body?.getReader();
  if (!reader) {
    set({ abortController: null, error: "No response body", status: "error" });
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

  const currentStatus = get().status;
  if (
    currentStatus === "generating" ||
    currentStatus === "investigating" ||
    currentStatus === "waiting_input"
  ) {
    set({
      abortController: null,
      currentPhase: null,
      messages: get().messages.map((m) => ({ ...m, isStreaming: false })),
      status: "finished",
    });
  }
}

export const useDetectiveStore = create<DetectiveStore>((set, get) => ({
  abortController: null,
  caseData: null,
  conclusion: null,
  currentPhase: null,
  deductions: [],
  error: null,
  interrogationLog: [],
  messages: [],

  reset: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      abortController: null,
      caseData: null,
      conclusion: null,
      currentPhase: null,
      deductions: [],
      error: null,
      interrogationLog: [],
      messages: [],
      status: "idle",
    });
  },

  sendUserInput: async (input: string) => {
    const { caseData, status, messages, interrogationLog, deductions } = get();
    if (!caseData) {
      return;
    }
    if (status !== "waiting_input") {
      return;
    }

    const abortController = new AbortController();

    set({ abortController, status: "investigating" });

    try {
      const response = await fetch("/api/detective/interrogate", {
        body: JSON.stringify({
          caseData,
          deductions,
          input,
          interrogationLog,
          previousMessages: messages.map((m) => ({
            agentId: m.agentId,
            phase: m.phase,
            text: m.text,
          })),
        }),
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

      await consumeSSEStream(response, set, get, abortController);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({
          abortController: null,
          currentPhase: null,
          messages: get().messages.map((m) => ({ ...m, isStreaming: false })),
          status: "waiting_input",
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

  startCase: async (scenario: string) => {
    if (get().status !== "idle") {
      return;
    }

    const abortController = new AbortController();

    set({
      abortController,
      caseData: null,
      conclusion: null,
      currentPhase: null,
      deductions: [],
      error: null,
      interrogationLog: [],
      messages: [],
      status: "generating",
    });

    try {
      const response = await fetch("/api/detective", {
        body: JSON.stringify({ scenario }),
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

      await consumeSSEStream(response, set, get, abortController);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        set({
          abortController: null,
          currentPhase: null,
          messages: get().messages.map((m) => ({ ...m, isStreaming: false })),
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

  stopInvestigation: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
    }
    set({
      abortController: null,
      currentPhase: null,
      messages: get().messages.map((m) => ({ ...m, isStreaming: false })),
      status: get().messages.length > 0 ? "finished" : "idle",
    });
  },
}));
