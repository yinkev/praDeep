"use client";

import React, { useRef, useState, useEffect } from "react";
import { motion, Reorder, useDragControls, useReducedMotion } from "framer-motion";
import {
  Send,
  Sparkles,
  Bot,
  User,
  Paperclip,
  GripVertical,
  BookOpen,
  Key,
  Activity,
  Library,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { useGlobal } from "@/context/GlobalContext";
import { cn } from "@/lib/utils";
import { Button, IconButton } from "@/components/ui/Button";
import { SplitPane } from "@/components/ui/SplitPane";
import { EliteBackground } from "@/components/ui/EliteBackground";
import PageWrapper from "@/components/ui/PageWrapper";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { HoverBorderGradient } from "@/components/ui/hover-border-gradient";
import dynamic from "next/dynamic";
import "katex/dist/katex.min.css";
import type { RagChatSourceItem } from "@/types/rag";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  loading: () => <span className="animate-pulse">Loading content...</span>,
  ssr: false,
});

type ChatSources = {
  rag?: RagChatSourceItem[];
  web?: Array<{
    url: string;
    title?: string;
    snippet?: string;
  }>;
};

type TileData = {
  id: string;
  type: "outline" | "keyterms" | "quiz" | "progress" | "sources" | "notes";
  title: string;
  icon: React.ReactNode;
};

type ReorderableTileProps = {
  tile: TileData;
  sources?: ChatSources;
};

function ReorderableTile({ tile, sources }: ReorderableTileProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item value={tile} dragListener={false} dragControls={dragControls}>
      <div className="min-h-[120px]">
        <BentoTile
          tile={tile}
          sources={sources}
          isReducedMotion={false}
          dragControls={dragControls}
        />
      </div>
    </Reorder.Item>
  );
}

function BentoTile({
  tile,
  sources,
  isReducedMotion,
  dragControls,
}: {
  tile: TileData;
  sources?: ChatSources;
  isReducedMotion: boolean;
  dragControls?: ReturnType<typeof useDragControls>;
}) {
  const renderContent = () => {
    switch (tile.type) {
      case "sources":
        if (!sources || (!sources.rag?.length && !sources.web?.length)) {
          return <div className="text-xs text-text-quaternary py-2 italic">No active sources</div>;
        }
        return (
          <div className="space-y-2 mt-2">
              {sources.rag?.slice(0, 3).map((s, i) => (
                <div key={`rag-${s.kb_name}-${s.content.slice(0, 24)}-${i}`} className="text-xs bg-surface-base p-2 rounded-lg border border-border-subtle">
                 <div className="flex items-center gap-2">
                   <span className="font-semibold text-accent-primary">[{i + 1}]</span>
                   <span className="truncate font-semibold">{s.kb_name}</span>
                 </div>
                 <div className="mt-1 truncate text-[11px] text-text-tertiary">
                   {s.content}
                 </div>
               </div>
             ))}
            {sources.web?.slice(0, 2).map((s) => (
              <div key={`web-${s.url}`} className="text-xs bg-surface-base p-2 rounded-lg border border-border-subtle truncate">
                 <span className="font-semibold text-info mr-1">WEB</span>
                 {s.title || s.url}
              </div>
            ))}
          </div>
        );
      case "outline":
        return (
           <div className="space-y-1 mt-2">
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                 <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                 <span>Introduction</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                 <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                 <span>Core Concepts</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary">
                 <div className="w-1.5 h-1.5 rounded-full bg-border-strong" />
                 <span>Advanced Usage</span>
              </div>
           </div>
        );
      case "keyterms":
        return (
           <div className="flex flex-wrap gap-2 mt-2">
              {['Neural Network', 'Backprop', 'Weights'].map(term => (
                 <span key={term} className="text-[10px] uppercase font-bold px-2 py-1 rounded-md bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                    {term}
                 </span>
              ))}
           </div>
        );
      case "quiz":
         return (
            <div className="mt-2 p-3 rounded-lg bg-surface-elevated border border-border-subtle hover:border-accent-primary/30 transition-colors cursor-pointer group">
               <div className="text-xs font-medium text-text-secondary group-hover:text-text-primary">Quick Check</div>
               <div className="text-[10px] text-text-tertiary">3 questions pending</div>
            </div>
         );
      case "progress":
         return (
            <div className="mt-3 space-y-1">
               <div className="h-1.5 w-full bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent-primary w-[45%]" />
               </div>
               <div className="flex justify-between text-[10px] text-text-tertiary">
                  <span>Lesson 1/3</span>
                  <span>45%</span>
               </div>
            </div>
         );
      case "notes":
         return (
            <div className="mt-2 text-xs text-text-tertiary italic p-2 bg-surface-base/50 rounded-lg border border-dashed border-border-subtle">
               Click to add notes...
            </div>
         );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-surface-elevated/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-sm hover:shadow-md hover:border-accent-primary/20 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="text-text-tertiary group-hover:text-accent-primary transition-colors">
            {tile.icon}
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary group-hover:text-text-primary transition-colors">
            {tile.title}
          </h3>
        </div>
        {!isReducedMotion && (
            <button 
              type="button"
              className="cursor-grab active:cursor-grabbing text-border-strong hover:text-text-secondary p-1"
              onPointerDown={(e) => dragControls?.start(e)}
              aria-label="Drag to reorder"
            >
             <GripVertical size={14} />
           </button>
        )}
      </div>
      <div className="flex-1 min-h-0">
         {renderContent()}
      </div>
    </div>
  );
}



function EmptyState({
  onSuggestionClick,
}: {
  onSuggestionClick: (text: string) => void;
}) {
  const suggestions = [
    "Explain backpropagation like I'm new",
    "Quiz me on gradient descent",
    "Summarize this lesson in 5 bullets",
    "Give me 3 practice problems",
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center py-10">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-base/60 px-4 py-2 text-[10px] font-mono uppercase tracking-widest text-text-tertiary backdrop-blur-md">
          <Sparkles size={14} className="text-accent-primary" />
          E-learning Copilot
        </div>

        <div className="mt-6">
          <TextGenerateEffect
            words="What are we learning today?"
            className="text-2xl md:text-3xl font-bold text-text-primary"
          />
          <p className="mt-3 text-sm text-text-tertiary">
            Ask for explanations, quick quizzes, or practice drills. The right panel
            keeps your context and sources close.
          </p>
        </div>
      </div>

      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
        {suggestions.map((text) => (
          <HoverBorderGradient
            key={text}
            as="button"
            type="button"
            onClick={() => onSuggestionClick(text)}
            containerClassName="w-full"
            className="w-full justify-between rounded-xl bg-surface-base/70 px-4 py-3 text-left"
            aria-label={`Suggestion: ${text}`}
          >
            <span className="text-xs font-bold uppercase tracking-widest text-text-primary">
              {text}
            </span>
          </HoverBorderGradient>
        ))}
      </div>

      <div className="mt-6 text-[10px] font-mono uppercase tracking-widest text-text-quaternary">
        Tip: Press <kbd className="rounded border border-border bg-surface-base px-1.5">⌘</kbd>
        +<kbd className="rounded border border-border bg-surface-base px-1.5">K</kbd> for commands
      </div>
    </div>
  );
}

type ChatMessageBubbleProps = {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  sources?: ChatSources;
};

function ChatMessageBubble({
  role,
  content,
  isStreaming,
  sources,
}: ChatMessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("mb-6 flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[92%] items-start gap-3", isUser && "flex-row-reverse")}>
        <div
          className={cn(
            "mt-1 flex h-9 w-9 items-center justify-center rounded-2xl border border-border bg-surface-elevated",
            isUser ? "text-text-primary" : "text-accent-primary",
          )}
          aria-hidden="true"
        >
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        <div
          className={cn(
            "rounded-2xl border border-border-subtle px-4 py-3 shadow-sm backdrop-blur-md",
            isUser
              ? "bg-accent-primary/10 border-accent-primary/20"
              : "bg-surface-base/70",
          )}
        >
          <div className={cn("prose prose-sm max-w-none", isUser && "prose-invert")}> 
            {isUser ? (
              <p className="m-0 whitespace-pre-wrap text-sm text-text-primary">
                {content}
              </p>
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                  code: ({ className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <div className="relative rounded-md bg-surface-base border border-border overflow-hidden my-2">
                         <div className="px-3 py-1 text-[10px] uppercase font-mono bg-surface-elevated border-b border-border text-text-tertiary">
                           {match[1]}
                         </div>
                         <div className="p-3 overflow-x-auto text-xs font-mono">
                           <code className={className} {...props}>
                             {children}
                           </code>
                         </div>
                      </div>
                    ) : (
                      <code className="bg-surface-elevated/50 px-1.5 py-0.5 rounded text-xs font-mono text-accent-primary" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {content}
              </ReactMarkdown>
            )}
          </div>

          {isStreaming && (
            <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-text-quaternary">
              streaming…
            </div>
          )}

          {role === "assistant" && sources && (sources.rag?.length || sources.web?.length) ? (
            <div className="mt-3 border-t border-border-subtle pt-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">
                Sources
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.rag?.slice(0, 3).map((s) => (
                  <span
                    key={`${s.kb_name}-${s.content.slice(0, 24)}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/50 px-3 py-1 text-[10px] font-mono text-text-secondary"
                  >
                    <span className="text-accent-primary">RAG</span>
                    <span className="max-w-[220px] truncate">{s.kb_name}</span>
                  </span>
                ))}
                {sources.web?.slice(0, 2).map((s) => (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/50 px-3 py-1 text-[10px] font-mono text-text-secondary hover:border-accent-primary/30"
                  >
                    <span className="text-info">WEB</span>
                    <span className="max-w-[220px] truncate">{s.title || s.url}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const { chatState, sendChatMessage } = useGlobal();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messageCount = chatState.messages.length;

  const [tiles, setTiles] = useState<TileData[]>([
    { id: "outline", type: "outline", title: "Outline", icon: <BookOpen size={14} /> },
    { id: "keyterms", type: "keyterms", title: "Key Terms", icon: <Key size={14} /> },
    { id: "sources", type: "sources", title: "Sources", icon: <Library size={14} /> },
    { id: "progress", type: "progress", title: "Progress", icon: <Activity size={14} /> },
    { id: "quiz", type: "quiz", title: "Quiz", icon: <CheckCircle2 size={14} /> },
    { id: "notes", type: "notes", title: "Notes", icon: <FileText size={14} /> },
  ]);

  const isReducedMotion = useReducedMotion();

  useEffect(() => {
    if (messageCount === 0) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messageCount]);

  const generateMessageKey = (
    msg: { role: "user" | "assistant"; content: string },
    index: number,
  ) => {
    // Use a more stable key generation strategy
    const preview = msg.content.slice(0, 16).replace(/[^a-z0-9]/gi, "");
    return `msg-${index}-${msg.role}-${preview}`;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendChatMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const latestAssistantWithSources = [...chatState.messages]
    .reverse()
    .find((msg) => msg.role === "assistant" && msg.sources);

  const currentSources = latestAssistantWithSources?.sources;

  const canDragTiles = chatState.messages.length > 0;

  const LeftPanel = (
    <div className="flex flex-col h-full relative overflow-hidden bg-surface-base/50 backdrop-blur-sm rounded-3xl border border-border shadow-sm">
      {/* Background Decor */}
      <EliteBackground className="opacity-30" />
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar z-10" ref={scrollRef}>
        {chatState.messages.length === 0 ? (
          <EmptyState onSuggestionClick={(text) => { setInput(text); sendChatMessage(text); }} />
        ) : (
          <div className="max-w-3xl mx-auto py-4">
            {chatState.messages.map((msg, idx) => (
              <ChatMessageBubble
                key={generateMessageKey(msg, idx)}
                role={msg.role}
                content={msg.content}
                isStreaming={msg.isStreaming}
                 sources={msg.sources}
              />
            ))}
            {chatState.isLoading && !chatState.messages[chatState.messages.length - 1]?.isStreaming && (
               <div className="flex justify-start mb-6">
                 <div className="bg-surface-base border border-border-subtle rounded-2xl px-4 py-3 flex items-center gap-2">
                    <Bot size={16} className="text-text-tertiary" />
                    <span className="text-sm text-text-tertiary animate-pulse">Thinking...</span>
                 </div>
               </div>
            )}
            <div className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-border bg-surface-base/80 backdrop-blur-md z-20">
        <div className="max-w-3xl mx-auto relative">
           <form onSubmit={handleSubmit} className="relative">
             <div className="relative flex items-end gap-2 bg-surface-elevated border border-border rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-accent-primary/20 focus-within:border-accent-primary/50 transition-all">
                <IconButton 
                   icon={<Paperclip size={18} />} 
                   variant="ghost" 
                   size="sm" 
                   className="mb-1 text-text-tertiary hover:text-text-primary"
                   aria-label="Attach file"
                />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything..."
                  className="flex-1 bg-transparent border-none focus:ring-0 resize-none min-h-[44px] max-h-[200px] py-2.5 text-sm text-text-primary placeholder:text-text-tertiary"
                  rows={1}
                  style={{ height: "auto" }}
                  aria-label="Chat message"
                />
                <div className="mb-1">
                   <Button 
                      type="submit" 
                      size="sm" 
                      variant="primary" 
                      disabled={!input.trim() || chatState.isLoading}
                      className="rounded-xl h-9 w-9 p-0 flex items-center justify-center"
                      aria-label="Send message"
                   >
                      <Send size={16} />
                   </Button>
                </div>
             </div>
           </form>
           <div className="text-center mt-2">
              <span className="text-[10px] text-text-quaternary uppercase tracking-wider font-medium">
                 AI-Generated content may be inaccurate
              </span>
           </div>
        </div>
      </div>
    </div>
  );

  const RightPanel = (
    <div className="h-full flex flex-col bg-surface-elevated/30 backdrop-blur-md border-l border-border/50">
       <div className="p-4 border-b border-border/50">
          <h3 className="text-xs font-bold uppercase tracking-widest text-text-secondary">Learning Context</h3>
       </div>
       <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          {isReducedMotion || !canDragTiles ? (
             <div className="grid grid-cols-1 gap-4">
                {tiles.map((tile) => (
                   <div key={tile.id} className="min-h-[120px]">
                      <BentoTile tile={tile} sources={currentSources} isReducedMotion={true} />
                   </div>
                ))}
             </div>
          ) : (
              <Reorder.Group axis="y" values={tiles} onReorder={setTiles} className="flex flex-col gap-4">
                 {tiles.map((tile) => (
                    <ReorderableTile key={tile.id} tile={tile} sources={currentSources} />
                 ))}
              </Reorder.Group>
          )}
       </div>
    </div>
  );

  return (
    <PageWrapper 
      className="h-[calc(100vh-3.5rem)] p-0 md:p-4 overflow-hidden" 
      maxWidth="full"
      showPattern={false}
    >
       <SplitPane 
         leftPanel={LeftPanel} 
         rightPanel={RightPanel} 
         defaultRightWidth={320}
         className="h-full rounded-3xl overflow-hidden"
       />
    </PageWrapper>
  );
}
