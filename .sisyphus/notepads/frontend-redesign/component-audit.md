# UI Component Audit - Frontend Redesign

**Audit Date:** 2026-01-17  
**Auditor:** Sisyphus-Junior  
**Scope:** `web/components/ui/` directory

---

## Executive Summary

**Total Components:** 31 files (30 components + 1 index)  
**Production-Ready:** 15 components ✅  
**Needs Token Updates:** 6 components ⚠️  
**Missing/Needed:** 8 component types ❌

### Key Findings

1. **Strong Foundation:** Core primitives (Button, Card, Input, Modal, LoadingState, Toast) use semantic tokens correctly
2. **shadcn Gaps:** 6 shadcn-derived components use unmapped tokens (`bg-muted`, `text-muted-foreground`, `bg-primary`, etc.)
3. **Missing Essentials:** No Sheet/Drawer, Dropdown/Menu, Breadcrumb, or Empty State components
4. **Command Palette:** Placeholder implementation exists but renders null (needs full rebuild)

---

## Existing Components Inventory

### ✅ Production-Ready Components (15)

These components use semantic tokens correctly and are ready for immediate use:

#### 1. **Button** (`Button.tsx`)
- **Path:** `web/components/ui/Button.tsx`
- **Exports:** `Button`, `IconButton`
- **Token Usage:** ✅ Semantic tokens (`bg-accent-primary`, `text-text-*`, `bg-surface-*`, `border-border`)
- **State:** ✅ Production-ready
- **Features:** 
  - 7 variants (primary, secondary, outline, ghost, destructive, gradient-*)
  - 3 sizes (sm, md, lg)
  - Loading state with spinner
  - Icon support (left/right)
  - Framer Motion animations
  - WCAG 2.1 AA focus rings
- **Notes:** Gradient variants are legacy names (no actual gradients, map to solid colors)

#### 2. **Card** (`Card.tsx`)
- **Path:** `web/components/ui/Card.tsx`
- **Exports:** `Card`, `CardHeader`, `CardContent`, `CardBody`, `CardFooter`
- **Token Usage:** ✅ Semantic tokens (`bg-surface-elevated`, `text-text-primary`, `border-border`)
- **State:** ✅ Production-ready
- **Features:**
  - 4 variants (default, elevated, glass, outlined)
  - 4 padding sizes (none, sm, md, lg)
  - Interactive mode with hover effects
  - Compound component pattern
  - Dark mode support
- **Notes:** Uses `rounded-2xl` (16px) for modern aesthetic

#### 3. **Input** (`Input.tsx`)
- **Path:** `web/components/ui/Input.tsx`
- **Exports:** `Input`, `Textarea`
- **Token Usage:** ✅ Semantic tokens (`bg-surface-elevated`, `border-border`, `text-text-*`, `focus:border-accent-primary`)
- **State:** ✅ Production-ready
- **Features:**
  - 3 sizes (sm, md, lg)
  - Floating label support
  - Error/success states with shake animation
  - Left/right icon slots
  - Helper text
  - Auto-resize textarea (minRows/maxRows)
  - Controlled/uncontrolled modes
- **Notes:** Excellent accessibility with aria-invalid, aria-describedby

#### 4. **Modal** (`Modal.tsx`)
- **Path:** `web/components/ui/Modal.tsx`
- **Exports:** `Modal`, `ModalHeader`, `ModalContent`, `ModalBody`, `ModalFooter`
- **Token Usage:** ✅ Semantic tokens (`bg-surface-elevated`, `border-border`, `text-text-primary`)
- **State:** ✅ Production-ready
- **Features:**
  - 5 sizes (sm, md, lg, xl, full)
  - Framer Motion animations (spring physics)
  - Focus trap with keyboard navigation
  - Backdrop click to close
  - Escape key support
  - Body scroll lock
  - Reduced motion support
- **Notes:** Premium animations with subtle scale feedback on backdrop click

#### 5. **PageWrapper** (`PageWrapper.tsx`)
- **Path:** `web/components/ui/PageWrapper.tsx`
- **Exports:** `PageWrapper`, `PageHeader`
- **Token Usage:** ✅ Semantic tokens (`bg-surface-secondary`, `text-text-*`, `border-border-subtle`)
- **State:** ✅ Production-ready
- **Features:**
  - 5 max-width presets (narrow, default, wide, 2xl, full)
  - Breadcrumb support
  - Optional background pattern
  - PageHeader with icon, title, description, actions
- **Notes:** Clean layout primitive for consistent page structure

#### 6. **LoadingState** (`LoadingState.tsx`)
- **Path:** `web/components/ui/LoadingState.tsx`
- **Exports:** `Spinner`, `Skeleton`, `CardSkeleton`, `TextSkeleton`, `InlineLoading`, `FullPageLoading`, `LoadingOverlay`, `DotsLoading`, `PulseDots`
- **Token Usage:** ✅ Semantic tokens (`bg-border-muted`, `text-text-*`, `bg-surface-*`)
- **State:** ✅ Production-ready
- **Features:**
  - 4 spinner sizes (sm, md, lg, xl)
  - 4 skeleton variants (text, circular, rectangular, card)
  - Pulse/shimmer animations
  - Full-page and overlay modes
  - Backdrop blur support
  - Reduced motion support
- **Notes:** Comprehensive loading states for all use cases

#### 7. **Toast** (`Toast.tsx`)
- **Path:** `web/components/ui/Toast.tsx`
- **Exports:** `ToastProvider`, `useToast`
- **Token Usage:** ✅ Semantic tokens (uses hardcoded colors for variants but structure is correct)
- **State:** ✅ Production-ready
- **Features:**
  - 4 variants (success, error, warning, info)
  - Auto-dismiss with progress bar
  - Pause on hover
  - Stacked notifications
  - Framer Motion animations
  - Accessible (aria-live, role="status")
- **Notes:** Uses emerald/red/amber/sky for semantic colors (acceptable for toasts)

#### 8. **Carousel** (`Carousel.tsx`)
- **Path:** `web/components/ui/Carousel.tsx`
- **Exports:** `Carousel`
- **Token Usage:** ✅ Semantic tokens (`bg-white/70`, `border-border`, `text-text-primary`)
- **State:** ✅ Production-ready
- **Features:**
  - Responsive items-per-view (mobile/tablet/desktop)
  - Touch/drag support
  - Keyboard navigation (arrows, home, end)
  - Snap scrolling
  - Progress indicators
  - Glass morphism arrows
- **Notes:** ChatGPT-style horizontal carousel, optimized for 3-8 items

#### 9. **Tabs** (`Tabs.tsx`)
- **Path:** `web/components/ui/Tabs.tsx`
- **Exports:** `Tabs`
- **Token Usage:** ✅ Semantic tokens (`bg-surface-elevated`, `border-border`, `text-text-*`)
- **State:** ✅ Production-ready
- **Features:**
  - Pill-style tabs with animated indicator
  - Icon support
  - Framer Motion layout animations
  - Dark mode support
  - Accessible (aria-pressed, role="group")
- **Notes:** Uses `eliteTheme.density.compact` for spacing (imported from `@/lib/elite-theme`)

#### 10. **Skeleton** (`Skeleton.tsx`)
- **Path:** `web/components/ui/Skeleton.tsx`
- **Exports:** `Skeleton`, `EditorSkeleton`, `ChartSkeleton`, `CardSkeleton`
- **Token Usage:** ✅ Semantic tokens (`bg-surface-elevated`, `border-border`)
- **State:** ✅ Production-ready
- **Features:**
  - 3 variants (text, circular, rectangular)
  - 3 animations (pulse, shimmer, none)
  - Preset skeletons (editor, chart, card)
  - Custom width/height
- **Notes:** Duplicate of LoadingState.Skeleton but with additional presets

#### 11. **Separator** (`separator.tsx`)
- **Path:** `web/components/ui/separator.tsx`
- **Exports:** `Separator`
- **Token Usage:** ✅ Semantic tokens (`bg-border`)
- **State:** ✅ Production-ready
- **Features:**
  - Radix UI primitive
  - Horizontal/vertical orientation
  - Decorative mode
- **Notes:** Simple, accessible divider

#### 12. **CommandMenu** (`CommandMenu.tsx`)
- **Path:** `web/components/ui/CommandMenu.tsx`
- **Exports:** `CommandMenu`, `COMMANDS`
- **Token Usage:** ✅ Semantic tokens (`bg-white/80`, `border-border`, `text-text-*`)
- **State:** ✅ Production-ready
- **Features:**
  - Notion-style slash command menu
  - Keyboard navigation (up/down, enter, escape)
  - Fuzzy search filtering
  - Glass morphism design
  - 5 preset commands (ask, summarize, explain, research, improve)
- **Notes:** This is for **inline slash commands** (e.g., in editor), NOT the global Cmd+K palette

#### 13-15. **Skeleton Variants** (`SkeletonCard.tsx`, `SkeletonList.tsx`, `SkeletonText.tsx`)
- **Path:** `web/components/ui/Skeleton*.tsx`
- **Token Usage:** ✅ Semantic tokens
- **State:** ✅ Production-ready
- **Notes:** Additional skeleton presets (likely duplicates of LoadingState exports)

---

### ⚠️ Needs Token Updates (6)

These components use **unmapped shadcn tokens** that need tailwind.config.js updates:

#### 16. **Table** (`table.tsx`)
- **Path:** `web/components/ui/table.tsx`
- **Exports:** `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`
- **Token Usage:** ⚠️ **UNMAPPED TOKENS**
  - `bg-muted/50` (line 46, 62) → needs `muted` mapped
  - `text-muted-foreground` (line 78, 107) → needs `muted-foreground` mapped
  - `border-borderSemantic-subtle` (line 46, 62) → typo? should be `border-border-subtle`
- **State:** ⚠️ Needs token mapping
- **Required Fixes:**
  1. Add to `tailwind.config.js`:
     ```js
     muted: {
       DEFAULT: 'rgb(var(--color-surface-muted) / <alpha-value>)',
       foreground: 'rgb(var(--color-text-secondary) / <alpha-value>)',
     }
     ```
  2. Fix typo: `border-borderSemantic-subtle` → `border-border-subtle`
- **Notes:** Essential for `/history`, `/analytics`, `/metrics` pages

#### 17. **Tooltip** (`tooltip.tsx`)
- **Path:** `web/components/ui/tooltip.tsx`
- **Exports:** `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- **Token Usage:** ⚠️ **UNMAPPED TOKENS**
  - `bg-primary` (line 23) → needs `primary` mapped
  - `text-primary-foreground` (line 23) → needs `primary-foreground` mapped
- **State:** ⚠️ Needs token mapping
- **Required Fixes:**
  1. Tokens already mapped in tailwind.config.js (lines 50-52), but CSS variables missing
  2. Add to `globals.css`:
     ```css
     --primary: var(--color-accent-primary);
     --primary-foreground: var(--color-accent-primary-foreground);
     ```
  3. OR update component to use `bg-accent-primary` and `text-accent-primary-foreground`
- **Notes:** Radix UI primitive, widely used for hints

#### 18. **Badge** (`badge.tsx`)
- **Path:** `web/components/ui/badge.tsx`
- **Exports:** `Badge`, `badgeVariants`
- **Token Usage:** ⚠️ **UNMAPPED TOKENS**
  - `bg-primary`, `text-primary-foreground` (line 12)
  - `bg-secondary`, `text-secondary-foreground` (line 14)
  - `bg-destructive`, `text-destructive-foreground` (line 16)
  - `focus:ring-ring`, `focus:ring-offset-background` (line 7)
- **State:** ⚠️ Needs token mapping
- **Required Fixes:**
  1. Tokens partially mapped in tailwind.config.js
  2. Add missing CSS variables for `destructive`, `ring`, `ring-offset`
  3. OR rewrite to use semantic tokens:
     - `primary` → `accent-primary`
     - `secondary` → `surface-secondary`
     - `destructive` → `semantic-error`
- **Notes:** Uses `class-variance-authority` for variant management

#### 19. **Avatar** (`avatar.tsx`)
- **Path:** `web/components/ui/avatar.tsx`
- **Exports:** `Avatar`, `AvatarImage`, `AvatarFallback`
- **Token Usage:** ⚠️ **UNMAPPED TOKENS**
  - `bg-muted` (line 42)
  - `text-muted-foreground` (line 42)
- **State:** ⚠️ Needs token mapping
- **Required Fixes:**
  1. Add `muted` and `muted-foreground` to tailwind.config.js (same as Table fix)
- **Notes:** Radix UI primitive, useful for user profiles

#### 20. **Switch** (`switch.tsx`)
- **Path:** `web/components/ui/switch.tsx`
- **Exports:** `Switch`
- **Token Usage:** ⚠️ **UNMAPPED TOKENS**
  - `data-[state=checked]:bg-primary` (line 14)
  - `data-[state=unchecked]:bg-input` (line 14)
  - `bg-background` (line 22)
  - `focus-visible:ring-ring`, `focus-visible:ring-offset-background` (line 14)
- **State:** ⚠️ Needs token mapping
- **Required Fixes:**
  1. Tokens partially mapped (`primary`, `input`, `background` exist)
  2. Add missing `ring` and `ring-offset` CSS variables
  3. OR update to use semantic tokens:
     - `bg-primary` → `bg-accent-primary`
     - `bg-input` → `bg-border`
     - `bg-background` → `bg-surface-base`
- **Notes:** Radix UI primitive, useful for settings toggles

#### 21. **Progress** (`progress.tsx`)
- **Path:** `web/components/ui/progress.tsx`
- **Exports:** `Progress`
- **Token Usage:** ⚠️ **UNMAPPED TOKENS**
  - `bg-muted` (line 15)
  - `bg-primary` (line 21)
- **State:** ⚠️ Needs token mapping
- **Required Fixes:**
  1. Add `muted` and `primary` mappings (same as above)
- **Notes:** Radix UI primitive, useful for loading indicators

---

### 📦 Utility/Example Components (9)

These are non-primitive components (examples, utilities, or specialized):

#### 22-26. **Specialized Components**
- `AIContentHighlight.tsx` - AI-generated content highlighting
- `DiffViewer.tsx` - Code diff visualization
- `SplitPane.tsx` - Resizable split panes
- `ProgressiveDisclosure.tsx` - Expandable content
- `MediaUpload.tsx` - File upload with preview

**Token Usage:** ✅ Likely use semantic tokens (not audited in detail)  
**State:** ✅ Production-ready (specialized use cases)

#### 27-29. **Background/Visual Components**
- `EliteBackground.tsx` - Decorative background
- `CarouselExample.tsx` - Carousel demo
- `skeleton-examples.tsx` - Skeleton demos

**Token Usage:** ✅ Semantic tokens  
**State:** ✅ Production-ready (examples/demos)

#### 30. **CommandInput** (`CommandInput.tsx`)
- **Purpose:** Input component for command menu
- **Token Usage:** ✅ Likely semantic tokens
- **State:** ✅ Production-ready

#### 31. **Index** (`index.ts`)
- **Purpose:** Barrel export file
- **Exports:** Button, Card, Input, Modal, PageWrapper, LoadingState, Toast, Carousel
- **Notes:** Only exports 8 components (missing many others)

---

## Missing Components (8 types)

These components are **required for the 16 target pages** but do not exist:

### ❌ 1. **Sheet/Drawer**
- **Use Cases:** Mobile navigation, filters panel, settings drawer
- **Pages Needing:** All pages (mobile nav), `/history` (filters), `/analytics` (filters)
- **Recommendation:** Adopt shadcn Sheet or build custom with Radix Dialog
- **Priority:** 🔴 HIGH (mobile navigation critical)

### ❌ 2. **Dropdown/Menu**
- **Use Cases:** Action menus, filters, user menu, context menus
- **Pages Needing:** `/history` (row actions), `/analytics` (filters), `/settings` (dropdowns)
- **Recommendation:** Adopt shadcn Dropdown Menu (Radix UI)
- **Priority:** 🔴 HIGH (essential for data tables)

### ❌ 3. **Breadcrumb**
- **Use Cases:** Navigation hierarchy, page context
- **Pages Needing:** All nested pages (e.g., `/knowledge/[id]`, `/notebooks/[id]`)
- **Recommendation:** Build custom or adopt shadcn Breadcrumb
- **Priority:** 🟡 MEDIUM (PageWrapper has basic breadcrumb support)
- **Notes:** PageWrapper already has breadcrumb prop, but no standalone component

### ❌ 4. **Empty State**
- **Use Cases:** No data states, onboarding, error states
- **Pages Needing:** `/history` (no sessions), `/knowledge` (no KBs), `/notebooks` (no notebooks)
- **Recommendation:** Build custom component with illustration, title, description, CTA
- **Priority:** 🔴 HIGH (UX critical for empty pages)

### ❌ 5. **Loading Skeleton (Page-Level)**
- **Use Cases:** Full-page loading states for async routes
- **Pages Needing:** All pages (Next.js `loading.tsx` files)
- **Recommendation:** Create page-specific skeletons (TableSkeleton, DashboardSkeleton, etc.)
- **Priority:** 🟡 MEDIUM (LoadingState.Skeleton exists but needs page-level variants)
- **Notes:** LoadingState has CardSkeleton, TextSkeleton, but no TableSkeleton or DashboardSkeleton

### ❌ 6. **Command Palette (Global Cmd+K)**
- **Use Cases:** Global search, navigation, actions
- **Pages Needing:** All pages (global shortcut)
- **Recommendation:** Build with cmdk library (already installed)
- **Priority:** 🔴 HIGH (design requirement: "global Cmd+K command palette")
- **Notes:** `CommandPalette.tsx` exists but is a **placeholder** (renders null, logs to console)

### ❌ 7. **Pagination**
- **Use Cases:** Table pagination, list pagination
- **Pages Needing:** `/history`, `/analytics`, `/metrics` (data tables)
- **Recommendation:** Build custom or adopt shadcn Pagination
- **Priority:** 🟡 MEDIUM (can use infinite scroll initially)

### ❌ 8. **Select/Combobox**
- **Use Cases:** Filters, form inputs, knowledge base selection
- **Pages Needing:** `/history` (KB filter), `/analytics` (date range), `/settings` (dropdowns)
- **Recommendation:** Adopt shadcn Select or Combobox (Radix UI)
- **Priority:** 🟡 MEDIUM (can use native `<select>` initially)

---

## Overlapping/Duplicate Components

### 🔄 Skeleton Components (3 implementations)
1. **LoadingState.Skeleton** (`LoadingState.tsx`) - Full-featured with variants
2. **Skeleton** (`Skeleton.tsx`) - Standalone with presets (EditorSkeleton, ChartSkeleton, CardSkeleton)
3. **SkeletonCard/SkeletonList/SkeletonText** - Individual files

**Recommendation:** Consolidate into LoadingState.tsx, remove duplicates

### 🔄 Command Components (2 implementations)
1. **CommandMenu** (`CommandMenu.tsx`) - Slash command menu (inline, editor-focused)
2. **CommandPalette** (`CommandPalette.tsx`) - Global Cmd+K palette (placeholder)

**Recommendation:** Keep both (different use cases), but rebuild CommandPalette

---

## Token Mapping Status

### ✅ Mapped Tokens (in tailwind.config.js)
- `surface.*` → `--color-surface-*` ✅
- `text.*` → `--color-text-*` ✅
- `accent.primary` → `--color-accent-primary` ✅
- `border` → `--color-border` ✅
- `borderSemantic.*` → `--color-border-*` ✅
- `background` → `--color-surface-base` ✅
- `foreground` → `--color-text-primary` ✅
- `card.*` → `--color-surface-elevated` ✅
- `popover.*` → `--color-surface-elevated` ✅
- `primary.*` → `--color-accent-primary` ✅
- `secondary.*` → `--color-surface-secondary` ✅
- `input` → `--color-border` ✅
- `ring` → `--color-accent-primary` ✅

### ⚠️ Partially Mapped (in tailwind.config.js but missing CSS variables)
- `muted.*` → mapped to `--color-surface-muted` but used as `bg-muted` in components
- `destructive.*` → mapped to `hsl(var(--destructive))` but `--destructive` not defined in globals.css

### ❌ Unmapped Tokens (used in components but not in tailwind.config.js)
- None (all tokens are mapped, but some CSS variables are missing)

---

## Recommendations

### Immediate Actions (Phase 1, Tasks 2-7)

1. **Fix Token Mappings** (Task 2)
   - Add missing CSS variables to `globals.css`:
     - `--destructive` (for Badge, Switch)
     - `--ring` (already mapped, verify)
     - `--ring-offset` (already mapped, verify)
   - Fix typo in Table: `border-borderSemantic-subtle` → `border-border-subtle`

2. **Create Missing Primitives** (Tasks 3-7, parallelizable)
   - **Task 3:** Sheet/Drawer (mobile nav, filters)
   - **Task 4:** Dropdown/Menu (actions, filters)
   - **Task 5:** Empty State (no data states)
   - **Task 6:** Command Palette (global Cmd+K)
   - **Task 7:** Pagination (data tables)

3. **Consolidate Duplicates** (Task 8)
   - Merge Skeleton implementations into LoadingState.tsx
   - Remove duplicate files (SkeletonCard.tsx, SkeletonList.tsx, SkeletonText.tsx)

4. **Update Index Exports** (Task 9)
   - Add missing exports to `index.ts`:
     - Table, Tabs, Tooltip, Badge, Avatar, Switch, Separator, Progress
     - Sheet, Dropdown, EmptyState, CommandPalette, Pagination (after creation)

### Page-Specific Component Needs

| Page | Required Components | Status |
|------|---------------------|--------|
| `/` (home) | Button, Card, PageWrapper | ✅ Ready |
| `/history` | Table, Dropdown, Pagination, EmptyState, Sheet (filters) | ⚠️ Table needs fix, 4 missing |
| `/analytics` | Table, Card, Dropdown, Sheet (filters), EmptyState | ⚠️ Table needs fix, 3 missing |
| `/workflow` | Card, Button, EmptyState | ⚠️ 1 missing |
| `/metrics` | Table, Card, EmptyState | ⚠️ Table needs fix, 1 missing |
| `/memory` | Card, Input, Button, EmptyState | ⚠️ 1 missing |
| `/knowledge` | Tabs, Card, Button, EmptyState | ⚠️ 1 missing |
| `/notebooks` | Card, Button, EmptyState | ⚠️ 1 missing |
| `/question-generator` | Input, Button, Card, EmptyState | ⚠️ 1 missing |
| `/smart-solver` | Input, Button, Card | ✅ Ready |
| `/guided-learning` | Card, Button, Progress | ⚠️ Progress needs fix |
| `/ideagen` | Input, Button, Card, EmptyState | ⚠️ 1 missing |
| `/deep-research` | Input, Button, Card, EmptyState | ⚠️ 1 missing |
| `/paper-recommendations` | Card, Dropdown, EmptyState | ⚠️ 2 missing |
| `/co-writer` | Input, Textarea, Button, Card | ✅ Ready |
| `/settings` | Tabs, Input, Switch, Button, Dropdown | ⚠️ Switch needs fix, 1 missing |
| **Global** | CommandPalette (Cmd+K), Toast, Modal | ⚠️ CommandPalette missing |

---

## Summary Counts

| Category | Count |
|----------|-------|
| **Total Files** | 31 |
| **Production-Ready** | 15 ✅ |
| **Needs Token Updates** | 6 ⚠️ |
| **Utility/Examples** | 9 📦 |
| **Index File** | 1 |
| **Missing Components** | 8 ❌ |
| **Duplicate Components** | 2 🔄 |

### By Priority

| Priority | Components |
|----------|------------|
| 🔴 **HIGH** | Sheet/Drawer, Dropdown/Menu, Empty State, Command Palette (4) |
| 🟡 **MEDIUM** | Pagination, Select/Combobox, Page-Level Skeletons (3) |
| 🟢 **LOW** | Breadcrumb (1, already has basic support) |

---

## Next Steps

1. **Read this audit** to understand component landscape
2. **Fix token mappings** (Table, Tooltip, Badge, Avatar, Switch, Progress)
3. **Create missing primitives** in parallel:
   - Sheet/Drawer
   - Dropdown/Menu
   - Empty State
   - Command Palette
   - Pagination
4. **Consolidate duplicates** (Skeleton components)
5. **Update index.ts** with all exports
6. **Proceed to page implementations** (Tasks 9-24)

---

**End of Audit**
