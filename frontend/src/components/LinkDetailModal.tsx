"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { linksApi, pdfsApi, Group, Link, PDF } from "@/lib/api";
import {
  X, ExternalLink, Star, Trash2, Edit3, FileText,
  Upload, Download, Eye, RefreshCw, Loader2, Check
} from "lucide-react";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import clsx from "clsx";

interface LinkDetailModalProps {
  link: Link;
  groups: Group[];
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (id: string) => void;
}

export function LinkDetailModal({
  link,
  groups,
  onClose,
  onUpdate,
  onDelete,
}: LinkDetailModalProps) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"info" | "pdfs">("info");
  const [editing, setEditing] = useState(false);
  const [customTitle, setCustomTitle] = useState(link.custom_title || "");
  const [customNotes, setCustomNotes] = useState(link.custom_notes || "");
  const [groupId, setGroupId] = useState(link.group_id || "");
  const [viewingPdf, setViewingPdf] = useState<PDF | null>(null);

  // Fetch full link with PDFs
  const { data: fullLink, refetch } = useQuery({
    queryKey: ["link", link.id],
    queryFn: () => linksApi.get(link.id),
    initialData: link,
  });

  const pdfs = fullLink?.pdfs || [];

  const updateMutation = useMutation({
    mutationFn: (data: any) => linksApi.update(link.id, data),
    onSuccess: () => {
      toast.success("Link atualizado");
      refetch();
      onUpdate();
      setEditing(false);
    },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const uploadPdfMutation = useMutation({
    mutationFn: ({ file, desc }: { file: File; desc?: string }) =>
      pdfsApi.upload(link.id, file, desc),
    onSuccess: () => {
      toast.success("PDF enviado com sucesso");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: () => toast.error("Erro ao enviar PDF"),
  });

  const deletePdfMutation = useMutation({
    mutationFn: pdfsApi.delete,
    onSuccess: () => {
      toast.success("PDF removido");
      refetch();
      queryClient.invalidateQueries({ queryKey: ["links"] });
    },
    onError: () => toast.error("Erro ao remover PDF"),
  });

  const regenerateMutation = useMutation({
    mutationFn: (provider: string) => linksApi.regenerateSummary(link.id, provider),
    onSuccess: () => {
      toast.success("Resumo regenerado");
      refetch();
    },
    onError: () => toast.error("Erro ao regenerar resumo"),
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      uploadPdfMutation.mutate({ file });
    });
  }, [uploadPdfMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 50 * 1024 * 1024,
  });

  const handleSave = () => {
    updateMutation.mutate({
      custom_title: customTitle || null,
      custom_notes: customNotes || null,
      group_id: groupId || null,
    });
  };

  const group = groups.find((g) => g.id === fullLink?.group_id);

  if (viewingPdf) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg-primary)]">
        <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-[var(--volt)]" />
            <span className="text-sm font-medium text-[var(--text-primary)] truncate max-w-md">
              {viewingPdf.filename}
            </span>
            {viewingPdf.pages && (
              <span className="text-xs text-[var(--text-muted)]">
                {viewingPdf.pages} páginas
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <a
              href={pdfsApi.downloadUrl(viewingPdf.id)}
              download={viewingPdf.filename}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--volt)]
                hover:border-[var(--volt)] transition-all"
            >
              <Download size={13} />
              Download
            </a>
            <button
              onClick={() => setViewingPdf(null)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                transition-all"
            >
              <X size={13} />
              Fechar
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <iframe
            src={pdfsApi.viewUrl(viewingPdf.id)}
            className="w-full h-full"
            title={viewingPdf.filename}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[var(--border)]">
          <div className="flex-1 min-w-0 pr-4">
            {editing ? (
              <input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder={link.title}
                className="w-full text-base font-semibold bg-transparent border-b border-[var(--volt)]
                  text-[var(--text-primary)] focus:outline-none pb-0.5"
              />
            ) : (
              <h2 className="text-base font-semibold text-[var(--text-primary)] line-clamp-2">
                {fullLink?.display_title}
              </h2>
            )}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {group && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ background: `${group.color}22`, color: group.color }}
                >
                  {group.name}
                </span>
              )}
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--volt)] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={11} />
                <span className="truncate max-w-[200px]">
                  {new URL(link.url).hostname}
                </span>
              </a>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => updateMutation.mutate({ is_favorite: !fullLink?.is_favorite })}
              className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                fullLink?.is_favorite
                  ? "text-yellow-400 bg-yellow-400/10"
                  : "text-[var(--text-muted)] hover:text-yellow-400 hover:bg-yellow-400/10"
              )}
            >
              <Star size={15} fill={fullLink?.is_favorite ? "currentColor" : "none"} />
            </button>
            <button
              onClick={() => setEditing((v) => !v)}
              className={clsx(
                "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                editing
                  ? "text-[var(--volt)] bg-[var(--volt-dim)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              )}
            >
              <Edit3 size={15} />
            </button>
            <button
              onClick={() => { if (confirm("Remover este link?")) onDelete(link.id); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 size={15} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-all"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border)] px-5">
          {(["info", "pdfs"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                "px-4 py-3 text-sm font-medium border-b-2 transition-all -mb-px",
                tab === t
                  ? "border-[var(--volt)] text-[var(--volt)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {t === "info" ? "Informações" : `PDFs (${pdfs.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === "info" && (
            <div className="space-y-4">
              {/* Summary */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    Resumo IA
                  </span>
                  <button
                    onClick={() => regenerateMutation.mutate(link.llm_provider)}
                    disabled={regenerateMutation.isPending}
                    className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--volt)]
                      transition-colors"
                  >
                    <RefreshCw size={11} className={regenerateMutation.isPending ? "animate-spin" : ""} />
                    Regenerar
                  </button>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed bg-[var(--bg-secondary)]
                  rounded-lg p-3 border border-[var(--border)]">
                  {fullLink?.summary || "Sem resumo disponível."}
                </p>
              </div>

              {/* Tags */}
              {fullLink?.tags && fullLink.tags.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {fullLink.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-lg"
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
                </div>
              )}

              {/* Group selector (edit mode) */}
              {editing && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                    Grupo
                  </label>
                  <select
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]
                      text-[var(--text-primary)] text-sm focus:outline-none focus:border-[var(--volt)] transition-colors"
                  >
                    <option value="">Sem grupo</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                  Minhas anotações
                </span>
                {editing ? (
                  <textarea
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={4}
                    placeholder="Suas anotações pessoais..."
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--volt)]
                      text-[var(--text-primary)] text-sm focus:outline-none resize-none"
                  />
                ) : (
                  <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-secondary)]
                    rounded-lg p-3 border border-[var(--border)] min-h-[60px] whitespace-pre-wrap">
                    {fullLink?.custom_notes || (
                      <span className="text-[var(--text-muted)] italic">Nenhuma anotação</span>
                    )}
                  </p>
                )}
              </div>

              {/* Save button */}
              {editing && (
                <button
                  onClick={handleSave}
                  disabled={updateMutation.isPending}
                  className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2
                    bg-[var(--volt)] text-[var(--bg-primary)] hover:bg-[#4dff28] disabled:opacity-50 transition-all"
                >
                  {updateMutation.isPending ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Check size={15} />
                  )}
                  Salvar alterações
                </button>
              )}
            </div>
          )}

          {tab === "pdfs" && (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={clsx(
                  "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
                  isDragActive
                    ? "border-[var(--volt)] bg-[var(--volt-dim)]"
                    : "border-[var(--border)] hover:border-[var(--volt)] hover:bg-[var(--volt-dim)]"
                )}
              >
                <input {...getInputProps()} />
                <Upload size={24} className={clsx("mx-auto mb-2", isDragActive ? "text-[var(--volt)]" : "text-[var(--text-muted)]")} />
                {uploadPdfMutation.isPending ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-[var(--volt)]">
                    <Loader2 size={14} className="animate-spin" />
                    Enviando PDF...
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {isDragActive ? "Solte o PDF aqui" : "Arraste um PDF ou clique para selecionar"}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Máximo 50MB</p>
                  </>
                )}
              </div>

              {/* PDF list */}
              {pdfs.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">
                  Nenhum PDF anexado ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {pdfs.map((pdf) => (
                    <div
                      key={pdf.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={16} className="text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {pdf.filename}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {pdf.pages ? `${pdf.pages} páginas · ` : ""}
                          {(pdf.file_size / 1024 / 1024).toFixed(1)} MB
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingPdf(pdf)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                            hover:text-[var(--volt)] hover:bg-[var(--volt-dim)] transition-all"
                          title="Visualizar"
                        >
                          <Eye size={13} />
                        </button>
                        <a
                          href={pdfsApi.downloadUrl(pdf.id)}
                          download={pdf.filename}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                            hover:text-blue-400 hover:bg-blue-400/10 transition-all"
                          title="Download"
                        >
                          <Download size={13} />
                        </a>
                        <button
                          onClick={() => {
                            if (confirm("Remover este PDF?"))
                              deletePdfMutation.mutate(pdf.id);
                          }}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[var(--text-muted)]
                            hover:text-red-400 hover:bg-red-400/10 transition-all"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
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
