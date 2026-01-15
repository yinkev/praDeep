"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  Send,
  Loader2,
  Bot,
  User,
  Database,
  Globe,
  Mic,
  Calculator,
  Microscope,
  Lightbulb,
  Trash2,
  ExternalLink,
  BookOpen,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Edit3,
  GraduationCap,
  PenTool,
  MessageCircle,
  Zap,
  ArrowRight,
  Sigma,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
} from "framer-motion";
import { useGlobal } from "@/context/GlobalContext";
import { apiUrl } from "@/lib/api";
import {
  parseKnowledgeBaseList,
  type KnowledgeBaseListItem,
} from "@/lib/knowledge";
import { processLatexContent } from "@/lib/latex";
import { getTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import PageWrapper from "@/components/ui/PageWrapper";
import Button, { IconButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import { Tabs, type TabsItem } from "@/components/ui/Tabs";
import CouncilDetails from "@/components/CouncilDetails";
import { eliteTheme } from "@/lib/elite-theme";

type TranscriptResponse = {
  text?: string;
  language?: string;
};

// ============================================================================
// Types
// ============================================================================

interface RecentHistoryEntry {
  id: string;
  timestamp: number;
  type: string;
  title: string;
  summary?: string;
  content?: unknown;
}

interface ConversationStarter {
  id: string;
  title: string;
  prompt: string;
  icon: React.ReactNode;
}

type WelcomeSection = "hero" | "starters" | "modules";

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.06,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.22,
      ease: [0.2, 0.8, 0.2, 1] as const,
    },
  },
};

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.2, 0.8, 0.2, 1] as const,
    },
  },
};

const headlineVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.08,
    },
  },
};

const headlineLineVariants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.24,
      ease: [0.2, 0.8, 0.2, 1] as const,
    },
  },
};

const messageVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.22,
      ease: [0.2, 0.8, 0.2, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.99,
    transition: { duration: 0.12, ease: [0.2, 0.8, 0.2, 1] as const },
  },
};

// ============================================================================
// Component
// ============================================================================

export default function HomePage() {
  const {
    chatState,
    setChatState,
    sendChatMessage,
    verifyChatMessage,
    sendCouncilCheckpoint,
    newChatSession,
    uiSettings,
  } = useGlobal();
  const t = useCallback(
    (key: string) => getTranslation(uiSettings.language, key),
    [uiSettings.language],
  );
  const toast = useToast();

  const [inputMessage, setInputMessage] = useState("");
  const [equationEditorOpen, setEquationEditorOpen] = useState(false);
  const [equationLatex, setEquationLatex] = useState("");

  const [voiceRecording, setVoiceRecording] = useState(false);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceStreamRef = useRef<MediaStream | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);

  const [checkpointUserQuestions, setCheckpointUserQuestions] = useState("");
  const [checkpointNotes, setCheckpointNotes] = useState("");
  const [kbs, setKbs] = useState<KnowledgeBaseListItem[]>([]);
  const [conversationStarters, setConversationStarters] = useState<
    ConversationStarter[]
  >([]);
  const [isFocused, setIsFocused] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const modulesRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement | null>(null);
  const startersSectionRef = useRef<HTMLElement | null>(null);
  const scrollRootRef = useRef<HTMLElement | null>(null);
  const sectionRatiosRef = useRef<Record<WelcomeSection, number>>({
    hero: 0,
    starters: 0,
    modules: 0,
  });

  const shouldReduceMotion = useReducedMotion();
  const [activeWelcomeSection, setActiveWelcomeSection] =
    useState<WelcomeSection>("hero");
  const [revealedWelcomeSections, setRevealedWelcomeSections] = useState<
    Record<WelcomeSection, boolean>
  >({
    hero: true,
    starters: false,
    modules: false,
  });

  useLayoutEffect(() => {
    scrollRootRef.current = document.getElementById("app-scroll");
  }, []);

  const { scrollYProgress: pageScrollProgress } = useScroll({
    container: scrollRootRef,
  });
  const pageScrollProgressSpring = useSpring(pageScrollProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    setCheckpointUserQuestions("");
    setCheckpointNotes("");
  }, [chatState.councilCheckpoint?.checkpoint_id]);

  // Fetch knowledge bases
  useEffect(() => {
    fetch(apiUrl("/api/v1/knowledge/list"))
      .then((res) => res.json())
      .then((data) => {
        const knowledgeBases = parseKnowledgeBaseList(data);
        setKbs(knowledgeBases);
        setChatState((prev) => {
          if (prev.selectedKb) return prev;

          const defaultKb = knowledgeBases.find((kb) => kb.is_default);
          if (defaultKb) return { ...prev, selectedKb: defaultKb.name };
          if (knowledgeBases.length > 0)
            return { ...prev, selectedKb: knowledgeBases[0].name };
          return prev;
        });
      })
      .catch((err) => {
        console.error("Failed to fetch KBs:", err);
        toast.error("Failed to load knowledge bases");
      });
  }, [setChatState, toast]);

  // Fetch recent activity for conversation starters
  useEffect(() => {
    const starterIcons = [
      <Sparkles key="sparkles" className="w-4 h-4" />,
      <Lightbulb key="lightbulb" className="w-4 h-4" />,
      <BookOpen key="book" className="w-4 h-4" />,
      <GraduationCap key="grad" className="w-4 h-4" />,
      <Zap key="zap" className="w-4 h-4" />,
      <MessageCircle key="msg" className="w-4 h-4" />,
    ];

    const buildStarters = (
      knowledgeBases: KnowledgeBaseListItem[],
      researchEntries: RecentHistoryEntry[],
      solveEntries: RecentHistoryEntry[],
    ): ConversationStarter[] => {
      const starters: ConversationStarter[] = [];
      let iconIndex = 0;

      const latestResearch = researchEntries[0];
      if (latestResearch?.title) {
        starters.push({
          id: `research-summarize-${latestResearch.id}`,
          title: t("Summarize recent research"),
          prompt: `Summarize findings from my recent research on "${latestResearch.title}".`,
          icon: starterIcons[iconIndex++ % starterIcons.length],
        });
        starters.push({
          id: `research-quiz-${latestResearch.id}`,
          title: t("Quiz me on recent research"),
          prompt: `Quiz me on the key points from my recent research on "${latestResearch.title}".`,
          icon: starterIcons[iconIndex++ % starterIcons.length],
        });
      }

      const latestSolve = solveEntries[0];
      if (latestSolve?.title) {
        starters.push({
          id: `solve-explain-${latestSolve.id}`,
          title: t("Review my recent solve"),
          prompt: `Explain the solution approach and key steps for my recent problem: "${latestSolve.title}".`,
          icon: starterIcons[iconIndex++ % starterIcons.length],
        });
      }

      const sortedKbs = [...knowledgeBases].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1;
        if (!a.is_default && b.is_default) return 1;
        return a.name.localeCompare(b.name);
      });

      for (const kb of sortedKbs.slice(0, 3)) {
        starters.push({
          id: `kb-quiz-${kb.name}`,
          title: t("Quiz me on a KB topic"),
          prompt: `Quiz me on ${kb.name}.`,
          icon: starterIcons[iconIndex++ % starterIcons.length],
        });
      }

      if (starters.length === 0) {
        starters.push(
          {
            id: "generic-1",
            title: t("Ask for help"),
            prompt: "Help me get started-what can you do in this app?",
            icon: starterIcons[0],
          },
          {
            id: "generic-2",
            title: t("Make a plan"),
            prompt: "Make me a short study plan for today.",
            icon: starterIcons[1],
          },
        );
      }

      return starters.slice(0, 6);
    };

    const fetchStarters = async () => {
      try {
        const [researchRes, solveRes] = await Promise.all([
          fetch(apiUrl("/api/v1/dashboard/recent?limit=5&type=research")),
          fetch(apiUrl("/api/v1/dashboard/recent?limit=5&type=solve")),
        ]);

        const researchEntries =
          (await researchRes.json()) as RecentHistoryEntry[];
        const solveEntries = (await solveRes.json()) as RecentHistoryEntry[];

        setConversationStarters(
          buildStarters(kbs, researchEntries || [], solveEntries || []),
        );
      } catch (err) {
        setConversationStarters(buildStarters(kbs, [], []));
      }
    };

    fetchStarters();
  }, [kbs, t]);

  // Auto-scroll to bottom when new messages arrive
  const prevMessageCountRef = useRef(0);
  useEffect(() => {
    const count = chatState.messages.length;
    if (count === 0) {
      prevMessageCountRef.current = 0;
      return;
    }

    if (count === prevMessageCountRef.current) return;
    prevMessageCountRef.current = count;

    chatEndRef.current?.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
    });
  }, [chatState.messages.length, shouldReduceMotion]);

  const handleOpenEquationEditor = useCallback(() => {
    setEquationLatex("");
    setEquationEditorOpen(true);
  }, []);

  const handleInsertEquation = useCallback(() => {
    const next = equationLatex.trim();
    setEquationEditorOpen(false);

    if (!next) {
      inputRef.current?.focus();
      return;
    }

    const fragment = `$${next}$`;
    setInputMessage((prev) =>
      prev.trim() ? `${prev.trimEnd()} ${fragment}` : fragment,
    );
    queueMicrotask(() => inputRef.current?.focus());
  }, [equationLatex]);

  const cleanupVoiceStream = useCallback(() => {
    voiceStreamRef.current?.getTracks().forEach((track) => track.stop());
    voiceStreamRef.current = null;
  }, []);

  const handleToggleVoiceInput = useCallback(async () => {
    const recorder = voiceRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceStreamRef.current = stream;
      voiceChunksRef.current = [];

      const nextRecorder = new MediaRecorder(stream);
      voiceRecorderRef.current = nextRecorder;
      setVoiceRecording(true);

      nextRecorder.ondataavailable = (event: { data: Blob }) => {
        if (event.data.size > 0) voiceChunksRef.current.push(event.data);
      };

      nextRecorder.onstop = async () => {
        setVoiceRecording(false);

        const blob = new Blob(voiceChunksRef.current, { type: "audio/webm" });
        cleanupVoiceStream();

        try {
          const form = new FormData();
          form.append("audio", blob, "voice.webm");

          const res = await fetch(apiUrl("/api/v1/speech/transcribe"), {
            method: "POST",
            body: form,
          });

          if (!res.ok) return;
          const json = (await res.json()) as TranscriptResponse;
          const transcript = (json.text || "").trim();
          if (!transcript) return;

          setInputMessage((prev) =>
            prev.trim() ? `${prev.trimEnd()} ${transcript}` : transcript,
          );
          queueMicrotask(() => inputRef.current?.focus());
        } catch {
          // Best-effort: voice input should never crash the home screen.
        }
      };

      nextRecorder.start();
    } catch {
      cleanupVoiceStream();
      setVoiceRecording(false);
    }
  }, [cleanupVoiceStream]);

  const handleSend = () => {
    if (!inputMessage.trim() || chatState.isLoading) return;
    sendChatMessage(inputMessage);
    setInputMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    newChatSession();
    toast.info("Started a new conversation");
  };

  const lastVerifiableAssistantIndex = (() => {
    for (let i = chatState.messages.length - 1; i >= 0; i--) {
      const msg = chatState.messages[i];
      if (
        msg.role === "assistant" &&
        !msg.isStreaming &&
        !msg.meta?.verified &&
        (msg.content || "").trim()
      ) {
        return i;
      }
    }
    return -1;
  })();

  const handleVerifyLast = () => {
    if (chatState.isLoading) return;
    if (lastVerifiableAssistantIndex < 0) return;
    verifyChatMessage(lastVerifiableAssistantIndex);
  };

  const quickActions = [
    {
      icon: Calculator,
      label: t("Smart Problem Solving"),
      href: "/solver",
      description: "Multi-agent reasoning",
    },
    {
      icon: PenTool,
      label: t("Generate Practice Questions"),
      href: "/question",
      description: "Auto-validated quizzes",
    },
    {
      icon: Microscope,
      label: t("Deep Research Reports"),
      href: "/research",
      description: "Comprehensive analysis",
    },
    {
      icon: Lightbulb,
      label: t("Generate Novel Ideas"),
      href: "/ideagen",
      description: "Brainstorm & synthesize",
    },
    {
      icon: GraduationCap,
      label: t("Guided Learning"),
      href: "/guide",
      description: "Step-by-step tutoring",
    },
    {
      icon: Edit3,
      label: t("Co-Writer"),
      href: "/co_writer",
      description: "Collaborative writing",
    },
  ];

  const hasMessages = chatState.messages.length > 0;
  const focusChat = () => {
    chatPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const scrollToModules = () => {
    modulesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const scrollToWelcomeSection = (section: WelcomeSection) => {
    if (section === "modules") {
      modulesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    if (section === "starters") {
      startersSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    heroSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const welcomeTabs = useCallback((): TabsItem[] => {
    const tabs: TabsItem[] = [
      { id: "hero", label: t("Overview") },
      ...(conversationStarters.length > 0
        ? [{ id: "starters", label: t("Conversation Starters") }]
        : []),
      { id: "modules", label: t("Explore modules") },
    ];

    return tabs;
  }, [conversationStarters.length, t]);

  useEffect(() => {
    if (hasMessages) return;

    if (shouldReduceMotion) return;

    const observedSections: Array<{
      key: WelcomeSection;
      element: HTMLElement;
    }> = [];
    if (heroSectionRef.current) {
      observedSections.push({ key: "hero", element: heroSectionRef.current });
    }

    if (conversationStarters.length > 0 && startersSectionRef.current) {
      observedSections.push({
        key: "starters",
        element: startersSectionRef.current,
      });
    } else {
      sectionRatiosRef.current.starters = 0;
    }

    if (modulesRef.current) {
      observedSections.push({ key: "modules", element: modulesRef.current });
    }

    if (observedSections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const ratios = sectionRatiosRef.current;
        const toReveal: WelcomeSection[] = [];

        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.welcomeSection as
            | WelcomeSection
            | undefined;
          if (!key) continue;

          const ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
          ratios[key] = ratio;

          if (entry.isIntersecting && ratio >= 0.22) {
            toReveal.push(key);
          }
        }

        if (toReveal.length > 0) {
          setRevealedWelcomeSections((prev) => {
            let next = prev;
            for (const key of toReveal) {
              if (!next[key]) {
                next = { ...next, [key]: true };
              }
            }
            return next;
          });
        }

        let bestSection: WelcomeSection | null = null;
        let bestRatio = 0;

        for (const [key, ratio] of Object.entries(ratios) as Array<
          [WelcomeSection, number]
        >) {
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestSection = key;
          }
        }

        if (bestSection && bestRatio >= 0.12) {
          setActiveWelcomeSection(bestSection);
        }
      },
      {
        root: scrollRootRef.current,
        threshold: [0.12, 0.22, 0.35, 0.5, 0.65],
        rootMargin: "-35% 0px -55% 0px",
      },
    );

    for (const section of observedSections) {
      observer.observe(section.element);
    }

    return () => observer.disconnect();
  }, [conversationStarters.length, hasMessages, shouldReduceMotion]);

  // ============================================================================
  // Render: Welcome Screen (No Messages)
  // ============================================================================

  if (!hasMessages) {
    return (
      <div
        className={cn(
          "relative min-h-dvh overflow-x-hidden",
          eliteTheme.surface,
        )}
      >
        <div className="sticky top-0 z-40">
          <div className="border-b border-border bg-surface-elevated/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/55">
            <div
              className={cn(
                "mx-auto flex max-w-6xl items-center justify-between gap-4",
                eliteTheme.density.compact.pageX,
                eliteTheme.density.compact.headerY,
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Tabs
                  tabs={welcomeTabs()}
                  activeTab={activeWelcomeSection}
                  onTabChange={(id) =>
                    scrollToWelcomeSection(id as WelcomeSection)
                  }
                  layoutId="welcomeNavActive"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden text-xs text-text-tertiary sm:inline dark:text-zinc-400">
                  {t("Scroll")}
                </span>
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border dark:bg-white/10">
                  <motion.div
                    className="h-full origin-left bg-accent-primary"
                    style={{ scaleX: pageScrollProgressSpring }}
                  />
                </div>
              </div>
            </div>

            <motion.div
              className="h-[2px] origin-left bg-accent-primary/70 dark:bg-accent-primary/60"
              style={{ scaleX: pageScrollProgressSpring }}
            />
          </div>
        </div>

        <PageWrapper
          maxWidth="full"
          showPattern={false}
          className="min-h-dvh px-0 py-0"
        >
          <motion.main
            className={cn(
              "relative mx-auto max-w-6xl pb-22 pt-12",
              eliteTheme.density.compact.pageX,
              "sm:px-8",
            )}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.section
              ref={heroSectionRef}
              data-welcome-section="hero"
              className="relative min-h-[110vh] scroll-mt-28"
            >
              <motion.div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
                {/* Hero */}
                <motion.div className="pt-4 lg:pt-10">
                  <motion.div
                    variants={fadeInUp}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/70 px-3 py-1.5 text-xs font-semibold text-text-secondary shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                    <span>
                      {t("Your personal research + tutoring workspace")}
                    </span>
                  </motion.div>

                  <motion.h1
                    variants={headlineVariants}
                    className="mt-6 font-display text-display text-text-primary dark:text-zinc-50"
                  >
                    <motion.span
                      variants={headlineLineVariants}
                      className="block font-headline tracking-headline-tight"
                    >
                      {t("Think deeper.")}
                    </motion.span>
                    <motion.span
                      variants={headlineLineVariants}
                      className="block font-hero tracking-headline"
                    >
                      <span className="text-accent-primary">
                        {t("Learn faster.")}
                      </span>
                    </motion.span>
                  </motion.h1>

                  <motion.p
                    variants={fadeInUp}
                    className="mt-5 max-w-xl type-lede"
                  >
                    {t(
                      "Chat with grounded context (RAG), pull web sources when needed, and jump into focused modules for solving, research, and guided learning.",
                    )}
                  </motion.p>

                  <motion.div
                    variants={fadeInUp}
                    className="mt-8 flex flex-wrap gap-3"
                  >
                    <Button
                      size="lg"
                      onClick={focusChat}
                      iconRight={<ArrowRight className="h-5 w-5" />}
                    >
                      {t("Start chatting")}
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={scrollToModules}
                      className="dark:text-zinc-100 dark:border-white/20 dark:hover:bg-white/10 dark:active:bg-white/10"
                    >
                      {t("Explore modules")}
                    </Button>
                  </motion.div>

                  <motion.div
                    variants={fadeInUp}
                    className="mt-8 grid max-w-xl grid-cols-1 gap-3 sm:grid-cols-2"
                  >
                    <Card
                      variant="glass"
                      padding="sm"
                      interactive={false}
                      className="flex items-center gap-3 border-border bg-surface-elevated/50 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-accent-primary dark:bg-blue-500/15 dark:text-blue-300">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary dark:text-zinc-50">
                          {t("Grounded")}
                        </div>
                        <div className="text-xs text-text-tertiary dark:text-zinc-400">
                          {t("Use your knowledge base")}
                        </div>
                      </div>
                    </Card>
                    <Card
                      variant="glass"
                      padding="sm"
                      interactive={false}
                      className="flex items-center gap-3 border-border bg-surface-elevated/50 dark:border-white/10 dark:bg-white/5"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-accent-primary dark:bg-blue-500/15 dark:text-blue-300">
                        <Globe className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-text-primary dark:text-zinc-50">
                          {t("Connected")}
                        </div>
                        <div className="text-xs text-text-tertiary dark:text-zinc-400">
                          {t("Optional web search")}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>

                {/* Chat Panel */}
                <motion.div
                  variants={itemVariants}
                  ref={chatPanelRef}
                  className="lg:pt-6"
                >
                  <Card
                    variant="glass"
                    padding="lg"
                    interactive={false}
                    className="relative overflow-hidden border-border bg-surface-elevated/40 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="relative">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                        <div>
                          <div
                            className={cn(
                              "inline-flex items-center gap-2 font-semibold text-text-primary dark:text-zinc-50",
                              eliteTheme.density.compact.monoLabel,
                            )}
                          >
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span>CO-PILOT ACTIVE</span>
                          </div>
                          <div className="mt-2 text-xs text-text-tertiary dark:text-zinc-400">
                            {t("RAG + web search, with math rendering.")}
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {chatState.enableRag && chatState.selectedKb ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-[11px] font-medium text-text-secondary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                                <Database className="h-3.5 w-3.5 text-accent-primary" />
                                <span className="max-w-[160px] truncate">
                                  {chatState.selectedKb}
                                </span>
                              </span>
                            ) : null}
                            {chatState.enableWebSearch ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-[11px] font-medium text-text-secondary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                                <Globe className="h-3.5 w-3.5 text-accent-primary" />
                                {t("Web search")}
                              </span>
                            ) : null}
                            {!chatState.enableRag &&
                            !chatState.enableWebSearch ? (
                              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-[11px] font-medium text-text-tertiary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                                {t("Direct")}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <details className="group w-full sm:w-[320px]">
                          <summary className="flex items-center justify-between rounded-2xl border border-border bg-surface-elevated/60 px-4 py-2 text-sm font-medium text-text-primary shadow-glass-sm backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/75 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 cursor-pointer [&::-webkit-details-marker]:hidden [&::marker]:content-none">
                            <span className="inline-flex items-center gap-2">
                              <SlidersHorizontal className="h-4 w-4 text-text-tertiary dark:text-zinc-400" />
                              {t("Controls")}
                            </span>
                            <ChevronDown className="h-4 w-4 text-text-tertiary transition-transform duration-150 group-open:rotate-180 dark:text-zinc-400" />
                          </summary>
                          <div className="mt-3 rounded-2xl border border-border bg-surface-elevated/45 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/40">
                            <div className="flex flex-wrap gap-2">
                              <Button
                                size="sm"
                                variant={
                                  chatState.enableRag ? "primary" : "secondary"
                                }
                                iconLeft={<Database className="h-4 w-4" />}
                                className="!rounded-full"
                                aria-pressed={chatState.enableRag}
                                onClick={() =>
                                  setChatState((prev) => ({
                                    ...prev,
                                    enableRag: !prev.enableRag,
                                  }))
                                }
                              >
                                {t("Knowledge")}
                              </Button>
                              <Button
                                size="sm"
                                variant={
                                  chatState.enableWebSearch
                                    ? "primary"
                                    : "secondary"
                                }
                                iconLeft={<Globe className="h-4 w-4" />}
                                className="!rounded-full"
                                aria-pressed={chatState.enableWebSearch}
                                onClick={() =>
                                  setChatState((prev) => ({
                                    ...prev,
                                    enableWebSearch: !prev.enableWebSearch,
                                  }))
                                }
                              >
                                {t("Web")}
                              </Button>
                            </div>

                            <div className="mt-4 space-y-1.5">
                              <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                                Council depth
                              </label>
                              <select
                                value={chatState.councilDepth}
                                onChange={(e) =>
                                  setChatState((prev) => ({
                                    ...prev,
                                    councilDepth: e.target.value as
                                      | "standard"
                                      | "quick"
                                      | "deep",
                                  }))
                                }
                                className="h-9 w-full rounded-xl border border-border bg-surface-elevated/70 px-3 text-sm text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                              >
                                <option value="standard">
                                  Standard (recommended)
                                </option>
                                <option value="quick">Quick</option>
                                <option value="deep">Deep</option>
                              </select>
                            </div>

                            <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface-elevated/55 px-3 py-2 text-xs text-text-secondary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                              <div>
                                <div className="font-semibold text-text-primary dark:text-zinc-100">
                                  Interactive checkpoints
                                </div>
                                <div className="text-[11px] text-text-tertiary dark:text-zinc-400">
                                  Pause between steps (not during generation).
                                </div>
                              </div>
                              <Button
                                variant={
                                  chatState.enableCouncilInteraction
                                    ? "primary"
                                    : "secondary"
                                }
                                size="sm"
                                onClick={() =>
                                  setChatState((prev) => ({
                                    ...prev,
                                    enableCouncilInteraction:
                                      !prev.enableCouncilInteraction,
                                  }))
                                }
                              >
                                {chatState.enableCouncilInteraction
                                  ? "On"
                                  : "Off"}
                              </Button>
                            </div>

                            <div className="mt-3 space-y-1.5">
                              <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                                Council audio (TTS)
                              </label>
                              <select
                                value={chatState.councilAudioMode}
                                onChange={(e) =>
                                  setChatState((prev) => ({
                                    ...prev,
                                    councilAudioMode: e.target.value as
                                      | "off"
                                      | "final"
                                      | "all",
                                  }))
                                }
                                className="h-9 w-full rounded-xl border border-border bg-surface-elevated/70 px-3 text-sm text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                              >
                                <option value="off">Off</option>
                                <option value="final">Final answer</option>
                                <option value="all">
                                  All council messages
                                </option>
                              </select>
                              <div className="text-[11px] leading-relaxed text-text-tertiary dark:text-zinc-400">
                                Audio is generated after council completes; it
                                uses your TTS settings.
                              </div>
                            </div>

                            <div className="mt-3 space-y-1.5">
                              <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                                Checkpoint timeout (seconds)
                              </label>
                              <input
                                type="number"
                                min={5}
                                max={600}
                                value={chatState.councilCheckpointTimeoutS}
                                onChange={(e) =>
                                  setChatState((prev) => ({
                                    ...prev,
                                    councilCheckpointTimeoutS: Math.max(
                                      5,
                                      Math.min(
                                        600,
                                        Number(e.target.value || 0),
                                      ),
                                    ),
                                  }))
                                }
                                className="h-9 w-full rounded-xl border border-border bg-surface-elevated/70 px-3 text-sm text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                              />
                            </div>

                            {chatState.enableRag && (
                              <div className="mt-4 space-y-1.5">
                                <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                                  {t("Knowledge base")}
                                </label>
                                <select
                                  value={chatState.selectedKb}
                                  onChange={(e) =>
                                    setChatState((prev) => ({
                                      ...prev,
                                      selectedKb: e.target.value,
                                    }))
                                  }
                                  className="h-9 w-full rounded-xl border border-border bg-surface-elevated/70 px-3 text-sm text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                                >
                                  {kbs.map((kb) => (
                                    <option key={kb.name} value={kb.name}>
                                      {kb.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <p className="mt-4 text-xs text-text-tertiary dark:text-zinc-400">
                              {t(
                                "Replies include sources + a confidence estimate. Use Council verification for high-stakes answers.",
                              )}
                            </p>
                          </div>
                        </details>
                      </div>

                      <div className="mt-5">
                        <div className="relative">
                          <div
                            className={cn(
                              "rounded-2xl transition-shadow duration-150",
                              isFocused
                                ? "shadow-[0_0_0_4px_rgba(59,130,246,0.10),0_12px_30px_-12px_rgba(59,130,246,0.22)]"
                                : "shadow-glass-sm",
                            )}
                          >
                            <input
                              ref={inputRef}
                              type="text"
                              className={`
	                            w-full rounded-2xl border px-5 py-4 pr-44 text-base
	                            bg-surface-elevated/70 backdrop-blur-md
	                            placeholder:text-text-tertiary text-text-primary
	                            dark:bg-zinc-950/50 dark:placeholder:text-text-tertiary dark:text-zinc-100
	                            ${
                                isFocused
                                  ? "border-blue-400/70 dark:border-blue-400/60"
                                  : "border-border hover:border-border-hover dark:border-white/10 dark:hover:border-white/20"
                              }
	                            focus:outline-none
	                            shadow-glass-sm
	                            transition-colors duration-150
	                          `}
                              aria-label={t("Message")}
                              placeholder="Ask Co-Pilot..."
                              value={inputMessage}
                              onChange={(e) => setInputMessage(e.target.value)}
                              onKeyDown={handleKeyDown}
                              onFocus={() => setIsFocused(true)}
                              onBlur={() => setIsFocused(false)}
                              disabled={chatState.isLoading}
                              autoComplete="off"
                            />
                          </div>

                          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <IconButton
                              aria-label="Voice input"
                              icon={
                                <Mic
                                  className={cn(
                                    "h-5 w-5",
                                    voiceRecording && "text-rose-500",
                                  )}
                                />
                              }
                              size="md"
                              variant="secondary"
                              onClick={handleToggleVoiceInput}
                              className={cn(
                                "!rounded-xl",
                                voiceRecording && "ring-2 ring-rose-500/20",
                              )}
                            />
                            <IconButton
                              aria-label="Insert equation"
                              icon={<Sigma className="h-5 w-5" />}
                              size="md"
                              variant="secondary"
                              onClick={handleOpenEquationEditor}
                              className="!rounded-xl"
                            />
                            <IconButton
                              aria-label={t("Send message")}
                              icon={
                                chatState.isLoading ? (
                                  <Loader2 className="h-5 w-5 motion-safe:animate-spin" />
                                ) : (
                                  <Send className="h-5 w-5" />
                                )
                              }
                              size="md"
                              variant={
                                inputMessage.trim() ? "primary" : "secondary"
                              }
                              onClick={handleSend}
                              disabled={
                                chatState.isLoading || !inputMessage.trim()
                              }
                              className="!rounded-xl"
                            />
                          </div>
                        </div>

                        {conversationStarters.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {conversationStarters.slice(0, 3).map((starter) => (
                              <Button
                                key={starter.id}
                                onClick={() => {
                                  setInputMessage(starter.prompt);
                                  inputRef.current?.focus();
                                }}
                                size="sm"
                                variant="secondary"
                                iconLeft={starter.icon}
                                className="!rounded-full"
                              >
                                <span className="max-w-[220px] truncate">
                                  {starter.title}
                                </span>
                              </Button>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 flex items-center justify-between text-xs text-text-tertiary dark:text-zinc-400">
                          <span>{t("Press Enter to send")}</span>
                          <span className="hidden sm:inline">
                            {t("Private by default")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </motion.section>

            {/* Conversation Starters */}
            {conversationStarters.length > 0 && (
              <motion.section
                variants={containerVariants}
                ref={startersSectionRef}
                data-welcome-section="starters"
                initial={shouldReduceMotion ? "visible" : "hidden"}
                animate={
                  shouldReduceMotion || revealedWelcomeSections.starters
                    ? "visible"
                    : "hidden"
                }
                className="mt-16 scroll-mt-28"
                data-testid="conversation-starters"
              >
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4 text-accent-primary" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary dark:text-zinc-400">
                    {t("Conversation Starters")}
                  </h2>
                </motion.div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {conversationStarters.map((starter) => (
                    <motion.div
                      key={starter.id}
                      variants={itemVariants}
                      className="h-full"
                    >
                      <button
                        type="button"
                        data-testid={`conversation-starter-${starter.id}`}
                        onClick={() => {
                          setInputMessage(starter.prompt);
                          focusChat();
                        }}
                        className="group h-full w-full text-left"
                      >
                        <Card
                          variant="glass"
                          padding="md"
                          interactive
                          className="h-full border-border bg-surface-elevated/40 dark:border-white/10 dark:bg-white/5"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-accent-primary dark:bg-blue-500/15 dark:text-blue-300">
                              {starter.icon}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-text-primary dark:text-zinc-50">
                                {starter.title}
                              </div>
                              <div className="mt-1 line-clamp-2 text-xs text-text-tertiary dark:text-zinc-400">
                                {starter.prompt}
                              </div>
                            </div>
                          </div>
                        </Card>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Modules / Feature Cards */}
            <motion.section
              ref={modulesRef}
              variants={containerVariants}
              data-welcome-section="modules"
              initial={shouldReduceMotion ? "visible" : "hidden"}
              animate={
                shouldReduceMotion || revealedWelcomeSections.modules
                  ? "visible"
                  : "hidden"
              }
              className="mt-16 scroll-mt-28"
            >
              <motion.div
                variants={itemVariants}
                className="flex items-end justify-between gap-6"
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-text-primary dark:text-zinc-50">
                    {t("Explore modules")}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary dark:text-zinc-300">
                    {t(
                      "Purpose-built tools for solving, research, and learning workflows.",
                    )}
                  </p>
                </div>
              </motion.div>

              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {quickActions.map((action, i) => (
                  <motion.div
                    key={i}
                    variants={itemVariants}
                    className="h-full"
                  >
                    <Link
                      href={action.href}
                      prefetch={true}
                      className="group block h-full"
                    >
                      <Card
                        variant="glass"
                        padding="md"
                        interactive
                        className="h-full border-border bg-surface-elevated/40 dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-accent-primary dark:bg-blue-500/15 dark:text-blue-300">
                            <action.icon className="h-5 w-5" />
                          </div>
                          <ArrowRight className="mt-1 h-4 w-4 text-text-tertiary group-hover:text-accent-primary transition-colors duration-150 ease-out dark:text-zinc-400 dark:group-hover:text-blue-300" />
                        </div>
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-text-primary transition-colors duration-150 group-hover:text-accent-primary dark:text-zinc-50 dark:group-hover:text-blue-300">
                            {action.label}
                          </h3>
                          <p className="mt-1 text-xs text-text-secondary dark:text-zinc-300">
                            {action.description}
                          </p>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </motion.main>
        </PageWrapper>

        <Modal
          isOpen={equationEditorOpen}
          onClose={() => setEquationEditorOpen(false)}
          title="Equation editor"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() =>
                  setEquationLatex((prev) => `${prev}${prev ? " " : ""}\\alpha`)
                }
              >
                Alpha
              </Button>
            </div>

            <div
              className={cn(
                "rounded-xl px-4 py-3 font-mono text-sm tabular-nums",
                eliteTheme.recessed,
              )}
              data-testid="equation-latex"
            >
              {equationLatex}
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEquationEditorOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleInsertEquation}
              >
                Insert
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ============================================================================
  // Render: Chat Interface (Has Messages)
  // ============================================================================

  return (
    <div className={cn("relative h-dvh overflow-hidden", eliteTheme.surface)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-56 right-10 h-[520px] w-[520px] rounded-full bg-indigo-500/10 blur-3xl dark:bg-indigo-500/10"
      />
      <PageWrapper
        maxWidth="full"
        showPattern={false}
        className="h-dvh px-0 py-0"
      >
        <div className="relative flex h-dvh flex-col">
          {/* Header Bar */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }
            }
            className="relative border-b border-border bg-surface-elevated/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/60"
          >
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated/60 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                  <Bot className="h-4 w-4 text-accent-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-text-primary dark:text-zinc-50">
                    {t("Chat")}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {chatState.enableRag && chatState.selectedKb ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-[11px] font-medium text-text-secondary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                        <Database className="h-3.5 w-3.5 text-accent-primary" />
                        <span className="max-w-[180px] truncate">
                          {chatState.selectedKb}
                        </span>
                      </span>
                    ) : null}
                    {chatState.enableWebSearch ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-[11px] font-medium text-text-secondary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-200">
                        <Globe className="h-3.5 w-3.5 text-accent-primary" />
                        {t("Web Search")}
                      </span>
                    ) : null}
                    {!chatState.enableRag && !chatState.enableWebSearch ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/60 px-3 py-1 text-[11px] font-medium text-text-tertiary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
                        {t("Direct")}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconLeft={<Microscope className="h-4 w-4" />}
                  onClick={handleVerifyLast}
                  disabled={
                    chatState.isLoading || lastVerifiableAssistantIndex < 0
                  }
                  className="border-blue-200/70 bg-surface-elevated/60 text-text-primary hover:bg-blue-50/70 hover:text-blue-700 dark:border-blue-400/20 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
                  title="Verify the most recent assistant answer"
                >
                  Council Verify
                </Button>
                <details className="group relative">
                  <summary className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated/60 px-3 py-2 text-sm font-medium text-text-primary shadow-glass-sm backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/75 dark:border-white/10 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-white/10 cursor-pointer [&::-webkit-details-marker]:hidden [&::marker]:content-none">
                    <SlidersHorizontal className="h-4 w-4 text-text-tertiary dark:text-zinc-400" />
                    {t("Controls")}
                    <ChevronDown className="ml-1 h-4 w-4 text-text-tertiary transition-transform duration-150 group-open:rotate-180 dark:text-zinc-400" />
                  </summary>

                  <div className="absolute right-0 mt-2 w-[340px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-border bg-white/70 p-4 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 z-50">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={chatState.enableRag ? "primary" : "secondary"}
                        iconLeft={<Database className="h-4 w-4" />}
                        className="!rounded-full"
                        aria-pressed={chatState.enableRag}
                        onClick={() =>
                          setChatState((prev) => ({
                            ...prev,
                            enableRag: !prev.enableRag,
                          }))
                        }
                      >
                        {t("RAG")}
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          chatState.enableWebSearch ? "primary" : "secondary"
                        }
                        iconLeft={<Globe className="h-4 w-4" />}
                        className="!rounded-full"
                        aria-pressed={chatState.enableWebSearch}
                        onClick={() =>
                          setChatState((prev) => ({
                            ...prev,
                            enableWebSearch: !prev.enableWebSearch,
                          }))
                        }
                      >
                        {t("Web Search")}
                      </Button>
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                        Council depth
                      </label>
                      <select
                        value={chatState.councilDepth}
                        onChange={(e) =>
                          setChatState((prev) => ({
                            ...prev,
                            councilDepth: e.target.value as
                              | "standard"
                              | "quick"
                              | "deep",
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-border bg-surface-elevated/70 px-3 text-sm text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                      >
                        <option value="standard">Standard (recommended)</option>
                        <option value="quick">Quick</option>
                        <option value="deep">Deep</option>
                      </select>
                      <div className="text-[11px] leading-relaxed text-text-tertiary dark:text-zinc-400">
                        Standard pauses after review so you can inject extra
                        cross-exam questions.
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between rounded-xl border border-border bg-surface-elevated/55 px-3 py-2 text-xs text-text-secondary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                      <div>
                        <div className="font-semibold text-text-primary dark:text-zinc-100">
                          Interactive checkpoints
                        </div>
                        <div className="text-[11px] text-text-tertiary dark:text-zinc-400">
                          Pause between steps (not during generation).
                        </div>
                      </div>
                      <Button
                        variant={
                          chatState.enableCouncilInteraction
                            ? "primary"
                            : "secondary"
                        }
                        size="sm"
                        onClick={() =>
                          setChatState((prev) => ({
                            ...prev,
                            enableCouncilInteraction:
                              !prev.enableCouncilInteraction,
                          }))
                        }
                      >
                        {chatState.enableCouncilInteraction ? "On" : "Off"}
                      </Button>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                        Council audio (TTS)
                      </label>
                      <select
                        value={chatState.councilAudioMode}
                        onChange={(e) =>
                          setChatState((prev) => ({
                            ...prev,
                            councilAudioMode: e.target.value as
                              | "off"
                              | "final"
                              | "all",
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-border bg-surface-elevated/70 px-3 text-sm text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                      >
                        <option value="off">Off</option>
                        <option value="final">Final answer</option>
                        <option value="all">All council messages</option>
                      </select>
                      <div className="text-[11px] leading-relaxed text-text-tertiary dark:text-zinc-400">
                        Audio is generated after council completes; it uses your
                        TTS settings.
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                        Checkpoint timeout (seconds)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={600}
                        value={chatState.councilCheckpointTimeoutS}
                        onChange={(e) =>
                          setChatState((prev) => ({
                            ...prev,
                            councilCheckpointTimeoutS: Math.max(
                              5,
                              Math.min(600, Number(e.target.value || 0)),
                            ),
                          }))
                        }
                        className="h-9 w-full rounded-xl border border-border bg-surface-elevated/70 px-3 text-sm text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                      />
                    </div>

                    {chatState.enableRag && (
                      <div className="mt-4 space-y-1.5">
                        <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                          {t("Select Knowledge Base")}
                        </label>
                        <select
                          value={chatState.selectedKb}
                          onChange={(e) =>
                            setChatState((prev) => ({
                              ...prev,
                              selectedKb: e.target.value,
                            }))
                          }
                          className="h-9 w-full rounded-xl border border-border bg-surface-elevated/70 px-3 text-sm text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                        >
                          {kbs.map((kb) => (
                            <option key={kb.name} value={kb.name}>
                              {kb.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <p className="mt-4 text-xs text-text-tertiary dark:text-zinc-400">
                      {t(
                        "Replies include sources + a confidence estimate. Use Council verification for high-stakes answers.",
                      )}
                    </p>
                  </div>
                </details>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewChat}
                  iconLeft={<Trash2 className="h-3.5 w-3.5" />}
                  className="text-text-secondary hover:text-red-600 hover:bg-red-50 dark:text-zinc-300 dark:hover:text-red-300 dark:hover:bg-red-500/10"
                >
                  {t("New Chat")}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Messages Area */}
          <div className="relative flex-1 overflow-y-auto px-6 py-7 sm:px-8">
            <div className="mx-auto max-w-4xl space-y-7">
              <AnimatePresence mode="popLayout">
                {chatState.messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                    className="flex gap-4"
                  >
                    {msg.role === "user" ? (
                      <>
                        {/* User Avatar */}
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-elevated dark:bg-zinc-800">
                          <User className="h-5 w-5 text-text-secondary dark:text-zinc-200" />
                        </div>

                        {/* User Message Bubble */}
                        <Card
                          variant="glass"
                          padding="none"
                          interactive={false}
                          className="flex-1 !rounded-2xl !rounded-tl-md border-border bg-surface-elevated/60 px-5 py-4 text-text-primary shadow-glass-sm dark:border-white/10 dark:bg-zinc-950/45 dark:text-zinc-100"
                        >
                          {msg.content}
                        </Card>
                      </>
                    ) : (
                      <>
                        {/* Bot Avatar */}
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20",
                            msg.isStreaming && "ring-2 ring-blue-500/20",
                          )}
                        >
                          <Bot className="h-5 w-5 text-white" />
                        </div>

                        {/* Bot Message Bubble */}
                        <div className="flex-1 space-y-3">
                          <Card
                            variant="glass"
                            padding="none"
                            interactive={false}
                            className="!rounded-2xl !rounded-tl-md border-border bg-surface-elevated/55 px-5 py-4 shadow-glass-sm dark:border-white/10 dark:bg-zinc-950/55"
                          >
                            <div className="prose prose-zinc prose-sm max-w-none text-text-primary dark:text-zinc-100">
                              <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {processLatexContent(msg.content)}
                              </ReactMarkdown>
                            </div>

                            {/* Streaming Indicator */}
                            {msg.isStreaming && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 flex items-center gap-2 text-sm text-accent-primary dark:text-blue-300"
                              >
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>{t("Generating response...")}</span>
                              </motion.div>
                            )}
                          </Card>

                          {/* Transparency */}
                          {(() => {
                            const ragCount = msg.sources?.rag?.length ?? 0;
                            const webCount = msg.sources?.web?.length ?? 0;
                            const sourceCount = ragCount + webCount;

                            const confidence = msg.meta?.verified
                              ? 0.92
                              : sourceCount > 0
                                ? 0.74
                                : 0.6;

                            const confidenceLabel =
                              confidence >= 0.85
                                ? "High"
                                : confidence >= 0.65
                                  ? "Medium"
                                  : "Low";

                            const method =
                              ragCount > 0 && webCount > 0
                                ? "KB + Web"
                                : ragCount > 0
                                  ? "KB"
                                  : webCount > 0
                                    ? "Web"
                                    : "Direct";

                            const kbNames = Array.from(
                              new Set(
                                (msg.sources?.rag ?? [])
                                  .map((s) => s.kb_name)
                                  .filter(Boolean),
                              ),
                            );

                            const webSources = (msg.sources?.web ?? []).slice(
                              0,
                              6,
                            );

                            return (
                              <details className="group">
                                <summary className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-elevated/40 px-4 py-2 text-xs text-text-secondary shadow-glass-sm backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/55 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10 cursor-pointer [&::-webkit-details-marker]:hidden [&::marker]:content-none">
                                  <span className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/60 px-3 py-1 font-medium text-text-primary dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-100">
                                      <span className="flex items-center gap-1">
                                        {[0, 1, 2, 3, 4].map((i) => (
                                          <span
                                            key={i}
                                            className={cn(
                                              "h-3 w-1 rounded-full",
                                              i < Math.round(confidence * 5)
                                                ? "bg-accent-primary/80"
                                                : "bg-border/70 dark:bg-white/10",
                                            )}
                                          />
                                        ))}
                                      </span>
                                      <span>{confidenceLabel}</span>
                                      <span className="text-text-tertiary dark:text-zinc-400">
                                        {Math.round(confidence * 100)}%
                                      </span>
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-border bg-surface-elevated/60 px-3 py-1 font-medium text-text-secondary dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-200">
                                      Method: {method}
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-border bg-surface-elevated/60 px-3 py-1 font-medium text-text-secondary dark:border-white/10 dark:bg-zinc-950/40 dark:text-zinc-200">
                                      {t("Sources")}: {sourceCount || "—"}
                                    </span>
                                  </span>
                                  <ChevronDown className="h-4 w-4 text-text-tertiary transition-transform duration-150 group-open:rotate-180 dark:text-zinc-400" />
                                </summary>

                                <div className="mt-2 rounded-2xl border border-border bg-surface-elevated/45 p-4 shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/45">
                                  <div className="space-y-4">
                                    <div>
                                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary dark:text-zinc-400">
                                        Reasoning (high-level)
                                      </p>
                                      <ul className="mt-2 space-y-1 text-xs text-text-secondary dark:text-zinc-300">
                                        {ragCount > 0 ? (
                                          <li>
                                            Grounded the answer using your
                                            knowledge base.
                                          </li>
                                        ) : (
                                          <li>
                                            No knowledge-base grounding was used
                                            for this reply.
                                          </li>
                                        )}
                                        {webCount > 0 ? (
                                          <li>
                                            Included web sources to improve
                                            freshness and coverage.
                                          </li>
                                        ) : (
                                          <li>
                                            No web sources were used for this
                                            reply.
                                          </li>
                                        )}
                                        <li>
                                          Confidence is a UI estimate. Verify
                                          with Council for high-stakes answers.
                                        </li>
                                      </ul>
                                    </div>

                                    {sourceCount > 0 && (
                                      <div className="grid gap-4 sm:grid-cols-2">
                                        {kbNames.length > 0 && (
                                          <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary dark:text-zinc-400">
                                              {t("From Knowledge Base")}
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                              {kbNames.map((name) => (
                                                <span
                                                  key={name}
                                                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-200"
                                                >
                                                  <BookOpen className="h-3 w-3" />
                                                  <span className="max-w-[180px] truncate">
                                                    {name}
                                                  </span>
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {webSources.length > 0 && (
                                          <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary dark:text-zinc-400">
                                              {t("From Web")}
                                            </p>
                                            <div className="mt-2 space-y-2">
                                              {webSources.map((source, i) => (
                                                <a
                                                  key={`${source.url}-${i}`}
                                                  href={source.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-2 rounded-xl border border-border bg-surface-elevated/60 px-3 py-2 text-xs text-text-secondary backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/80 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                                                >
                                                  <Globe className="h-3.5 w-3.5 text-text-tertiary" />
                                                  <span className="min-w-0 flex-1 truncate">
                                                    {source.title || source.url}
                                                  </span>
                                                  <ExternalLink className="h-3.5 w-3.5 text-text-tertiary" />
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </details>
                            );
                          })()}

                          {/* Actions */}
                          {!msg.isStreaming && (
                            <>
                              <div className="flex flex-wrap items-center gap-2">
                                {msg.meta?.verified ? (
                                  <>
                                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-200">
                                      Verified (Council)
                                    </div>
                                    {msg.meta.council_id ? (
                                      <CouncilDetails
                                        councilId={msg.meta.council_id}
                                      />
                                    ) : null}
                                  </>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => verifyChatMessage(idx)}
                                    iconLeft={
                                      <Microscope className="h-3.5 w-3.5" />
                                    }
                                    className="border-border bg-surface-elevated/55 text-text-secondary hover:bg-blue-50/70 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
                                  >
                                    Verify with Council
                                  </Button>
                                )}
                              </div>

                              {msg.meta?.audio_url || msg.meta?.audio_error ? (
                                <div className="rounded-2xl border border-border bg-surface-elevated/45 px-4 py-3 text-xs shadow-glass-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="inline-flex items-center gap-2 font-semibold text-text-primary dark:text-zinc-100">
                                      <Volume2 className="h-4 w-4 text-accent-primary" />
                                      <span>
                                        Audio
                                        {msg.meta?.voice ? (
                                          <span className="font-medium text-text-tertiary dark:text-zinc-400">
                                            {" "}
                                            · {msg.meta.voice}
                                          </span>
                                        ) : null}
                                      </span>
                                    </div>
                                    {msg.meta?.audio_url ? (
                                      <a
                                        href={apiUrl(msg.meta.audio_url)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-elevated/55 px-3 py-1 font-medium text-text-secondary transition-colors hover:bg-surface-elevated/75 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
                                      >
                                        Open
                                        <ExternalLink className="h-3.5 w-3.5 text-text-tertiary dark:text-zinc-400" />
                                      </a>
                                    ) : null}
                                  </div>

                                  {msg.meta?.audio_error ? (
                                    <div className="mt-2 text-[11px] text-red-600 dark:text-red-300">
                                      {msg.meta.audio_error}
                                    </div>
                                  ) : msg.meta?.audio_url ? (
                                    <audio
                                      className="mt-2 w-full"
                                      controls
                                      preload="none"
                                      src={apiUrl(msg.meta.audio_url)}
                                    />
                                  ) : null}
                                </div>
                              ) : null}
                            </>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading Status Indicator */}
              <AnimatePresence>
                {chatState.isLoading && chatState.currentStage && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }
                    }
                    className="flex gap-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/20">
                      <Loader2 className="h-5 w-5 motion-safe:animate-spin text-white" />
                    </div>
                    <Card
                      variant="glass"
                      padding="none"
                      interactive={false}
                      className="flex-1 !rounded-2xl !rounded-tl-md border-border bg-surface-elevated/55 px-5 py-4 shadow-glass-sm dark:border-white/10 dark:bg-zinc-950/55"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-sm text-text-secondary dark:text-zinc-300">
                          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-500" />
                          {chatState.currentStage === "rag" &&
                            t("Searching knowledge base...")}
                          {chatState.currentStage === "web" &&
                            t("Searching the web...")}
                          {chatState.currentStage === "generating" &&
                            t("Generating response...")}
                          {!["rag", "web", "generating"].includes(
                            chatState.currentStage,
                          ) && chatState.currentStage}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold",
                              ["rag", "web"].includes(chatState.currentStage)
                                ? "border-blue-200/70 bg-blue-50/70 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200"
                                : "border-border bg-surface-elevated/55 text-text-tertiary dark:border-white/10 dark:bg-white/5 dark:text-zinc-400",
                            )}
                          >
                            Retrieve
                          </span>
                          <span className="text-text-tertiary/60 dark:text-zinc-500">
                            →
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold",
                              chatState.currentStage === "generating"
                                ? "border-blue-200/70 bg-blue-50/70 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200"
                                : "border-border bg-surface-elevated/55 text-text-tertiary dark:border-white/10 dark:bg-white/5 dark:text-zinc-400",
                            )}
                          >
                            Reason
                          </span>
                          <span className="text-text-tertiary/60 dark:text-zinc-500">
                            →
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2.5 py-0.5 font-semibold",
                              chatState.currentStage === "generating"
                                ? "border-blue-200/70 bg-blue-50/70 text-blue-700 dark:border-blue-400/20 dark:bg-blue-500/10 dark:text-blue-200"
                                : "border-border bg-surface-elevated/55 text-text-tertiary dark:border-white/10 dark:bg-white/5 dark:text-zinc-400",
                            )}
                          >
                            Respond
                          </span>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Council Checkpoint Panel */}
          {chatState.councilCheckpoint ? (
            <div className="border-t border-border bg-surface-elevated/60 px-6 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/50">
              <div className="mx-auto max-w-4xl">
                <Card
                  variant="glass"
                  padding="none"
                  interactive={false}
                  className="border-border bg-surface-elevated/55 px-5 py-4 shadow-glass-sm dark:border-white/10 dark:bg-zinc-950/55"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-text-primary dark:text-zinc-100">
                        Council checkpoint (round{" "}
                        {chatState.councilCheckpoint.round_index})
                      </div>
                      <div className="mt-1 text-xs text-text-tertiary dark:text-zinc-400">
                        Add cross-exam questions and/or notes for the chairman,
                        then continue.
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          sendCouncilCheckpoint({ action: "cancel" })
                        }
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          sendCouncilCheckpoint({
                            action: "continue",
                            user_questions: checkpointUserQuestions,
                            notes_for_chairman: checkpointNotes,
                          })
                        }
                      >
                        Continue
                      </Button>
                    </div>
                  </div>

                  {chatState.councilCheckpoint.cross_exam_questions?.length ? (
                    <div className="mt-4 rounded-xl border border-border/70 bg-surface-elevated/50 px-4 py-3 text-xs text-text-secondary dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                      <div className="font-semibold text-text-primary dark:text-zinc-100">
                        Reviewer cross-exam (proposed)
                      </div>
                      <ul className="mt-2 list-disc space-y-1 pl-4">
                        {chatState.councilCheckpoint.cross_exam_questions.map(
                          (q, i) => (
                            <li key={`${i}-${q}`}>{q}</li>
                          ),
                        )}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                        Add cross-exam questions (one per line)
                      </label>
                      <textarea
                        value={checkpointUserQuestions}
                        onChange={(e) =>
                          setCheckpointUserQuestions(e.target.value)
                        }
                        rows={6}
                        className="w-full resize-none rounded-xl border border-border bg-surface-elevated/70 px-3 py-2 text-xs text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                        placeholder="e.g.\nWhat key assumption is unsupported?\nWhat detail would change the answer?"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-text-tertiary dark:text-zinc-400">
                        Notes for chairman
                      </label>
                      <textarea
                        value={checkpointNotes}
                        onChange={(e) => setCheckpointNotes(e.target.value)}
                        rows={6}
                        className="w-full resize-none rounded-xl border border-border bg-surface-elevated/70 px-3 py-2 text-xs text-text-primary outline-none backdrop-blur-md transition-colors duration-150 hover:bg-surface-elevated/85 focus:border-blue-400/70 dark:border-white/10 dark:bg-zinc-950/50 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
                        placeholder="e.g.\nPrefer the explanation that matches the provided context; avoid adding outside facts."
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0 }
                : { duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }
            }
            className="relative border-t border-border bg-surface-elevated/75 px-6 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/60"
          >
            <div className="relative mx-auto max-w-4xl">
              {hasMessages ? (
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs text-text-tertiary dark:text-zinc-400">
                    <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/55 px-3 py-1.5 font-medium text-text-secondary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                      <Microscope className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />
                      Council: {chatState.councilDepth}
                    </span>
                    <span className="hidden sm:inline">
                      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-elevated/55 px-3 py-1.5 font-medium text-text-secondary backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-zinc-300">
                        <Volume2 className="h-3.5 w-3.5 text-accent-primary" />
                        Audio:{" "}
                        {chatState.councilAudioMode === "off"
                          ? "Off"
                          : chatState.councilAudioMode === "final"
                            ? "Final"
                            : "All"}
                      </span>
                    </span>
                    <span className="hidden sm:inline">
                      Checkpoints:{" "}
                      {chatState.enableCouncilInteraction ? "On" : "Off"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    iconLeft={<Microscope className="h-4 w-4" />}
                    onClick={handleVerifyLast}
                    disabled={
                      chatState.isLoading || lastVerifiableAssistantIndex < 0
                    }
                    className="border-blue-200/70 bg-surface-elevated/60 text-text-primary hover:bg-blue-50/70 hover:text-blue-700 dark:border-blue-400/20 dark:bg-white/5 dark:text-zinc-100 dark:hover:bg-blue-500/10 dark:hover:text-blue-200"
                  >
                    Verify last answer
                  </Button>
                </div>
              ) : null}
              <div
                className={cn(
                  "rounded-2xl transition-shadow duration-150",
                  isFocused
                    ? "shadow-[0_0_0_4px_rgba(59,130,246,0.10),0_12px_30px_-12px_rgba(59,130,246,0.22)]"
                    : "shadow-glass-sm",
                )}
              >
                <input
                  ref={inputRef}
                  type="text"
                  className={`
	                  w-full rounded-2xl border px-5 py-4 pr-44
	                  bg-surface-elevated/70 backdrop-blur-md
	                  placeholder:text-text-tertiary text-text-primary
	                  dark:bg-zinc-950/50 dark:placeholder:text-text-tertiary dark:text-zinc-100
	                  ${
                      isFocused
                        ? "border-blue-400/70 dark:border-blue-400/60"
                        : "border-border hover:border-border-hover dark:border-white/10 dark:hover:border-white/20"
                    }
	                  focus:outline-none
	                  transition-colors duration-150
	                `}
                  aria-label={t("Message")}
                  placeholder="Ask Co-Pilot..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  disabled={chatState.isLoading}
                  autoComplete="off"
                />
              </div>

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <IconButton
                  aria-label="Voice input"
                  icon={
                    <Mic
                      className={cn(
                        "h-5 w-5",
                        voiceRecording && "text-rose-500",
                      )}
                    />
                  }
                  size="md"
                  variant="secondary"
                  onClick={handleToggleVoiceInput}
                  className={cn(
                    "!rounded-xl",
                    voiceRecording && "ring-2 ring-rose-500/20",
                  )}
                />
                <IconButton
                  aria-label="Insert equation"
                  icon={<Sigma className="h-5 w-5" />}
                  size="md"
                  variant="secondary"
                  onClick={handleOpenEquationEditor}
                  className="!rounded-xl"
                />
                <IconButton
                  aria-label={t("Send message")}
                  icon={
                    chatState.isLoading ? (
                      <Loader2 className="h-5 w-5 motion-safe:animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )
                  }
                  size="md"
                  variant={inputMessage.trim() ? "primary" : "secondary"}
                  onClick={handleSend}
                  disabled={chatState.isLoading || !inputMessage.trim()}
                  className="!rounded-xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </PageWrapper>

      <Modal
        isOpen={equationEditorOpen}
        onClose={() => setEquationEditorOpen(false)}
        title="Equation editor"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() =>
                setEquationLatex((prev) => `${prev}${prev ? " " : ""}\\alpha`)
              }
            >
              Alpha
            </Button>
          </div>

          <div
            className={cn(
              "rounded-xl px-4 py-3 font-mono text-sm tabular-nums",
              eliteTheme.recessed,
            )}
            data-testid="equation-latex"
          >
            {equationLatex}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEquationEditorOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleInsertEquation}
            >
              Insert
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
