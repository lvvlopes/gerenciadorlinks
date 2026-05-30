"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, linksApi, statsApi, type Group, type Link } from "@/lib/api";
import { Sidebar } from "@/components/Sidebar";
import { LinkGrid } from "@/components/LinkGrid";
import { AddLinkModal } from "@/components/AddLinkModal";
import { LinkDetailModal } from "@/components/LinkDetailModal";
import { AddGroupModal } from "@/components/AddGroupModal";
import { StatsBar } from "@/components/StatsBar";
import { BulkImportModal } from "@/components/BulkImportModal";
import { SearchBar } from "@/components/SearchBar";
import {
  Plus, Zap, FileUp
} from "lucide-react";
import toast from "react-hot-toast";

export default function HomePage() {
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showAddLink, setShowAddLink] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [selectedLink, setSelectedLink] = useState<Link | null>(null);
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.list,
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: statsApi.get,
    refetchInterval: 30_000,
  });

  const { data: linksData, isLoading: linksLoading } = useQuery({
    queryKey: ["links", selectedGroupId, search, filterFavorites],
    queryFn: () =>
      linksApi.list({
        group_id: selectedGroupId || undefined,
        search: search || undefined,
        is_favorite: filterFavorites || undefined,
        page_size: 50,
      }),
  });

  const deleteLinkMutation = useMutation({
    mutationFn: linksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Link removido");
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: ({ id, is_favorite }: { id: string; is_favorite: boolean }) =>
      linksApi.update(id, { is_favorite }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["links"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        groups={groups}
        selectedGroupId={selectedGroupId}
        onSelectGroup={setSelectedGroupId}
        onAddGroup={() => setShowAddGroup(true)}
        stats={stats}
        filterFavorites={filterFavorites}
        onToggleFavorites={() => setFilterFavorites((v) => !v)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {/* Logo mark - only mobile */}
              <div className="md:hidden flex items-center gap-2">
                <Zap size={20} className="text-[var(--volt)]" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate">
                  {filterFavorites
                    ? "⭐ Favoritos"
                    : selectedGroup
                    ? selectedGroup.name
                    : "Todos os Links"}
                </h1>
                <p className="text-xs text-[var(--text-muted)]">
                  {linksData?.total ?? 0} link{linksData?.total !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <SearchBar value={search} onChange={setSearch} />
              <button
                onClick={() => setShowBulkImport(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                  border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--volt)]
                  hover:border-[var(--volt)] transition-all hidden sm:flex"
                title="Importar múltiplos links"
              >
                <FileUp size={15} />
                <span className="hidden md:inline">Importar</span>
              </button>
              <button
                onClick={() => setShowAddLink(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm
                  bg-[var(--volt)] text-[var(--bg-primary)] hover:bg-[#4dff28]
                  transition-all duration-200 whitespace-nowrap shadow-lg"
                style={{ boxShadow: "var(--volt-glow)" }}
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Adicionar link</span>
              </button>
            </div>
          </div>
        </header>

        {/* Stats bar */}
        {!selectedGroupId && !filterFavorites && (
          <StatsBar stats={stats} />
        )}

        {/* Link grid */}
        <main className="flex-1 overflow-y-auto p-6">
          <LinkGrid
            links={linksData?.items ?? []}
            isLoading={linksLoading}
            groups={groups}
            onSelectLink={setSelectedLink}
            onDeleteLink={(id) => deleteLinkMutation.mutate(id)}
            onToggleFavorite={(id, is_favorite) =>
              toggleFavoriteMutation.mutate({ id, is_favorite })
            }
          />
        </main>
      </div>

      {/* Modals */}
      {showAddLink && (
        <AddLinkModal
          groups={groups}
          defaultGroupId={selectedGroupId}
          onClose={() => setShowAddLink(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            setShowAddLink(false);
          }}
        />
      )}

      {showAddGroup && (
        <AddGroupModal
          onClose={() => setShowAddGroup(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["groups"] });
            setShowAddGroup(false);
          }}
        />
      )}

      {showBulkImport && (
        <BulkImportModal
          groups={groups}
          onClose={() => setShowBulkImport(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
            queryClient.invalidateQueries({ queryKey: ["stats"] });
            queryClient.invalidateQueries({ queryKey: ["groups"] });
          }}
        />
      )}

      {selectedLink && (
        <LinkDetailModal
          link={selectedLink}
          groups={groups}
          onClose={() => setSelectedLink(null)}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["links"] });
            setSelectedLink(null);
          }}
          onDelete={(id) => {
            deleteLinkMutation.mutate(id);
            setSelectedLink(null);
          }}
        />
      )}
    </div>
  );
}
