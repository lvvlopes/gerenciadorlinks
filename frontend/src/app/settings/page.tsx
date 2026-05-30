"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { groupsApi, llmApi, linksApi } from "@/lib/api";
import {
  Settings, Trash2, Edit3, Check, X, ChevronLeft,
  Zap, Database, Globe, Bot, AlertTriangle, Loader2
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import clsx from "clsx";

const PROVIDER_INFO: Record<string, { name: string; color: string; docs: string }> = {
  anthropic: {
    name: "Anthropic Claude",
    color: "#d97706",
    docs: "https://console.anthropic.com/",
  },
  openai: {
    name: "OpenAI GPT",
    color: "#10a37f",
    docs: "https://platform.openai.com/api-keys",
  },
  ollama: {
    name: "Ollama (Local)",
    color: "#7c3aed",
    docs: "https://ollama.ai/",
  },
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState("");
  const [editGroupColor, setEditGroupColor] = useState("");

  const { data: groups = [] } = useQuery({
    queryKey: ["groups"],
    queryFn: groupsApi.list,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ["llm-providers"],
    queryFn: llmApi.providers,
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      setEditGroupId(null);
      toast.success("Grupo atualizado");
    },
    onError: () => toast.error("Erro ao atualizar grupo"),
  });

  const deleteGroupMutation = useMutation({
    mutationFn: groupsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Grupo removido");
    },
    onError: () => toast.error("Erro ao remover grupo"),
  });

  const startEdit = (group: any) => {
    setEditGroupId(group.id);
    setEditGroupName(group.name);
    setEditGroupColor(group.color);
  };

  const saveEdit = () => {
    if (!editGroupId) return;
    updateGroupMutation.mutate({
      id: editGroupId,
      data: { name: editGroupName, color: editGroupColor },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--volt)] transition-colors text-sm"
          >
            <ChevronLeft size={16} />
            Voltar
          </Link>
          <div className="h-4 w-px bg-[var(--border)]" />
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[var(--volt)]" />
            <span className="font-semibold text-[var(--text-primary)]">Configurações</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {/* LLM Providers */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] mb-4">
            <Bot size={16} className="text-[var(--volt)]" />
            Provedores de IA
          </h2>
          <div className="space-y-3">
            {Object.entries(PROVIDER_INFO).map(([id, info]) => {
              const provider = providers.find((p: any) => p.id === id);
              const available = provider?.available ?? false;
              return (
                <div
                  key={id}
                  className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                      style={{ background: `${info.color}22`, color: info.color }}
                    >
                      {id[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {info.name}
                      </p>
                      {provider && (
                        <p className="text-xs text-[var(--text-muted)] font-mono">
                          {provider.model}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <a
                      href={info.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--text-muted)] hover:text-[var(--volt)] transition-colors"
                    >
                      Docs ↗
                    </a>
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        available
                          ? "bg-green-500/15 text-green-400"
                          : "bg-red-500/15 text-red-400"
                      )}
                    >
                      {available ? "✓ Disponível" : "✗ Não configurado"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">
              <span className="text-yellow-400">⚠</span> Configure as chaves de API no arquivo{" "}
              <code className="font-mono text-[var(--volt)] bg-[var(--volt-dim)] px-1 rounded">
                backend/.env
              </code>{" "}
              para ativar os provedores. Reinicie o backend após alterações.
            </p>
          </div>
        </section>

        {/* Groups Management */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold text-[var(--text-primary)] mb-4">
            <Database size={16} className="text-[var(--volt)]" />
            Gerenciar grupos ({groups.length})
          </h2>

          {groups.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] italic p-4 border border-[var(--border)] rounded-xl">
              Nenhum grupo criado ainda. Crie grupos na tela principal.
            </p>
          ) : (
            <div className="space-y-2">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)]"
                >
                  {/* Color dot */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: editGroupId === group.id ? editGroupColor : group.color }}
                  />

                  {/* Name */}
                  {editGroupId === group.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        value={editGroupName}
                        onChange={(e) => setEditGroupName(e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-[var(--bg-secondary)] border border-[var(--volt)]
                          text-[var(--text-primary)] text-sm focus:outline-none"
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditGroupId(null); }}
                        autoFocus
                      />
                      <input
                        type="color"
                        value={editGroupColor}
                        onChange={(e) => setEditGroupColor(e.target.value)}
                        className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                      />
                    </div>
                  ) : (
                    <div className="flex-1">
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {group.name}
                      </span>
                      {group.description && (
                        <span className="text-xs text-[var(--text-muted)] ml-2">
                          {group.description}
                        </span>
                      )}
                    </div>
                  )}

                  <span className="text-xs text-[var(--text-muted)]">
                    {group.links_count} link{group.links_count !== 1 ? "s" : ""}
                  </span>

                  {/* Actions */}
                  {editGroupId === group.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={saveEdit}
                        disabled={updateGroupMutation.isPending}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-green-400
                          hover:bg-green-400/10 transition-all"
                      >
                        {updateGroupMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      </button>
                      <button
                        onClick={() => setEditGroupId(null)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                          hover:bg-[var(--bg-hover)] transition-all"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(group)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                          hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Remover o grupo "${group.name}"? Os links serão mantidos sem grupo.`))
                            deleteGroupMutation.mutate(group.id);
                        }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                          hover:text-red-400 hover:bg-red-400/10 transition-all"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="flex items-center gap-2 text-base font-semibold text-red-400 mb-4">
            <AlertTriangle size={16} />
            Zona de risco
          </h2>
          <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5">
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Estas ações são irreversíveis. Tenha cuidado.
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              Para fazer backup dos dados, exporte direto do PostgreSQL:<br />
              <code className="font-mono text-[var(--volt)]">
                pg_dump linkvault &gt; backup.sql
              </code>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
