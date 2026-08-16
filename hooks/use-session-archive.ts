"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { ArchivedSession, SessionType } from "@/lib/session-archive";
import {
  deleteSession as deleteSessionFn,
  deleteSessionsByType,
  generateSessionId,
  getSessionsByType,
  saveSession,
} from "@/lib/session-archive";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  window.addEventListener("storage", callback);
  window.addEventListener("session-archive-changed", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("session-archive-changed", callback);
  };
}

function notifyChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("session-archive-changed"));
  }
}

export function useSessionArchive(type: SessionType) {
  const sessions = useSyncExternalStore(
    subscribe,
    () => getSessionsByType(type),
    () => []
  );

  const add = useCallback(
    (title: string): ArchivedSession => {
      const session: ArchivedSession = {
        createdAt: Date.now(),
        id: generateSessionId(),
        title,
        type,
      };
      saveSession(session);
      notifyChange();
      return session;
    },
    [type]
  );

  const remove = useCallback((id: string): void => {
    deleteSessionFn(id);
    notifyChange();
  }, []);

  const clearAll = useCallback((): void => {
    deleteSessionsByType(type);
    notifyChange();
  }, [type]);

  return { add, clearAll, remove, sessions };
}
