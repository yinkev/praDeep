"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Wand2,
  Minimize2,
  Maximize2,
  Globe,
  Database,
  Loader2,
  X,
  History,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Highlighter,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Link,
  Image as ImageIcon,
  Table,
  Minus,
  Download,
  FileText,
  PenTool,
  Sparkles,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  AlertCircle,
  Book,
  Mic,
  Headphones,
  Radio,
  ChevronDown,
  ChevronRight,
  Import,
  Zap,
  Save,
} from "lucide-react";
import AddToNotebookModal from "./AddToNotebookModal";
import NotebookImportModal from "./NotebookImportModal";
import { apiUrl } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";
import "katex/dist/katex.min.css";
import { processLatexContent } from "@/lib/latex";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Button, IconButton } from "./ui/Button";

interface CoWriterEditorProps {
  initialValue?: string;
}

const AI_MARK_REGEX = /<span\s+data-rough-notation="[^"]+">([^<]*)<\/span>/g;

export default function CoWriterEditor({
  initialValue = "",
}: CoWriterEditorProps) {
  const [content, setContent] = useState(
    initialValue ||
      "# Welcome to Co-Writer\n\nSelect text to see the magic happen.\n\n## Features\n\n- **Bold** text with Ctrl+B\n- *Italic* text with Ctrl+I\n- <u>Underline</u> with Ctrl+U\n- <mark>Highlight</mark> with Ctrl+H\n- AI-powered editing and auto-marking\n",
  );
  const [selection, setSelection] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);
  const [popover, setPopover] = useState<{
    visible: boolean;
    x: number;
    y: number;
  } | null>(null);
  const [instruction, setInstruction] = useState("");
  const [selectedAction, setSelectedAction] = useState<
    "rewrite" | "shorten" | "expand" | "automark"
  >("rewrite");
  const [source, setSource] = useState<"rag" | "web" | null>(null);
  const [selectedKb, setSelectedKb] = useState("");
  const [kbs, setKbs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationHistory, setOperationHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [hideAiMarks, setHideAiMarks] = useState(false);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);
  const [showNotebookModal, setShowNotebookModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const checkBackendConnection = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/v1/co_writer/history"));
      setBackendConnected(res.ok);
      return res.ok;
    } catch (e) {
      setBackendConnected(false);
      return false;
    }
  }, []);

  useEffect(() => {
    checkBackendConnection();
    fetch(apiUrl("/api/v1/knowledge/list"))
      .then(res => res.json())
      .then(data => {
        const names = data.map((kb: any) => kb.name);
        setKbs(names);
        if (names.length > 0) setSelectedKb(names[0]);
      })
      .catch(() => {});
  }, [checkBackendConnection]);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/api/v1/co_writer/history"));
      if (res.ok) {
        const data = await res.json();
        setOperationHistory(data.history || []);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleEditorScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    const editor = editorContainerRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    isSyncingScroll.current = true;
    const scrollPercentage = editor.scrollTop / (editor.scrollHeight - editor.clientHeight);
    preview.scrollTop = scrollPercentage * (preview.scrollHeight - preview.clientHeight);

    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, []);

  const handlePreviewScroll = useCallback(() => {
    if (isSyncingScroll.current) return;
    const editor = editorContainerRef.current;
    const preview = previewRef.current;
    if (!editor || !preview) return;

    isSyncingScroll.current = true;
    const scrollPercentage = preview.scrollTop / (preview.scrollHeight - preview.clientHeight);
    editor.scrollTop = scrollPercentage * (editor.scrollHeight - editor.clientHeight);

    requestAnimationFrame(() => {
      isSyncingScroll.current = false;
    });
  }, []);

  const getDisplayContent = useCallback(() => {
    if (!hideAiMarks) return content;
    return content.replace(AI_MARK_REGEX, "$1");
  }, [content, hideAiMarks]);

  const handleContentChange = (newValue: string) => {
    setContent(newValue);
  };

  const wrapSelection = useCallback((before: string, after: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    if (selectedText.length === 0) return;

    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, end + before.length);
    }, 0);
  }, [content]);

  const toggleLinePrefix = useCallback((prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lines = content.split("\n");

    let charCount = 0;
    let startLine = 0;
    let endLine = 0;

    for (let i = 0; i < lines.length; i++) {
      if (charCount <= start && start <= charCount + lines[i].length) startLine = i;
      if (charCount <= end && end <= charCount + lines[i].length) {
        endLine = i;
        break;
      }
      charCount += lines[i].length + 1;
    }

    const newLines = [...lines];
    for (let i = startLine; i <= endLine; i++) {
      if (newLines[i].startsWith(prefix)) {
        newLines[i] = newLines[i].substring(prefix.length);
      } else {
        newLines[i] = prefix + newLines[i];
      }
    }

    setContent(newLines.join("\n"));
  }, [content]);

  const handleMouseUp = (e: React.MouseEvent) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value.substring(start, end);

    if (text.trim().length > 0) {
      setSelection({ start, end, text });
      setPopover({ visible: true, x: e.clientX, y: e.clientY + 10 });
    } else {
      setPopover(null);
      setSelection(null);
    }
  };

  const handleAction = async (action: string) => {
    if (!selection) return;
    setIsProcessing(true);

    try {
      const apiEndpoint = action === "automark" ? "/api/v1/co_writer/automark" : "/api/v1/co_writer/edit";
      const res = await fetch(apiUrl(apiEndpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: selection.text,
          instruction: instruction || `Please ${action} this text.`,
          action,
          source,
          kb_name: source === "rag" ? selectedKb : undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to process action");

      const data = await res.json();
      const editedText = data.edited_text || data.marked_text;

      const newContent =
        content.substring(0, selection.start) +
        editedText +
        content.substring(selection.end);

      setContent(newContent);
      setPopover(null);
      setSelection(null);
      fetchHistory();
    } catch (e) {
      alert("Error processing action. Ensure backend is running.");
    } finally {
      setIsProcessing(false);
    }
  };

  const ToolbarButton = ({
    icon,
    onClick,
    title,
    active,
  }: {
    icon: React.ReactNode;
    onClick: () => void;
    title: string;
    active?: boolean;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "p-1.5 rounded-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/20",
        active
          ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
          : "text-text-tertiary hover:bg-surface-elevated hover:text-text-primary"
      )}
    >
      {icon}
    </button>
  );

  const Divider = () => <div className="w-px h-5 bg-border mx-1" />;

  return (
    <div className="flex h-full gap-6">
      {/* Left Column: Editor */}
      <div className="flex-1 flex flex-col bg-surface-base rounded-2xl shadow-glass-sm border border-border overflow-hidden relative">
        <div className="p-2 border-b border-border bg-surface-secondary/30 flex items-center gap-1 flex-wrap">
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={<Bold size={16} />} onClick={() => wrapSelection("**", "**")} title="Bold" />
            <ToolbarButton icon={<Italic size={16} />} onClick={() => wrapSelection("*", "*")} title="Italic" />
            <ToolbarButton icon={<UnderlineIcon size={16} />} onClick={() => wrapSelection("<u>", "</u>")} title="Underline" />
            <ToolbarButton icon={<Highlighter size={16} />} onClick={() => wrapSelection("<mark>", "</mark>")} title="Highlight" />
          </div>
          <Divider />
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={<Heading1 size={16} />} onClick={() => toggleLinePrefix("# ")} title="H1" />
            <ToolbarButton icon={<Heading2 size={16} />} onClick={() => toggleLinePrefix("## ")} title="H2" />
          </div>
          <Divider />
          <div className="flex items-center gap-0.5">
            <ToolbarButton icon={<List size={16} />} onClick={() => toggleLinePrefix("- ")} title="List" />
            <ToolbarButton icon={<Quote size={16} />} onClick={() => toggleLinePrefix("> ")} title="Quote" />
          </div>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-primary hover:bg-accent-primary/5 border border-transparent hover:border-accent-primary/20 rounded-full transition-all"
          >
            <Import size={14} />
            Import
          </button>
          <div className={cn(
            "flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
            backendConnected ? "bg-success-muted/10 text-success border-success/20" : "bg-error-muted/10 text-error border-error/20"
          )}>
            {backendConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden sm:inline">{backendConnected ? "Live" : "Offline"}</span>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-border bg-surface-secondary/20 flex justify-between items-center">
            <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Editor</span>
            <span className="text-[10px] font-mono text-text-quaternary uppercase">{content.length} CHR</span>
          </div>
          <div ref={editorContainerRef} className="flex-1 overflow-y-auto" onScroll={handleEditorScroll}>
            <textarea
              ref={textareaRef}
              value={getDisplayContent()}
              onChange={(e) => handleContentChange(e.target.value)}
              onMouseUp={handleMouseUp}
              className="w-full h-full min-h-full p-8 resize-none outline-none font-mono text-sm leading-relaxed text-text-primary bg-transparent placeholder:text-text-quaternary"
              placeholder="Initialize creative flow..."
            />
          </div>
        </div>

        {popover && (
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              left: Math.min(window.innerWidth - 340, Math.max(20, popover.x - 160)),
              top: Math.min(window.innerHeight - 480, popover.y),
            }}
            className="z-50 w-[320px] bg-surface-base/95 rounded-2xl shadow-2xl border border-border backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col overflow-hidden"
          >
            <div className="p-3 border-b border-border bg-surface-secondary/30 flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-widest">
                <Sparkles className="w-4 h-4 text-accent-primary" />
                AI Assistant
              </div>
              <IconButton 
                aria-label="Close"
                icon={<X size={14} />} 
                variant="ghost" 
                size="sm" 
                onClick={() => setPopover(null)} 
              />
            </div>
            <div className="p-4 space-y-4">
              <input
                type="text"
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder="Instruction (Optional)"
                className="w-full px-3 py-2 text-xs border border-border rounded-xl bg-surface-elevated/50 outline-none focus:ring-2 focus:ring-accent-primary/20"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSource(source === "rag" ? null : "rag")}
                  className={cn("py-2 text-[10px] font-bold uppercase border rounded-xl transition-all", source === "rag" ? "bg-accent-primary text-white border-accent-primary" : "bg-surface-elevated text-text-tertiary")}
                >
                  RAG
                </button>
                <button
                  type="button"
                  onClick={() => setSource(source === "web" ? null : "web")}
                  className={cn("py-2 text-[10px] font-bold uppercase border rounded-xl transition-all", source === "web" ? "bg-accent-primary text-white border-accent-primary" : "bg-surface-elevated text-text-tertiary")}
                >
                  WEB
                </button>
              </div>
              {source === "rag" && (
                <select
                  value={selectedKb}
                  onChange={(e) => setSelectedKb(e.target.value)}
                  className="w-full px-3 py-2 text-[10px] font-bold uppercase border border-border rounded-xl bg-surface-elevated outline-none"
                >
                  {kbs.map(kb => <option key={kb} value={kb}>{kb}</option>)}
                </select>
              )}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {["rewrite", "shorten", "expand", "automark"].map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => handleAction(action)}
                    disabled={isProcessing}
                    className="py-2 text-[10px] font-bold uppercase bg-surface-secondary border border-border rounded-xl hover:bg-accent-primary hover:text-white transition-all"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Preview */}
      <div className="flex-1 flex flex-col bg-surface-base rounded-2xl shadow-glass-sm border border-border overflow-hidden">
        <div className="p-2 border-b border-border bg-surface-secondary/30 flex items-center justify-between">
          <span className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest ml-2">Preview</span>
          <div className="flex items-center gap-1">
            <IconButton 
              aria-label="Save document"
              icon={<Save size={16} />} 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowNotebookModal(true)} 
              title="Save" 
            />
            <IconButton 
              aria-label={hideAiMarks ? "Show AI marks" : "Hide AI marks"}
              icon={hideAiMarks ? <EyeOff size={16} /> : <Eye size={16} />} 
              variant="ghost" 
              size="sm" 
              onClick={() => setHideAiMarks(!hideAiMarks)} 
              title="Toggle Marks" 
            />
            <IconButton 
              aria-label="View operation history"
              icon={<History size={16} />} 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowHistory(!showHistory)} 
              title="History" 
            />
          </div>
        </div>
        <div ref={previewRef} className="flex-1 overflow-y-auto p-8 prose prose-slate dark:prose-invert max-w-none" onScroll={handlePreviewScroll}>
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex, rehypeRaw]}>
            {processLatexContent(getDisplayContent())}
          </ReactMarkdown>
        </div>
      </div>

      <AddToNotebookModal
        isOpen={showNotebookModal}
        onClose={() => setShowNotebookModal(false)}
        recordType="co_writer"
        title={`Co-Writer - ${new Date().toLocaleDateString()}`}
        userQuery="Co-Writer document"
        output={content}
      />
      <NotebookImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={(imported) => setContent(content + "\n\n" + imported)}
      />
    </div>
  );
}
