"use client";

import { Group, Stats } from "@/lib/api";
import {
  Zap, FolderOpen, Plus, Star, Globe,
  LayoutDashboard, Settings
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

const GROUP_ICONS: Record<string, React.ReactNode> = {
  folder: <FolderOpen size={15} />,
  globe: <Globe size={15} />,
  star: <Star size={15} />,
  zap: <Zap size={15} />,
};

interface SidebarProps {
  groups: Group[];
  selectedGroupId: string | null;
  onSelectGroup: (id: string | null) => void;
  onAddGroup: () => void;
  stats?: Stats;
  filterFavorites: boolean;
  onToggleFavorites: () => void;
}

export function Sidebar({
  groups,
  selectedGroupId,
  onSelectGroup,
  onAddGroup,
  stats,
  filterFavorites,
  onToggleFavorites,
}: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--volt-dim)", border: "1px solid rgba(57,255,20,0.3)" }}
          >
            <Zap size={16} className="text-[var(--volt)]" />
          </div>
          <div>
            <span className="font-bold text-[var(--text-primary)] text-base tracking-tight">
              Link<span className="text-[var(--volt)]">Vault</span>
            </span>
            <p className="text-[10px] text-[var(--text-muted)] leading-none mt-0.5">
              Powered by IA
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {/* All links */}
        <button
          onClick={() => { onSelectGroup(null); if (filterFavorites) onToggleFavorites(); }}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            !selectedGroupId && !filterFavorites
              ? "bg-[var(--volt-dim)] text-[var(--volt)] border border-[rgba(57,255,20,0.2)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          )}
        >
          <LayoutDashboard size={15} />
          <span>Todos os links</span>
          {stats && (
            <span className="ml-auto text-xs opacity-60">{stats.total_links}</span>
          )}
        </button>

        {/* Favorites */}
        <button
          onClick={onToggleFavorites}
          className={clsx(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
            filterFavorites
              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          )}
        >
          <Star size={15} />
          <span>Favoritos</span>
          {stats && (
            <span className="ml-auto text-xs opacity-60">{stats.favorite_links}</span>
          )}
        </button>

        {/* Groups */}
        <div className="pt-4 pb-1">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              Grupos
            </span>
            <button
              onClick={onAddGroup}
              className="text-[var(--text-muted)] hover:text-[var(--volt)] transition-colors"
              title="Criar grupo"
            >
              <Plus size={14} />
            </button>
          </div>

          {groups.length === 0 && (
            <p className="px-3 text-xs text-[var(--text-muted)] italic">
              Nenhum grupo criado
            </p>
          )}

          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => { onSelectGroup(group.id); if (filterFavorites) onToggleFavorites(); }}
              className={clsx(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                selectedGroupId === group.id
                  ? "bg-[var(--bg-hover)] text-[var(--text-primary)] border border-[var(--border-bright)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              <span
                className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                style={{ color: group.color, background: `${group.color}22` }}
              >
                {GROUP_ICONS[group.icon] || <FolderOpen size={12} />}
              </span>
              <span className="truncate flex-1 text-left">{group.name}</span>
              <span className="ml-auto text-xs opacity-50 group-hover:opacity-80">
                {group.links_count}
              </span>
            </button>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-[var(--border)] space-y-1">
        <p className="text-[10px] text-[var(--text-muted)] text-center mb-1">
          {stats?.total_links ?? 0} links · {stats?.total_groups ?? 0} grupos · {stats?.total_pdfs ?? 0} PDFs
        </p>
        <Link
          href="/settings"
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
            text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
        >
          <Settings size={14} />
          <span>Configurações</span>
        </Link>
      </div>
    </aside>
  );
}
