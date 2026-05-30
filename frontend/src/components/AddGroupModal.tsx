"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { groupsApi } from "@/lib/api";
import { X, FolderPlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#3b82f6", "#39ff14",
];

const PRESET_ICONS = ["folder", "globe", "star", "zap", "book", "code", "heart", "music"];

interface AddGroupModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AddGroupModal({ onClose, onSuccess }: AddGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [icon, setIcon] = useState("folder");

  const mutation = useMutation({
    mutationFn: groupsApi.create,
    onSuccess: () => {
      toast.success("Grupo criado!");
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Erro ao criar grupo";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate({ name: name.trim(), description, color, icon });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
              <FolderPlus size={18} style={{ color }} />
            </div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Criar grupo</h2>
          </div>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Nome *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tecnologia, Receitas, Estudos..."
              required
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--volt)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Descrição</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)]
                focus:outline-none focus:border-[var(--volt)] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">Cor</label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={clsx(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    color === c ? "border-white scale-110" : "border-transparent"
                  )}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm
                text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !name}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                bg-[var(--volt)] text-[var(--bg-primary)] disabled:opacity-50 transition-all"
              style={{ boxShadow: mutation.isPending ? "none" : "var(--volt-glow)" }}
            >
              {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Criar grupo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
