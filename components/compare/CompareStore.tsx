"use client";

import { useCallback, useEffect, useState } from "react";

type Kind = "listings" | "products";

const KEYS: Record<Kind, string> = {
  listings: "brisco:compare-listings:v1",
  products: "brisco:compare-products:v1",
};

const EVENT = "brisco:compare-changed";
const MAX = 6;

function readStorage(kind: Kind): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEYS[kind]);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeStorage(kind: Kind, ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEYS[kind], JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { kind } }));
}

export function useCompareList(kind: Kind): {
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
    setIds(readStorage(kind));
    const onChange = () => setIds(readStorage(kind));
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [kind]);

  const add = useCallback(
    (id: string) => {
      const current = readStorage(kind);
      if (current.includes(id) || current.length >= MAX) return;
      writeStorage(kind, [...current, id]);
    },
    [kind],
  );

  const remove = useCallback(
    (id: string) => {
      writeStorage(kind, readStorage(kind).filter((x) => x !== id));
    },
    [kind],
  );

  const toggle = useCallback(
    (id: string) => {
      const current = readStorage(kind);
      if (current.includes(id)) writeStorage(kind, current.filter((x) => x !== id));
      else if (current.length < MAX) writeStorage(kind, [...current, id]);
    },
    [kind],
  );

  const clear = useCallback(() => writeStorage(kind, []), [kind]);

  return { ids, add, remove, toggle, clear, isFull: ids.length >= MAX, max: MAX };
}
