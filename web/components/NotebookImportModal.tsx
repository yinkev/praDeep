"use client";

import { useState, useEffect } from "react";
import {
  X,
  BookOpen,
  Search,
  ChevronRight,
  ChevronDown,
  Loader2,
  Check,
  FileText,
  Calendar,
} from "lucide-react";
import { apiUrl } from "@/lib/api";

interface Notebook {
  id: string;
  name: string;
  description: string;
  record_count: number;
  color: string;
  updated_at?: string;
}

interface NotebookRecord {
  id: string;
  title: string;
  user_query: string;
  output: string;
  type: string;
  created_at?: string;
}

interface NotebookImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: string, records: NotebookRecord[]) => void;
  title?: string;
}

export default function NotebookImportModal({
  isOpen,
  onClose,
  onImport,
  title = "Import from Notebooks",
}: NotebookImportModalProps) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNotebooks, setExpandedNotebooks] = useState<Set<string>>(
    new Set(),
  );
  const [notebookRecords, setNotebookRecords] = useState<
    Map<string, NotebookRecord[]>
  >(new Map());
  const [loadingRecords, setLoadingRecords] = useState<Set<string>>(new Set());
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set(),
  ); // Record IDs
  const [selectedRecordsData, setSelectedRecordsData] = useState<
    NotebookRecord[]
  >([]);

  useEffect(() => {
    if (isOpen) {
      fetchNotebooks();
    } else {
      // Reset state on close
      setSelectedRecords(new Set());
      setSelectedRecordsData([]);
      setExpandedNotebooks(new Set());
    }
  }, [isOpen]);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const res = await fetch(apiUrl("/api/v1/notebook/list"));
      if (res.ok) {
        const data = await res.json();
        const validNotebooks = (data.notebooks || []).filter(
          (nb: Notebook) => nb.record_count > 0,
        );
        setNotebooks(validNotebooks);
      }
    } catch (error) {
      console.error("Failed to fetch notebooks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecords = async (notebookId: string) => {
    if (notebookRecords.has(notebookId)) return;

    setLoadingRecords((prev) => new Set(prev).add(notebookId));
    try {
      const res = await fetch(apiUrl(`/api/v1/notebook/${notebookId}`));
      if (res.ok) {
        const data = await res.json();
        setNotebookRecords((prev) =>
          new Map(prev).set(notebookId, data.records || []),
        );
      }
    } catch (error) {
      console.error(
        `Failed to fetch records for notebook ${notebookId}:`,
        error,
      );
    } finally {
      setLoadingRecords((prev) => {
        const next = new Set(prev);
        next.delete(notebookId);
        return next;
      });
    }
  };

  const toggleNotebook = (notebookId: string) => {
    setExpandedNotebooks((prev) => {
      const next = new Set(prev);
      if (next.has(notebookId)) {
        next.delete(notebookId);
      } else {
        next.add(notebookId);
        fetchRecords(notebookId);
      }
      return next;
    });
  };

  const toggleRecordSelection = (record: NotebookRecord) => {
    setSelectedRecords((prev) => {
      const next = new Set(prev);
      if (next.has(record.id)) {
        next.delete(record.id);
        setSelectedRecordsData((current) =>
          current.filter((r) => r.id !== record.id),
        );
      } else {
        next.add(record.id);
        setSelectedRecordsData((current) => [...current, record]);
      }
      return next;
    });
  };

  const handleImport = () => {
    // Merge content: combine outputs or user_queries + outputs
    // For now, let's combine title + output
    const mergedContent = selectedRecordsData
      .map((r) => `# ${r.title}\n\n${r.output}`)
      .join("\n\n---\n\n");

    onImport(mergedContent, selectedRecordsData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 supports-[backdrop-filter]:bg-black/40 supports-[backdrop-filter]:backdrop-blur-md">
      <div className="w-[800px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-white/90 dark:bg-zinc-950/80 dark:text-zinc-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-white/40 dark:border-white/10 backdrop-blur-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/60 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-100 dark:bg-sky-500/15 rounded-xl">
              <BookOpen className="w-5 h-5 text-sky-600" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-zinc-50">{title}</h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                Select content from your notebooks to import
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500 dark:text-zinc-300" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Notebooks List */}
          <div className="w-1/3 border-r border-slate-100 dark:border-white/10 overflow-y-auto bg-slate-50/30 dark:bg-white/5 p-2 space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : notebooks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No notebooks found
              </div>
            ) : (
              notebooks.map((nb) => (
                <button
                  key={nb.id}
                  type="button"
                  onClick={() => toggleNotebook(nb.id)}
                  aria-expanded={expandedNotebooks.has(nb.id)}
                  className={`w-full p-3 rounded-xl text-left transition-all border focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ${
                    expandedNotebooks.has(nb.id)
                      ? "bg-white/80 dark:bg-white/5 border-sky-200/80 dark:border-sky-400/30 shadow-sm"
                      : "bg-transparent hover:bg-white/70 dark:hover:bg-white/5 border-transparent hover:border-slate-200/80 dark:hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {expandedNotebooks.has(nb.id) ? (
                      <ChevronDown className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400 dark:text-zinc-500" />
                    )}
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: nb.color || "#94a3b8" }}
                    />
                    <span className="font-medium text-sm text-slate-700 dark:text-zinc-100 truncate flex-1">
                      {nb.name}
                    </span>
                  </div>
                  <div className="pl-6 text-xs text-slate-400 dark:text-zinc-500 flex justify-between">
                    <span>{nb.record_count} records</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Records List */}
          <div className="flex-1 overflow-y-auto p-4 bg-white/30 dark:bg-zinc-950/20">
            {expandedNotebooks.size === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-zinc-500">
                <BookOpen className="w-12 h-12 mb-3 opacity-20" />
                <p>Select a notebook to view records</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Array.from(expandedNotebooks).map((nbId) => {
                  const nb = notebooks.find((n) => n.id === nbId);
                  const records = notebookRecords.get(nbId);
                  const isLoading = loadingRecords.has(nbId);

                  if (!nb) return null;

                  return (
                    <div
                      key={nbId}
                      className="animate-in fade-in slide-in-from-bottom-2"
                    >
                      <h3 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider mb-2 pl-1 sticky top-0 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md py-2 z-10 flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: nb.color }}
                        />
                        {nb.name}
                      </h3>

                      {isLoading ? (
                        <div className="py-4 flex justify-center">
                          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                        </div>
                      ) : !records || records.length === 0 ? (
                        <div className="py-4 text-center text-xs text-slate-400 italic">
                          No records
                        </div>
                      ) : (
                        <div className="grid gap-2">
                          {records.map((record) => (
                            <button
                              key={record.id}
                              type="button"
                              onClick={() => toggleRecordSelection(record)}
                              aria-pressed={selectedRecords.has(record.id)}
                              className={`w-full p-3 rounded-xl border text-left transition-all group focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 ${
                                selectedRecords.has(record.id)
                                  ? "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-400/30 ring-1 ring-sky-200/80 dark:ring-sky-400/20"
                                  : "bg-white/80 dark:bg-zinc-950/40 border-slate-200 dark:border-white/10 hover:border-sky-200 dark:hover:border-sky-400/30 hover:shadow-sm dark:hover:bg-white/5"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                    selectedRecords.has(record.id)
                                      ? "bg-sky-500 border-sky-500 text-white"
                                      : "border-slate-300 dark:border-white/20 group-hover:border-sky-300 dark:group-hover:border-sky-400/40"
                                  }`}
                                >
                                  {selectedRecords.has(record.id) && (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-medium text-slate-900 dark:text-zinc-100 truncate mb-0.5">
                                    {record.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2">
                                    {record.output}
                                  </p>
                                  <div className="mt-2 flex items-center gap-2">
                                    <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-zinc-400 text-[10px] rounded-md font-medium uppercase">
                                      {record.type}
                                    </span>
                                    {record.created_at && (
                                      <span className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(
                                          record.created_at,
                                        ).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-white/5 backdrop-blur-md flex justify-between items-center">
          <div className="text-sm text-slate-500 dark:text-zinc-400">
            Selected{" "}
            <span className="font-bold text-slate-900 dark:text-zinc-50">
              {selectedRecords.size}
            </span>{" "}
            items
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-zinc-300 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={selectedRecords.size === 0}
              className="px-4 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Import Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
