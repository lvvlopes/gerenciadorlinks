"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const [local, setLocal] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => onChange(local), 350);
    return () => clearTimeout(t);
  }, [local]);

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
      <input
        type="text"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Pesquisar links..."
        className="pl-9 pr-8 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
          text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] w-48
          focus:outline-none focus:border-[var(--volt)] focus:w-64 transition-all"
      />
      {local && (
        <button
          onClick={() => { setLocal(""); onChange(""); }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
