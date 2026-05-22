"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition, type ReactNode } from "react";

type Props = {
  pathname: string;
  children: ReactNode;
  className?: string;
  debounceMs?: number;
};

export function LiveFilterForm({ pathname, children, className, debounceMs = 300 }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyFilters() {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    const p = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      if (typeof v === "string" && v.length > 0) p.set(k, v);
    }
    const qs = p.toString();
    startTransition(() => {
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    });
  }

  function handleChange(e: React.FormEvent<HTMLFormElement>) {
    const t = e.target as HTMLInputElement | HTMLSelectElement;
    const isText =
      t.tagName === "INPUT" &&
      (t as HTMLInputElement).type !== "checkbox" &&
      (t as HTMLInputElement).type !== "radio" &&
      (t as HTMLInputElement).type !== "hidden";
    if (isText) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(applyFilters, debounceMs);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      applyFilters();
    }
  }

  return (
    <form
      ref={formRef}
      onChange={handleChange}
      onSubmit={(e) => {
        e.preventDefault();
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        applyFilters();
      }}
      className={`${className ?? ""} ${isPending ? "opacity-70" : ""} transition-opacity`}
    >
      {children}
    </form>
  );
}
