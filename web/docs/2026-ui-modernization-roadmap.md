# 2026 UI Modernization Roadmap

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deliver a consistent 2026-grade UI across the entire `web/` app with unified layout, components, and motion while preserving existing workflows and data behaviors.

**Architecture:** Keep App Router pages intact, consolidate visual language through `PageWrapper`, `Card`, `Button`, `Input`, and motion variants, and standardize state-driven UI (loading/empty/error) across pages and shared components.

**Tech Stack:** Next.js App Router, React, Tailwind CSS (v4), Framer Motion, lucide-react, ReactMarkdown/remark/rehype, KaTeX.

**Skills:** @superpowers:executing-plans (required for implementation handoff).

---

## 1. Modernization Goals and Success Criteria

**Scope:** `web/app/*` pages listed in Section 5 plus all components in `web/components/ui/` and `web/components/`.

**Primary outcomes:**
- Visual cohesion across pages (typography, surface elevation, spacing, and motion).
- Predictable component contract usage (props, variants, disabled/loading states).
- Consistent experience for data fetch flows (loading skeletons, empty states, error toasts).
- Performance and accessibility parity or better (no regressions in keyboard or screen reader paths).

**Success criteria (measurable):**
- All pages use `PageWrapper` and `PageHeader` with consistent spacing and hero patterns.
- Every modal/panel uses `Modal` and `Card` variants (no custom shadows or borders).
- Loading and empty states present in every list or dashboard view.
- `prefers-reduced-motion` respected in all animations via `useReducedMotion` or CSS.

**Modern UI baseline (example spec):**
```tsx
// Standard page shell
<PageWrapper maxWidth="wide" showPattern>
  <PageHeader
    title="Research"
    description="Deep-dive analysis with traceable steps"
    icon={<Microscope className="h-5 w-5 text-blue-600" />}
    actions={<Button variant="primary">New Session</Button>}
  />
  {/* Page content */}
</PageWrapper>
```

---

## 2. Design System Alignment and Tokens

**Foundations (do not override):**
- Use tokens from `web/app/globals.css` for surfaces, borders, text, and spacing.
- Prefer component variants in `web/components/ui/` over bespoke styles.

**Color and surface rules:**
- Surfaces: `bg-surface-elevated`, `bg-surface-secondary`, `bg-surface-raised`.
- Text: `text-text-primary`, `text-text-secondary`, `text-text-muted`.
- Borders: `border-border`, `border-border-strong`.
- Accent: `text-accent-primary`, `bg-accent-primary/10`.

**Typography and spacing:**
- Use `text-sm` and `leading-relaxed` for body, `text-2xl font-semibold` for primary page titles.
- Layout spacing: 24px vertical for major blocks, 16px for internal card sections.

**Token usage example:**
```tsx
<Card variant="elevated" className="border border-border">
  <CardHeader>
    <div className="text-xs uppercase tracking-wide text-text-muted">Metrics</div>
    <h3 className="text-lg font-semibold text-text-primary">Weekly Progress</h3>
  </CardHeader>
  <CardBody className="text-sm text-text-secondary">
    Consistent use of surface and border tokens keeps contrast stable in light/dark modes.
  </CardBody>
</Card>
```

**Animation spec:**
- Default easing: `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo).
- Page-level motion: staggered fade-in for sections, 0.06-0.1s delays.
- Interactive motion: 0.98 scale on press, subtle 1.02 scale on hover.

---

## 3. Layout, Navigation, and Interaction Patterns

**Global layout rules:**
- Pages should anchor content inside `PageWrapper` with a consistent max width (`default` or `wide`).
- Section grouping uses `Card` and `CardHeader`/`CardBody` for scannability.
- Avoid custom `div` borders for primary surfaces; prefer `Card` variants.

**Page layout template:**
```tsx
<PageWrapper maxWidth="wide" showPattern>
  <PageHeader
    title="Analytics"
    description="Track activity, mastery, and momentum"
    icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
    actions={
      <div className="flex items-center gap-2">
        <Button variant="secondary">Export</Button>
        <Button variant="primary">Refresh</Button>
      </div>
    }
  />

  <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
    <Card variant="glass">
      <CardHeader title="Overview" description="Activity and learning signals" />
      <CardBody>{/* charts */}</CardBody>
    </Card>
    <Card variant="default">
      <CardHeader title="Insights" />
      <CardBody>{/* highlights */}</CardBody>
    </Card>
  </div>
</PageWrapper>
```

**Interaction patterns:**
- Lists: clickable rows must be `button` or `Link` with `aria-*` states.
- Forms: use `Input`/`Textarea` with `helperText` and `error` props.
- Modals: use `Modal`, `ModalHeader`, `ModalBody`, `ModalFooter` only.

---

## 4. Component Modernization Roadmap (UI + Shared Components)

**Goal:** Align all shared components to consistent styling, motion, and accessibility behaviors. Every component should:
- Respect reduced motion
- Include explicit empty/loading states if data-driven
- Use design tokens and `cn()` for consistent class composition

### 4.1 UI primitives (`web/components/ui/`)

**`web/components/ui/Button.tsx`**
- Spec: enforce consistent icon sizing per `size`, align loading spinner with icon slot.
- Add a `variant="tertiary"` if needed to replace ad-hoc muted buttons.
- Example usage:
```tsx
<Button variant="primary" loading={isSaving} iconLeft={<Zap className="h-4 w-4" />}>
  Save Changes
</Button>
```

**`web/components/ui/Card.tsx`**
- Spec: ensure `CardHeader` and `CardBody` always align spacing for `sm/md/lg`.
- Add `interactive` hover states for dashboards and list rows.
- Example usage:
```tsx
<Card variant="glass" interactive padding="md">
  <CardHeader title="Active Tasks" description="Live execution timeline" />
  <CardBody className="space-y-3">{rows}</CardBody>
</Card>
```

**`web/components/ui/Input.tsx`**
- Spec: support `helperText`, `error`, `success` consistently with icons.
- Use `floatingLabel` for compact forms.
- Example usage:
```tsx
<Input
  label="Search"
  placeholder="Find topics"
  leftIcon={<Search className="h-4 w-4" />}
  helperText="Search within this page"
/>
```

**`web/components/ui/LoadingState.tsx`**
- Spec: standardize loading placeholders for lists, cards, and full-page overlays.
- Add a `PageSkeleton` export for dashboard pages.
- Example usage:
```tsx
<FullPageLoading isVisible={isLoading} message="Loading analytics" />
```

**`web/components/ui/MediaUpload.tsx`**
- Spec: align upload button visuals with `Button` sizing and use `Input` error styles.
- Ensure preview tiles use `Card` surface tokens.
- Example usage:
```tsx
<MediaUpload media={media} onMediaChange={setMedia} maxFiles={4} />
```

**`web/components/ui/Modal.tsx`**
- Spec: keep focus trap, ESC close, and motion variants consistent.
- Add optional `description` for header to align with `PageHeader` patterns.
- Example usage:
```tsx
<Modal isOpen={isOpen} onClose={onClose} title="Add to Notebook" size="lg">
  <ModalBody>{content}</ModalBody>
  <ModalFooter>
    <Button variant="ghost" onClick={onClose}>Cancel</Button>
    <Button variant="primary">Add</Button>
  </ModalFooter>
</Modal>
```

**`web/components/ui/PageWrapper.tsx`**
- Spec: keep breadcrumbs consistent; add optional `subtitle` for long-form pages.
- Example usage:
```tsx
<PageWrapper maxWidth="default" breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Guide' }]}>
  <PageHeader title="Guide" description="Guided learning flows" />
  {children}
</PageWrapper>
```

**`web/components/ui/Toast.tsx`**
- Spec: unify colors with `success/warning/error/info` tokens and allow inline action.
- Example usage:
```tsx
const toast = useToast()
toast.success('Saved notebook', 'Notebook')
```

**`web/components/ui/index.ts`**
- Spec: export all primitives to avoid deep imports in pages.

### 4.2 Shared components (`web/components/`)

**`web/components/ActivityDetail.tsx`**
- Spec: replace custom overlay with `Modal` to unify focus trapping and backdrop.
- Add a skeleton for activity load.

**`web/components/AddToNotebookModal.tsx`**
- Spec: migrate to `Modal` + `Input` + `Button` variants; unify colors with tokens.
- Add empty state when no notebooks found.

**`web/components/ChatSessionDetail.tsx`**
- Spec: use `Card` for message grouping; align message bubbles with `Card` surfaces.
- Include loading skeleton while fetching session.

**`web/components/CoMarkerEditor.tsx`**
- Spec: standardize toolbar buttons using `Button` with `size="sm"` and icon-only.
- Consolidate network status UI with `SystemStatus` styles.

**`web/components/CoWriterEditor.tsx`**
- Spec: align editor panels with `Card` variants; reuse `Modal` for history/narration.

**`web/components/Mermaid.tsx`**
- Spec: align theme variables with app tokens; add a loading placeholder wrapper.

**`web/components/NotebookImportModal.tsx`**
- Spec: migrate to `Modal` and use consistent list rows with `Card`.

**`web/components/Sidebar.tsx`**
- Spec: adopt `Card` and `Button` variants for nav items; add slim active indicator.

**`web/components/SystemStatus.tsx`**
- Spec: normalize indicator pills with `Card` and `Badge` (if added).

**`web/components/ThemeScript.tsx`**
- Spec: ensure consistent theme initialization; add `data-theme` to root if missing.

**`web/components/knowledge/VersionsModal.tsx`**
- Spec: refactor to use `Modal` and `Input` for search/version filters.

**`web/components/question/ActiveQuestionDetail.tsx`**
- Spec: replace custom panels with `Card` and `PageWrapper` in dashboards.

**`web/components/question/QuestionDashboard.tsx`**
- Spec: align progress stages with consistent status badges and step indicators.

**`web/components/question/QuestionTaskGrid.tsx`**
- Spec: use `Card` variant and `Button` for clickable rows.

**`web/components/research/ActiveTaskDetail.tsx`**
- Spec: update cards and tag colors to use semantic tokens.

**`web/components/research/ResearchDashboard.tsx`**
- Spec: normalize tabs and stage timeline with `Button` and `Card` components.

**`web/components/research/TaskGrid.tsx`**
- Spec: consistent grid card padding + empty state via `LoadingState` skeleton.

---

## 5. Page-by-Page Implementation Roadmap

Each page includes key goals, modernization steps, and a code example that demonstrates the intended UI structure. All paths are exact.

### 5.1 `web/app/page.tsx` (Home/Dashboard)
- Goals: refine hero, starter cards, and module grid to match design system spacing and typographic hierarchy.
- Steps:
  1. Convert hero and module rows to `Card` variants (`glass` for hero, `default` for modules).
  2. Standardize input and send button layout with `Input` and `Button`.
  3. Replace ad-hoc empty states with `LoadingState`/`Toast` for message load.
- Example:
```tsx
<Card variant="glass" className="p-6">
  <div className="space-y-3">
    <h2 className="text-2xl font-semibold text-text-primary">Welcome back</h2>
    <p className="text-text-secondary">Pick a module to start or ask a question.</p>
    <div className="flex gap-2">
      <Input placeholder="Ask praDeep" className="flex-1" />
      <Button variant="primary" iconRight={<ArrowRight className="h-4 w-4" />}>Send</Button>
    </div>
  </div>
</Card>
```

### 5.2 `web/app/analytics/page.tsx`
- Goals: clarify KPI cards, timeline charts, and segmented control styles.
- Steps:
  1. Normalize segmented control with `Button` group styling.
  2. Use `Card` grid for summary tiles and topic insights.
  3. Add empty states for no analytics data.
- Example:
```tsx
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <Card variant="default">
    <CardHeader title="Total Sessions" />
    <CardBody className="text-2xl font-semibold">{summary.total_activities}</CardBody>
  </Card>
</div>
```

### 5.3 `web/app/co_writer/page.tsx`
- Goals: unify toolbar buttons, editor panes, and preview cards.
- Steps:
  1. Wrap editor/preview columns in `Card` surfaces.
  2. Replace toolbar icon buttons with `Button size="sm"`.
  3. Use `Modal` for history/import dialogs.
- Example:
```tsx
<div className="grid gap-4 lg:grid-cols-2">
  <Card variant="default">
    <CardHeader title="Write" />
    <CardBody>{/* editor */}</CardBody>
  </Card>
  <Card variant="glass">
    <CardHeader title="Preview" />
    <CardBody>{/* markdown */}</CardBody>
  </Card>
</div>
```

### 5.4 `web/app/docs/[[...slug]]/page.tsx`
- Goals: improve docs navigation, TOC readability, and search modal polish.
- Steps:
  1. Use `Card` for nav list sections and TOC blocks.
  2. Replace custom search overlay with `Modal`.
  3. Normalize heading styles and scroll-to-top button.
- Example:
```tsx
<Card variant="glass" className="sticky top-4">
  <CardHeader title="On This Page" />
  <CardBody>{toc}</CardBody>
</Card>
```

### 5.5 `web/app/guide/page.tsx`
- Goals: align guided learning flow with unified progress indicators and cards.
- Steps:
  1. Standardize stepper cards with `Card` + badges.
  2. Ensure markdown viewer uses consistent `Card` shell.
  3. Add `LoadingState` for session initialization.
- Example:
```tsx
<Card variant="default">
  <CardHeader title="Learning Session" description="Follow the guided steps" />
  <CardBody>{/* markdown */}</CardBody>
</Card>
```

### 5.6 `web/app/history/page.tsx`
- Goals: refine timeline layout, filters, and detail modals.
- Steps:
  1. Convert filter pills to `Button` variants.
  2. Use `Card` for timeline groups.
  3. Replace custom detail overlays with `Modal` component.
- Example:
```tsx
<div className="flex gap-2">
  {FILTER_OPTIONS.map(filter => (
    <Button key={filter.value} variant={active === filter.value ? 'primary' : 'ghost'}>
      {filter.labelKey}
    </Button>
  ))}
</div>
```

### 5.7 `web/app/ideagen/page.tsx`
- Goals: unify notebook selection panels and progress indicators.
- Steps:
  1. Wrap notebook lists in `Card` with `LoadingState` skeletons.
  2. Use `Modal` for sources panel.
  3. Standardize progress and CTA buttons.
- Example:
```tsx
<Card variant="default">
  <CardHeader title="Notebook Sources" description="Select records to ground ideas" />
  <CardBody>{/* notebook list */}</CardBody>
</Card>
```

### 5.8 `web/app/knowledge/page.tsx`
- Goals: standardize knowledge base cards and upload flows.
- Steps:
  1. Replace upload panels with `Card` and `MediaUpload`.
  2. Use `Modal` for versions view.
  3. Normalize list empty and error states.
- Example:
```tsx
<Card variant="glass">
  <CardHeader title="Upload Sources" description="PDF, markdown, or images" />
  <CardBody>
    <MediaUpload media={media} onMediaChange={setMedia} />
  </CardBody>
</Card>
```

### 5.9 `web/app/memory/page.tsx`
- Goals: ensure memory entries and clusters use consistent cards and badges.
- Steps:
  1. Convert entry cards to `Card variant="default"`.
  2. Standardize filters and tag chips.
  3. Add `LoadingState` for fetch and search.
- Example:
```tsx
<Card variant="default" className="space-y-2">
  <div className="text-sm font-medium">Long-term memory</div>
  <div className="text-xs text-text-muted">Last updated 2 hours ago</div>
</Card>
```

### 5.10 `web/app/metrics/page.tsx`
- Goals: align metric dashboards and trend cards.
- Steps:
  1. Use `Card` grid for KPIs and insights.
  2. Standardize value formatting and badges.
  3. Add `LoadingState` for chart placeholders.
- Example:
```tsx
<Card variant="elevated">
  <CardHeader title="Engagement" description="Last 30 days" />
  <CardBody className="text-3xl font-semibold">82%</CardBody>
</Card>
```

### 5.11 `web/app/notebook/page.tsx`
- Goals: unify notebook grid, record details, and import/export controls.
- Steps:
  1. Convert notebook grid cards to `Card interactive`.
  2. Use `Modal` for record detail editing.
  3. Standardize search and filter row.
- Example:
```tsx
<Card interactive variant="glass">
  <CardHeader title={notebook.name} description={`${notebook.record_count} records`} />
  <CardBody>{notebook.description}</CardBody>
</Card>
```

### 5.12 `web/app/question/page.tsx`
- Goals: unify question workflow dashboard and task grid visuals.
- Steps:
  1. Wrap dashboard in `PageWrapper`/`PageHeader` and use `Card` sections.
  2. Replace task grid cards with `Card` variants.
  3. Add consistent states for `config`, `generating`, and `result`.
- Example:
```tsx
<Card variant="default">
  <CardHeader title="Question Tasks" description="Track generation progress" />
  <CardBody>
    <QuestionTaskGrid ... />
  </CardBody>
</Card>
```

### 5.13 `web/app/recommendation/page.tsx`
- Goals: improve filters, result cards, and source badges.
- Steps:
  1. Standardize filter row with `Input` and `Button`.
  2. Ensure result list uses `Card` with consistent metadata rows.
  3. Add empty state when no papers returned.
- Example:
```tsx
<Card variant="default">
  <CardHeader title={paper.title} description={formatAuthors(paper.authors)} />
  <CardBody className="text-sm text-text-secondary">{paper.abstract}</CardBody>
</Card>
```

### 5.14 `web/app/research/page.tsx`
- Goals: unify dashboard view, status timeline, and report panels.
- Steps:
  1. Ensure `ResearchDashboard` uses `Card` for all sections.
  2. Standardize config panel with `Input` and `Button` variants.
  3. Provide consistent export button placement.
- Example:
```tsx
<Card variant="glass">
  <CardHeader title="Research Report" />
  <CardBody>{reportMarkdown}</CardBody>
</Card>
```

### 5.15 `web/app/settings/page.tsx`
- Goals: align settings sections, toggles, and modals.
- Steps:
  1. Use `Card` sections for UI settings, system config, env variables.
  2. Replace custom row toggles with unified `Button` + `Input` patterns.
  3. Add `LoadingState` for config fetch.
- Example:
```tsx
<Card variant="default">
  <CardHeader title="Appearance" description="Theme and language" />
  <CardBody className="grid gap-3 sm:grid-cols-2">
    <Button variant="secondary">Light</Button>
    <Button variant="secondary">Dark</Button>
  </CardBody>
</Card>
```

### 5.16 `web/app/solver/page.tsx`
- Goals: unify solver workflow, agent status, and artifact viewers.
- Steps:
  1. Wrap agent status in `Card` with semantic badges.
  2. Standardize media upload panels with `MediaUpload` and tokens.
  3. Align result sections with `Card` and `LoadingState`.
- Example:
```tsx
<Card variant="default">
  <CardHeader title="Solver Status" />
  <CardBody>{/* agent status list */}</CardBody>
</Card>
```

### 5.17 `web/app/workflow/page.tsx`
- Goals: unify timeline node cards and navigation experience.
- Steps:
  1. Replace custom node containers with `Card` and `Button`.
  2. Use standardized icon container styling.
  3. Ensure keyboard focus ring on each timeline link.
- Example:
```tsx
<Card variant="glass" interactive>
  <div className="flex items-center justify-between">
    <div>
      <div className="text-xs text-text-muted">Step 2</div>
      <div className="text-sm font-semibold">Knowledge</div>
    </div>
    <ArrowRight className="h-4 w-4 text-text-muted" />
  </div>
</Card>
```

---

## 6. Motion, Visualization, and Content Standards

**Motion system:**
- Always pair `useReducedMotion()` with animated components in pages and shared components.
- Use a consistent set of animation variants for cards and list items.

**Motion snippet:**
```tsx
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
}
```

**Markdown rendering:**
- Use `ReactMarkdown` with `remarkMath`/`rehypeKatex` consistently.
- Ensure `processLatexContent` is applied to avoid layout shifts.

**Charts and diagrams:**
- Use `Mermaid` for diagrammatic flows with theme variables aligned to tokens.
- Use consistent chart container sizes and loading placeholders.

---

## 7. Accessibility, Performance, and QA Gates

**Accessibility requirements:**
- All icon-only buttons must include `aria-label`.
- `Modal` should trap focus and restore on close (already supported).
- Ensure keyboard navigation for timeline/task grids (use `button` or `Link`).

**Accessibility example:**
```tsx
<Button variant="ghost" aria-label="Close" onClick={onClose}>
  <X className="h-4 w-4" />
</Button>
```

**Performance improvements:**
- Defer heavy markdown rendering with virtualization where lists are long.
- Use `Suspense` for data-driven panels and lazy-load non-critical modals.

**QA gates and verification commands:**
```bash
npm run lint
npm run build
npx tsc -p web/tsconfig.json --noEmit
```

---

## 8. Delivery Plan, Milestones, and Risk Controls

**Phase 1: Foundation (UI primitives + layout standardization)**
- Update `web/components/ui/*` and ensure every page uses `PageWrapper`/`PageHeader`.
- Verify with visual passes on `page.tsx`, `workflow`, and `analytics`.

**Phase 2: Shared components alignment**
- Migrate all modals and overlays to `Modal`.
- Align `ActivityDetail`, `ChatSessionDetail`, `AddToNotebookModal`, `NotebookImportModal`.

**Phase 3: Page-by-page visual upgrades**
- Apply Section 5 steps to each page in this order: Home, Analytics, Workflow, Research, Question, Ideagen, Knowledge, Settings, Notebook, History, Recommendation, Solver, Guide, Docs, Memory, Metrics, Co-writer.

**Phase 4: QA and polish**
- Validate reduced motion paths.
- Run QA gates and fix regressions.

**Risk controls:**
- If a page depends on a legacy custom modal, migrate to `Modal` before restyling.
- If a page has complex editor flows, isolate UI changes to wrapper components first.

**Definition of done:**
- All 17 pages and all listed components conform to tokens and component variants.
- UI changes pass build + lint + type checks.
- No accessibility regressions reported in keyboard walkthrough.
