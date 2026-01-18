"use client";

import { useGlobal } from "@/context/GlobalContext";
import { getTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MacbookScroll } from "@/components/ui/macbook-scroll";
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input";
import { PinContainer } from "@/components/ui/3d-pin";
import { ShiftCard } from "@/components/ui/shift-card";
import ReactMarkdown from "react-markdown";
import {
  Calculator,
  PenTool,
  Microscope,
  Lightbulb,
  GraduationCap,
  Edit3,
  Sparkles,
  Zap,
  ArrowRight,
  Database,
  Globe,
} from "lucide-react";
import { useRef, useCallback, useState, useEffect } from "react";
import { motion, useScroll, useSpring, useTransform, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SimpleTabs } from "@/components/ui/SimpleTabs";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

type KnowledgeBaseListItem = {
  name: string;
};

type ConversationStarter = {
  id: string;
  title: string;
  prompt: string;
  icon: React.ReactNode;
};

type WelcomeSection = "hero" | "starters" | "modules";

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
  const router = useRouter();
  const t = useCallback(
    (key: string) => getTranslation(uiSettings.language, key),
    [uiSettings.language],
  );

  const [inputMessage, setInputMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const chatPanelRef = useRef<HTMLDivElement>(null);
  const startersSectionRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const scrollRootRef = useRef<HTMLDivElement>(null);

  // Scroll animations
  const { scrollYProgress } = useScroll({
    container: scrollRootRef,
  });
  const pageScrollProgressSpring = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const kbs: KnowledgeBaseListItem[] = []; // Assuming empty if not fetched here, usually fetched in context

  const conversationStarters: ConversationStarter[] = [
    {
      id: "explain-quantum",
      title: "Quantum Physics",
      prompt: "Explain quantum entanglement like I'm 5.",
      icon: <Microscope className="h-5 w-5" />,
    },
    {
      id: "write-story",
      title: "Creative Writing",
      prompt: "Write a short sci-fi story about an AI that learns to dream.",
      icon: <Edit3 className="h-5 w-5" />,
    },
    {
      id: "solve-math",
      title: "Math Problem",
      prompt: "Solve the integral of x*sin(x) from 0 to pi.",
      icon: <Calculator className="h-5 w-5" />,
    },
  ];

  const handleStartChat = (initialPrompt?: string) => {
    if (initialPrompt) {
        router.push(`/chat?q=${encodeURIComponent(initialPrompt)}`);
    } else {
        router.push('/chat');
    }
  };

  const welcomeTabs = () => [
    { id: "hero", label: "Home" },
    { id: "starters", label: "Start" },
    { id: "modules", label: "Explore" },
  ];

  const [activeWelcomeSection, setActiveWelcomeSection] = useState<WelcomeSection>("hero");

  const scrollToWelcomeSection = (id: WelcomeSection) => {
    setActiveWelcomeSection(id);
    // Logic to scroll to section
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
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
                <SimpleTabs
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
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
            <motion.div
              ref={heroSectionRef}
              initial="hidden"
              animate="visible"
              variants={containerVariants}
              className="flex flex-col gap-12"
            >
                {/* Hero Section */}
                <motion.div variants={itemVariants} className="text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-text-primary sm:text-5xl lg:text-6xl dark:text-white">
                        {t("Welcome to OpenCode")}
                    </h1>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary dark:text-zinc-400">
                        {t("Your AI-powered research and learning assistant.")}
                    </p>
                </motion.div>

                {/* Modules Section (ShiftCard) */}
                <motion.div
                    variants={fadeInUp}
                    className="mt-8 grid max-w-xl grid-cols-1 gap-6 sm:grid-cols-2 mx-auto"
                  >
                      <ShiftCard
                        topContent={
                          <div className="flex flex-col gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/20 dark:text-accent-primary">
                              <Database className="h-5 w-5" />
                            </div>
                            <div className="font-bold text-lg text-neutral-800 dark:text-neutral-200">
                              {t("Grounded")}
                            </div>
                          </div>
                        }
                        middleContent={
                          <div className="text-6xl font-bold text-neutral-200 dark:text-neutral-800">
                            RAG
                          </div>
                        }
                        bottomContent={
                          <div className="p-4">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {t("Use your knowledge base for verifiable answers.")}
                            </p>
                          </div>
                        }
                      />
                      <ShiftCard
                        topContent={
                          <div className="flex flex-col gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-primary/10 text-accent-primary dark:bg-accent-primary/20 dark:text-accent-primary">
                              <Globe className="h-5 w-5" />
                            </div>
                            <div className="font-bold text-lg text-neutral-800 dark:text-neutral-200">
                              {t("Connected")}
                            </div>
                          </div>
                        }
                        middleContent={
                          <div className="text-6xl font-bold text-neutral-200 dark:text-neutral-800">
                            WEB
                          </div>
                        }
                        bottomContent={
                          <div className="p-4">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                              {t("Optional web search to stay up to date.")}
                            </p>
                          </div>
                        }
                      />
                  </motion.div>

                {/* Macbook Scroll & Search */}
                <div className="flex flex-col gap-8 mb-20 relative z-10">
                   <div className="w-full max-w-2xl mx-auto relative z-20">
                      <PlaceholdersAndVanishInput
                        placeholders={[
                          "Explain quantum computing in simple terms",
                          "Analyze my sales data for Q4 trends",
                          "Write a python script to parse CSV",
                          "Design a marketing strategy for a SaaS app",
                          "What are the latest AI trends in 2026?"
                        ]}
                        onChange={() => {}}
                        onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
                          e.preventDefault();
                          router.push('/chat');
                        }}
                      />
                   </div>
                   
                   <div className="overflow-hidden w-full relative z-10">
                      <MacbookScroll
                        title={
                          <span className="text-3xl font-bold tracking-tight text-text-primary dark:text-white">
                            Your AI Command Center
                          </span>
                        }
                        badge={
                          <Link href="/chat">
                            <div className="h-12 w-12 transform -rotate-12 rounded-full bg-accent-primary flex items-center justify-center shadow-lg cursor-pointer hover:scale-110 transition-transform">
                               <Zap className="h-6 w-6 text-white" />
                            </div>
                          </Link>
                        }
                        src="https://assets.aceternity.com/linear.webp"
                        showGradient={false}
                      />
                   </div>
                </div>

                {/* Conversation Starters (3D Pin) */}
                {conversationStarters.length > 0 && (
                  <motion.section
                    variants={containerVariants}
                    ref={startersSectionRef}
                    className="mt-16 scroll-mt-28"
                  >
                    <div className="flex items-center gap-2 mb-8 justify-center">
                      <Sparkles className="h-4 w-4 text-accent-primary" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-text-tertiary dark:text-zinc-400">
                        {t("Conversation Starters")}
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                      {conversationStarters.map((starter) => (
                        <div key={starter.id} onClick={() => handleStartChat(starter.prompt)} className="cursor-pointer group flex justify-center">
                          <PinContainer title="Start Chat" href={`/chat?q=${encodeURIComponent(starter.prompt)}`}>
                            <div className="flex flex-col gap-4 p-4 w-[18rem] h-[10rem] bg-surface-elevated/80 backdrop-blur-md rounded-xl border border-white/10">
                              <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-lg bg-accent-primary/10 text-accent-primary group-hover:bg-accent-primary/20 transition-colors">
                                  {starter.icon}
                                </div>
                                <h3 className="font-bold text-lg text-text-primary group-hover:text-accent-primary transition-colors">
                                  {starter.title}
                                </h3>
                              </div>
                              <p className="text-sm text-text-tertiary leading-relaxed line-clamp-3">
                                {starter.prompt}
                              </p>
                            </div>
                          </PinContainer>
                        </div>
                      ))}
                    </div>
                  </motion.section>
                )}
            </motion.div>
        </main>
    </div>
  );
}

// Mock eliteTheme for standalone build safety if not imported
const eliteTheme = {
    density: {
        compact: {
            pageX: "px-4 sm:px-6",
            headerY: "py-3",
            monoLabel: "font-mono text-xs"
        }
    }
};
