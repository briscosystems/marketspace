"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "brisco:compare-products:v1";
const EVENT = "brisco:compare-changed";
const MAX = 6;

function readStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeStorage(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/**
 * Liest den Compare-State aus localStorage und re-rendert bei Änderungen
 * (auch über andere Tabs/Tab-Wechsel).
 */
export function useCompareList(): {
  ids: string[];
  add: (id: string) => void;
  remove: (id: string) => void;
  toggle: (id: string) => void;
  clear: () => void;
  isFull: boolean;
  max: number;
} {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(readStorage());
    const onChange = () => setIds(readStorage());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = useCallback((id: string) => {
    const current = readStorage();
    if (current.includes(id)) return;
    if (current.length >= MAX) return;
    writeStorage([...current, id]);
  }, []);

  const remove = useCallback((id: string) => {
    const current = readStorage();
    writeStorage(current.filter((x) => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    const current = readStorage();
    if (current.includes(id)) {
      writeStorage(current.filter((x) => x !== id));
    } else if (current.length < MAX) {
      writeStorage([...current, id]);
    }
  }, []);

  const clear = useCallback(() => writeStorage([]), []);

  return { ids, add, remove, toggle, clear, isFull: ids.length >= MAX, max: MAX };
}
