"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, Group, llmApi } from "@/lib/api";
import { X, Upload, CheckCircle, XCircle, Loader2, FileUp } from "lucide-react";
import toast from "react-hot-toast";
import clsx from "clsx";

interface BulkImportModalProps {
  groups: Group[];
  onClose: () => void;
  onSuccess: () => void;
}

export function BulkImportModal({ groups, onClose, onSuccess }: BulkImportModalProps) {
  const [urlsText, setUrlsText] = useState("");
  const [groupId, setGroupId] = useState("");
  const [provider, setProvider] = useState("anthropic");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);

  const { data: providers = [] } = useQuery({
    queryKey: ["llm-providers"],
    queryFn: llmApi.providers,
  });

  // Poll job status
  useEffect(() => {
    if (!jobId) return;
    const interval = setInterval(async () => {
      const r = await api.get(`/api/bulk-import/${jobId}`);
      setJobStatus(r.data);
      if (r.data.done) {
        clearInterval(interval);
        if (r.data.success > 0) onSuccess();
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [jobId]);

  const startImport = async () => {
    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));

    if (urls.length === 0) {
      toast.error("Nenhuma URL válida encontrada");
      return;
    }

    const r = await api.post("/api/bulk-import", {
      urls,
      group_id: groupId || undefined,
      llm_provider: provider,
    });
    setJobId(r.data.job_id);
    setJobStatus({ total: r.data.total, processed: 0, success: 0, failed: 0, errors: [], done: false });
  };

  const urlCount = urlsText
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u.startsWith("http")).length;

  const availableProviders = (providers as any[]).filter((p) => p.available);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={!jobId ? onClose : undefined} />
      <div className="relative w-full max-w-lg bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--volt-dim)]">
              <FileUp size={18} className="text-[var(--volt)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Importação em lote</h2>
              <p className="text-xs text-[var(--text-muted)]">Cole uma URL por linha (máx. 50)</p>
            </div>
          </div>
          {!jobId && (
            <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">
          {!jobId ? (
            <>
              <textarea
                value={urlsText}
                onChange={(e) => setUrlsText(e.target.value)}
                placeholder={"https://exemplo.com/artigo\nhttps://github.com/repo\nhttps://medium.com/post"}
                rows={8}
                className="w-full px-3 py-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                  text-[var(--text-primary)] text-sm font-mono placeholder:text-[var(--text-muted)] placeholder:font-sans
                  focus:outline-none focus:border-[var(--volt)] transition-colors resize-none"
              />
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{urlCount} URL{urlCount !== 1 ? "s" : ""} detectada{urlCount !== 1 ? "s" : ""}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Grupo</label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                      text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--volt)] transition-colors"
                  >
                    <option value="">Sem grupo</option>
                    {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Resumir com</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                      text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--volt)] transition-colors"
                  >
                    {availableProviders.length === 0
                      ? <option value="anthropic">Claude</option>
                      : availableProviders.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)
                    }
                  </select>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-lg border border-[var(--border)] text-sm
                  text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all">
                  Cancelar
                </button>
                <button
                  onClick={startImport}
                  disabled={urlCount === 0}
                  className="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                    bg-[var(--volt)] text-[var(--bg-primary)] disabled:opacity-40 transition-all"
                  style={{ boxShadow: urlCount > 0 ? "var(--volt-glow)" : "none" }}
                >
                  <Upload size={15} />
                  Importar {urlCount > 0 ? urlCount : ""} link{urlCount !== 1 ? "s" : ""}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--text-secondary)]">Progresso</span>
                  <span className="text-[var(--text-primary)] font-medium">
                    {jobStatus?.processed ?? 0} / {jobStatus?.total ?? 0}
                  </span>
                </div>
                <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${jobStatus ? (jobStatus.processed / jobStatus.total) * 100 : 0}%`,
                      background: "var(--volt)",
                      boxShadow: "var(--volt-glow)",
                    }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Processados", value: jobStatus?.processed ?? 0, color: "var(--text-primary)" },
                  { label: "Sucesso", value: jobStatus?.success ?? 0, color: "#22c55e" },
                  { label: "Erros", value: jobStatus?.failed ?? 0, color: "#ef4444" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                    <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Status */}
              {jobStatus?.done ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle size={16} />
                    Importação concluída!
                  </div>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-[var(--volt)] text-[var(--bg-primary)] text-sm font-medium"
                  >
                    Fechar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <Loader2 size={14} className="animate-spin text-[var(--volt)]" />
                  Processando links... Isso pode levar alguns minutos.
                </div>
              )}

              {/* Errors */}
              {jobStatus?.errors?.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {jobStatus.errors.map((err: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-xs p-2 rounded-lg bg-red-500/10">
                      <XCircle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-red-400 truncate">{err.url}</p>
                        <p className="text-[var(--text-muted)]">{err.error}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
