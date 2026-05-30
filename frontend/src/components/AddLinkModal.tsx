"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { linksApi, llmApi, Group } from "@/lib/api";
import { X, Link2, Loader2, Zap, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface AddLinkModalProps {
  groups: Group[];
  defaultGroupId?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLinkModal({ groups, defaultGroupId, onClose, onSuccess }: AddLinkModalProps) {
  const [url, setUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [groupId, setGroupId] = useState(defaultGroupId || "");
  const [provider, setProvider] = useState("anthropic");

  const { data: providers = [] } = useQuery({
    queryKey: ["llm-providers"],
    queryFn: llmApi.providers,
  });

  const mutation = useMutation({
    mutationFn: linksApi.create,
    onSuccess: () => {
      toast.success("Link adicionado com sucesso!");
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Erro ao adicionar link";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    mutation.mutate({
      url: url.trim(),
      custom_title: customTitle || undefined,
      custom_notes: customNotes || undefined,
      group_id: groupId || undefined,
      llm_provider: provider,
    });
  };

  const availableProviders = providers.filter((p) => p.available);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "var(--volt-dim)" }}
            >
              <Link2 size={18} className="text-[var(--volt)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Adicionar link
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                A IA vai gerar um resumo automaticamente
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* URL */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--volt)] transition-colors"
            />
          </div>

          {/* Custom title */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Título personalizado (opcional)
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="Deixe em branco para usar o título original"
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--volt)] transition-colors"
            />
          </div>

          {/* Group + Provider row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Grupo
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                  text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--volt)]
                  transition-colors appearance-none"
              >
                <option value="">Sem grupo</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                Resumir com
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                  text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--volt)]
                  transition-colors appearance-none"
              >
                {availableProviders.length === 0 ? (
                  <option value="anthropic">Claude (Anthropic)</option>
                ) : (
                  availableProviders.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              Anotações pessoais (opcional)
            </label>
            <textarea
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              placeholder="Suas anotações sobre este link..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--volt)] transition-colors resize-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm
                text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)]
                transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !url}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                bg-[var(--volt)] text-[var(--bg-primary)] hover:bg-[#4dff28] disabled:opacity-50
                disabled:cursor-not-allowed transition-all"
              style={{ boxShadow: mutation.isPending ? "none" : "var(--volt-glow)" }}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Zap size={15} />
                  Adicionar e resumir
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
