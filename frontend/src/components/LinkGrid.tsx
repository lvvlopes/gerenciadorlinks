"use client";

import { Link, Group } from "@/lib/api";
import { LinkCard } from "./LinkCard";
import { Ghost } from "lucide-react";

interface LinkGridProps {
  links: Link[];
  isLoading: boolean;
  groups: Group[];
  onSelectLink: (link: Link) => void;
  onDeleteLink: (id: string) => void;
  onToggleFavorite: (id: string, is_favorite: boolean) => void;
}

export function LinkGrid({
  links,
  isLoading,
  groups,
  onSelectLink,
  onDeleteLink,
  onToggleFavorite,
}: LinkGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-52 rounded-xl shimmer" />
        ))}
      </div>
    );
  }

  if (links.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "var(--volt-dim)", border: "1px solid rgba(57,255,20,0.2)" }}
        >
          <Ghost size={28} className="text-[var(--volt)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
          Nenhum link encontrado
        </h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Adicione seu primeiro link clicando no botão acima.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
      {links.map((link) => {
        const group = groups.find((g) => g.id === link.group_id);
        return (
          <LinkCard
            key={link.id}
            link={link}
            group={group}
            onClick={() => onSelectLink(link)}
            onDelete={() => onDeleteLink(link.id)}
            onToggleFavorite={() => onToggleFavorite(link.id, !link.is_favorite)}
          />
        );
      })}
    </div>
  );
}
