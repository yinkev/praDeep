---
layout: home

hero:
  name: "praDeep"
  text: "AI-Powered Deep Learning Platform"
  tagline: Experience the future of intelligent learning with our Liquid Cloud design system - built on Next.js 16.1, React 19.2, and Tailwind 4.1
  image:
    src: /logo.png
    alt: praDeep
  actions:
    - theme: brand
      text: Quick Start →
      link: /guide/getting-started
    - theme: alt
      text: GitHub
      link: https://github.com/HKUDS/praDeep
    - theme: alt
      text: 🚀 Roadmap
      link: /roadmap

features:
  - icon: 🧠
    title: Adaptive Reasoning Engine
    details: Advanced dual-loop reasoning with step-by-step solutions, precise document citations, and real-time knowledge synthesis powered by our 2026 AI architecture.
  - icon: 🎯
    title: Intelligent Practice Studio
    details: Generate adaptive quizzes, exam simulations, and personalized assessments from your materials with our Liquid Cloud-powered practice engine.
  - icon: 🎓
    title: Immersive Learning Paths
    details: Personalized learning journeys with 3D interactive visualizations, adaptive explanations, and progress tracking through the Liquid Cloud interface.
  - icon: 🔬
    title: Research Intelligence Hub
    details: Systematic topic exploration with integrated web search, paper retrieval, literature synthesis, and citation network analysis.
  - icon: 💡
    title: Creative Ideation Lab
    details: Brainstorm research ideas with automated concept synthesis, novelty evaluation, and collaborative mind-mapping tools.
  - icon: ✏️
    title: AI Writing Companion
    details: Intelligent writing assistance with context-aware editing, auto-annotation, multi-format export, and natural TTS narration.
---

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  --vp-home-hero-image-background-image: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 50%, rgba(240, 147, 251, 0.15) 100%);
  --vp-home-hero-image-filter: blur(68px);
}

.dark {
  --vp-home-hero-image-background-image: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 50%, rgba(240, 147, 251, 0.1) 100%);
}

/* praDeep 标题更大 */
.VPHero .name {
  font-size: 4rem !important;
  line-height: 1.1 !important;
}

.VPHero .text {
  font-size: 2.2rem !important;
  font-weight: 600 !important;
  color: var(--vp-c-text-1);
}

@media (max-width: 768px) {
  .VPHero .name {
    font-size: 2.8rem !important;
  }
  .VPHero .text {
    font-size: 1.6rem !important;
  }
}

/* Hero 区域 Roadmap 按钮特殊样式 */
.VPButton.alt[href="/praDeep/roadmap"] {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  color: white !important;
  border: none !important;
}

.VPButton.alt[href="/praDeep/roadmap"]:hover {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
  transform: translateY(-2px);
}
</style>
