# Frontend Redesign Work Plan

## Project Overview
Complete frontend redesign of the Next.js app at `/Users/kyin/Projects/praDeep/web` with Safety Orange accent (#C73000), Geist fonts, and "tasteful utilitarian x teenage engineer" aesthetic.

## Design System Foundation (COMPLETED)
- ✅ Safety Orange accent color: `#C73000` (HSL: 14 100% 39%)
- ✅ Geist Sans/Mono fonts configured
- ✅ Semantic token system in `globals.css`
- ✅ Dark mode support maintained
- ✅ Home page parallax wallpaper implemented
- ✅ Build passing

## Remaining Tasks

### Phase 1: Component Library Completion

- [x] **Task 1**: Audit existing UI components and identify gaps
  **Parallelizable**: NO (must complete before other tasks can reference findings)
  **Description**: Review `web/components/ui/` directory and create inventory of what exists vs what's needed for the 16 pages. Check for: Table/DataGrid, Tabs, Dropdown, Command palette styling, Breadcrumb, Sheet/Drawer, Tooltip, Empty states, Loading skeletons.
  **Expected Output**: Markdown file listing existing components, missing components, and components needing updates.

- [x] **Task 2**: Create Table/DataGrid component for analytics pages
  **Parallelizable**: YES (with Task 3, 4, 5, 6, 7)
  **Description**: Build a reusable Table component following the design system. Must support: sortable columns, row selection, pagination, loading states, empty states. Use semantic tokens for borders/backgrounds.
  **Expected Output**: `web/components/ui/Table.tsx` with full TypeScript types and example usage.

- [x] **Task 8**: Restyle Command Palette to match new design system
  **Parallelizable**: NO (depends on Task 1 findings)
  **Description**: Update the existing command palette (Cmd+K) to use semantic tokens, Safety Orange accents, and Geist fonts. Ensure dark mode works correctly.
  **Expected Output**: Updated command palette component with new styling.

### Phase 2: Page-by-Page Implementation

- [x] **Task 9**: Redesign `/history` page
  **Parallelizable**: YES (with Task 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement history page with Table component showing session history. Include filters, search, and pagination. Add empty state for no history.
  **Expected Output**: Updated `web/app/history/page.tsx` with full functionality.

- [x] **Task 10**: Redesign `/analytics` page
  **Parallelizable**: YES (with Task 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement analytics dashboard with charts, metrics cards, and data tables. Use consistent spacing and semantic tokens.
  **Expected Output**: Updated `web/app/analytics/page.tsx` with dashboard layout.

- [x] **Task 11**: Redesign `/workflow` page
  **Parallelizable**: YES (with Task 9, 10, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement workflow management page with visual workflow builder or list view. Include status indicators and action buttons.
  **Expected Output**: Updated `web/app/workflow/page.tsx` with workflow UI.

- [x] **Task 12**: Redesign `/metrics` page
  **Parallelizable**: YES (with Task 9, 10, 11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement metrics dashboard with KPI cards, trend charts, and comparison tables. Use Table component for detailed metrics.
  **Expected Output**: Updated `web/app/metrics/page.tsx` with metrics layout.

- [x] **Task 13**: Redesign `/memory` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement memory management page with searchable memory items, tags, and filters. Include add/edit/delete actions.
  **Expected Output**: Updated `web/app/memory/page.tsx` with memory UI.

- [x] **Task 14**: Redesign `/knowledge` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement knowledge base page with categorized content, search, and navigation. Use Tabs for different knowledge categories.
  **Expected Output**: Updated `web/app/knowledge/page.tsx` with knowledge UI.

- [x] **Task 15**: Redesign `/notebooks` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement notebooks page with grid/list view of notebooks, create/edit/delete actions, and search/filter.
  **Expected Output**: Updated `web/app/notebooks/page.tsx` with notebooks UI.

- [x] **Task 16**: Redesign `/question-generator` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement question generator interface with input form, generated questions list, and export options.
  **Expected Output**: Updated `web/app/question-generator/page.tsx` with generator UI.

- [x] **Task 17**: Redesign `/smart-solver` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 16, 18, 19, 20, 21, 22, 23, 24)
  **Description**: Implement smart solver interface with problem input, solution steps display, and history.
  **Expected Output**: Updated `web/app/smart-solver/page.tsx` with solver UI.

- [x] **Task 18**: Redesign `/guided-learning` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 24)
  **Description**: Implement guided learning interface with lesson navigation, progress tracking, and interactive content.
  **Expected Output**: Updated `web/app/guided-learning/page.tsx` with learning UI.

- [x] **Task 19**: Redesign `/ideagen` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24)
  **Description**: Implement idea generation interface with input form, generated ideas display, and refinement options.
  **Expected Output**: Updated `web/app/ideagen/page.tsx` with ideagen UI.

- [x] **Task 20**: Redesign `/deep-research` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 24)
  **Description**: Implement deep research interface with query input, research results, source citations, and export.
  **Expected Output**: Updated `web/app/deep-research/page.tsx` with research UI.

- [x] **Task 21**: Redesign `/paper-recommendations` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22, 23, 24)
  **Description**: Implement paper recommendations page with filterable paper list, preview cards, and save/bookmark actions.
  **Expected Output**: Updated `web/app/paper-recommendations/page.tsx` with papers UI.

- [x] **Task 22**: Redesign `/co-writer` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 23, 24)
  **Description**: Implement co-writer interface with editor, AI suggestions panel, and document management.
  **Expected Output**: Updated `web/app/co-writer/page.tsx` with co-writer UI.

- [x] **Task 23**: Redesign `/settings` page
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24)
  **Description**: Implement settings page with categorized settings using Tabs, form controls, and save/reset actions.
  **Expected Output**: Updated `web/app/settings/page.tsx` with settings UI.

- [x] **Task 24**: Review and polish home page (`/`)
  **Parallelizable**: YES (with Task 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23)
  **Description**: Review home page for visual consistency, ensure parallax wallpaper works, add any missing polish (animations, hover states, etc.).
  **Expected Output**: Polished `web/app/page.tsx` and `HomePageClient.tsx`.

### Phase 3: Quality Assurance

- [x] **Task 25**: Run full build and fix production issues
  **Parallelizable**: NO (must run after all page implementations)
  **Description**: Run `npm run build` in web directory and fix any production-only issues (dynamic class strings, missing imports, type errors).
  **Expected Output**: Clean build with zero errors.

- [x] **Task 26**: Test dark mode across all pages
  **Parallelizable**: NO (must run after Task 25)
  **Description**: Manually test dark mode toggle on all 16 pages, verify semantic tokens work correctly, check for any hardcoded colors.
  **Expected Output**: Dark mode working consistently across all pages.

- [x] **Task 27**: Test accessibility features
  **Parallelizable**: NO (must run after Task 25)
  **Description**: Test keyboard navigation, focus-visible rings, reduced-motion fallback, screen reader compatibility. Run automated accessibility audit.
  **Expected Output**: Accessibility report with any issues documented.

- [x] **Task 28**: Test command palette globally
  **Parallelizable**: NO (must run after Task 25)
  **Description**: Test Cmd+K command palette on all pages, verify navigation works, check styling consistency.
  **Expected Output**: Command palette working on all pages.

- [x] **Task 29**: Final visual consistency review
  **Parallelizable**: NO (must run after all other tasks)
  **Description**: Review all pages side-by-side for visual consistency (spacing, typography, colors, shadows, borders). Document any inconsistencies and fix.
  **Expected Output**: Visual consistency report and fixes applied.

## Success Criteria
- All 16 pages redesigned with consistent design system
- Safety Orange accent used appropriately (primary actions, focus rings, key UI)
- Geist fonts used throughout (Sans for UI, Mono for code/data)
- Dark mode working on all pages
- Build passes with zero errors
- Accessibility features working (keyboard nav, reduced motion, focus rings)
- Command palette working globally
- No dynamic Tailwind class strings
- All semantic tokens used correctly

## Technical Constraints
- DO NOT use dynamic Tailwind strings like `bg-${variable}-100`
- DO NOT remove dark mode support
- DO NOT modify the parallax wallpaper implementation
- PRESERVE all existing semantic token class names
- MAINTAIN build passing status throughout
- FOLLOW existing code patterns in the codebase
