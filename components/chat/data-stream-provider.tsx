"use client";

import type { DataUIPart } from "ai";
import type React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { CustomUIDataTypes, WaitingStatusData } from "@/lib/types";

export type ReasoningStreamChunk = {
  id: string;
  messageId: string;
  text: string;
  timestamp: number;
  sequence: number;
  isComplete: boolean;
};

type DataStreamContextValue = {
  dataStream: DataUIPart<CustomUIDataTypes>[];
  setDataStream: React.Dispatch<
    React.SetStateAction<DataUIPart<CustomUIDataTypes>[]>
  >;
  waitingStatus: WaitingStatusData | undefined;
  setWaitingStatus: React.Dispatch<
    React.SetStateAction<WaitingStatusData | undefined>
  >;
  reasoningStream: Map<string, ReasoningStreamChunk[]>;
  addReasoningChunk: (messageId: string, chunk: ReasoningStreamChunk) => void;
  clearReasoningStream: (messageId: string) => void;
};

const DataStreamContext = createContext<DataStreamContextValue | null>(null);

export function DataStreamProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [dataStream, setDataStream] = useState<DataUIPart<CustomUIDataTypes>[]>(
    []
  );
  const [waitingStatus, setWaitingStatus] = useState<WaitingStatusData>();
  const [reasoningStream, setReasoningStream] = useState<
    Map<string, ReasoningStreamChunk[]>
  >(new Map());

  const addReasoningChunk = useCallback(
    (messageId: string, chunk: ReasoningStreamChunk) => {
      setReasoningStream((prev) => {
        const newMap = new Map(prev);
        const existingChunks = newMap.get(messageId) ?? [];
        newMap.set(messageId, [...existingChunks, chunk]);
        return newMap;
      });
    },
    []
  );

  const clearReasoningStream = useCallback((messageId: string) => {
    setReasoningStream((prev) => {
      const newMap = new Map(prev);
      newMap.delete(messageId);
      return newMap;
    });
  }, []);

  const value = useMemo(
    () => ({
      addReasoningChunk,
      clearReasoningStream,
      dataStream,
      reasoningStream,
      setDataStream,
      setWaitingStatus,
      waitingStatus,
    }),
    [
      dataStream,
      waitingStatus,
      reasoningStream,
      addReasoningChunk,
      clearReasoningStream,
    ]
  );

  return (
    <DataStreamContext.Provider value={value}>
      {children}
    </DataStreamContext.Provider>
  );
}

export function useDataStream() {
  const context = useContext(DataStreamContext);
  if (!context) {
    throw new Error("useDataStream must be used within a DataStreamProvider");
  }
  return context;
}
