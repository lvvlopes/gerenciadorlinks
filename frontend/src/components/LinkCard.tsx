"use client";

import { Link, Group } from "@/lib/api";
import { Star, Trash2, ExternalLink, FileText } from "lucide-react";
import clsx from "clsx";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LinkCardProps {
  link: Link;
  group?: Group;
  onClick: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
}

const LLM_BADGE: Record<string, { label: string; color: string }> = {
  anthropic: { label: "Claude", color: "#d97706" },
  openai: { label: "GPT", color: "#10a37f" },
  ollama: { label: "Llama", color: "#7c3aed" },
};

export function LinkCard({ link, group, onClick, onDelete, onToggleFavorite }: LinkCardProps) {
  const llm = LLM_BADGE[link.llm_provider] || { label: link.llm_provider, color: "#666" };
  const timeAgo = link.created_at
    ? formatDistanceToNow(new Date(link.created_at), { addSuffix: true, locale: ptBR })
    : "";

  return (
    <article
      className={clsx(
        "relative flex flex-col rounded-xl border border-[var(--border)] bg-[var(--bg-card)]",
        "card-hover cursor-pointer overflow-hidden group"
      )}
      onClick={onClick}
    >
      {/* Thumbnail or gradient */}
      <div className="relative h-28 overflow-hidden flex-shrink-0">
        {link.thumbnail ? (
          <img
            src={link.thumbnail}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: `linear-gradient(135deg, ${group?.color || "#6366f1"}22 0%, #0a0b0e 100%)`,
            }}
          />
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] to-transparent" />

        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); window.open(link.url, "_blank"); }}
            className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center
              text-white/70 hover:text-white hover:bg-black/80 transition-all"
            title="Abrir link"
          >
            <ExternalLink size={12} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className={clsx(
              "w-7 h-7 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center transition-all",
              link.is_favorite
                ? "text-yellow-400 hover:text-yellow-300"
                : "text-white/70 hover:text-yellow-400"
            )}
            title={link.is_favorite ? "Remover favorito" : "Favoritar"}
          >
            <Star size={12} fill={link.is_favorite ? "currentColor" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (confirm("Remover este link?")) onDelete(); }}
            className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur flex items-center justify-center
              text-white/70 hover:text-red-400 hover:bg-black/80 transition-all"
            title="Remover"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Favicon */}
        <div className="absolute bottom-2 left-3 flex items-center gap-2">
          {link.favicon && (
            <img
              src={link.favicon}
              alt=""
              className="w-4 h-4 rounded-sm"
              onError={(e) => (e.target as HTMLImageElement).style.display = "none"}
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-3 gap-2">
        {/* Title */}
        <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
          {link.display_title}
        </h3>

        {/* Summary */}
        {link.summary && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {link.summary}
          </p>
        )}

        {/* Tags */}
        {link.tags && link.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {link.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] rounded-md"
                style={{
                  background: "var(--volt-dim)",
                  color: "var(--volt)",
                  border: "1px solid rgba(57,255,20,0.15)",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-2">
            {group && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: `${group.color}22`, color: group.color }}
              >
                {group.name}
              </span>
            )}
            {link.pdfs && link.pdfs.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-[var(--text-muted)]">
                <FileText size={10} />
                {link.pdfs.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-[9px] px-1.5 py-0.5 rounded font-mono"
              style={{ background: `${llm.color}22`, color: llm.color }}
            >
              {llm.label}
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">{timeAgo}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
