"use client";

import { Stats } from "@/lib/api";
import { Link2, FolderOpen, FileText, Star, BookOpen } from "lucide-react";

interface StatsBarProps {
  stats?: Stats;
}

export function StatsBar({ stats }: StatsBarProps) {
  if (!stats) return null;

  const items = [
    { icon: <Link2 size={14} />, label: "Links", value: stats.total_links, color: "#39ff14" },
    { icon: <FolderOpen size={14} />, label: "Grupos", value: stats.total_groups, color: "#6366f1" },
    { icon: <FileText size={14} />, label: "PDFs", value: stats.total_pdfs, color: "#ef4444" },
    { icon: <Star size={14} />, label: "Favoritos", value: stats.favorite_links, color: "#eab308" },
    { icon: <BookOpen size={14} />, label: "Não lidos", value: stats.unread_links, color: "#3b82f6" },
  ];

  return (
    <div className="flex items-center gap-3 px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]/50 overflow-x-auto">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ background: `${item.color}11`, border: `1px solid ${item.color}22` }}
        >
          <span style={{ color: item.color }}>{item.icon}</span>
          <span className="text-xs font-semibold text-[var(--text-primary)]">{item.value}</span>
          <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
