"use client";

export type SessionType = "chat" | "debate" | "roundtable" | "detective";

export interface ArchivedSession {
  createdAt: number;
  id: string;
  title: string;
  type: SessionType;
}

const STORAGE_KEY = "chatbot-sessions";

function readAll(): ArchivedSession[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ArchivedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(sessions: ArchivedSession[]): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSessionsByType(type: SessionType): ArchivedSession[] {
  return readAll()
    .filter((s) => s.type === type)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function saveSession(session: ArchivedSession): void {
  const all = readAll();
  const existing = all.findIndex((s) => s.id === session.id);
  if (existing >= 0) {
    all[existing] = session;
  } else {
    all.push(session);
  }
  writeAll(all);
}

export function deleteSession(id: string): void {
  writeAll(readAll().filter((s) => s.id !== id));
}

export function deleteSessionsByType(type: SessionType): void {
  writeAll(readAll().filter((s) => s.type !== type));
}

export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
