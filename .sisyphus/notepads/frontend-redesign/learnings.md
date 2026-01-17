# Frontend Redesign - Learnings

## Component Audit Findings (2026-01-17)

### Strong Foundation
- **15 production-ready components** using semantic tokens correctly
- Core primitives (Button, Card, Input, Modal, LoadingState, Toast, Carousel, Tabs) are well-architected
- Consistent use of Framer Motion for animations
- WCAG 2.1 AA accessibility patterns (focus rings, aria attributes)
- Dark mode support throughout

### Token System Architecture
- **Semantic tokens** defined in `globals.css` as CSS variables (`--color-surface-*`, `--color-text-*`, `--color-accent-*`, `--color-border-*`)
- **Tailwind mappings** in `tailwind.config.js` expose tokens as utility classes (`bg-surface-elevated`, `text-text-primary`, etc.)
- **Partial shadcn adoption**: Some components use unmapped shadcn tokens (`bg-muted`, `text-muted-foreground`, `bg-primary`)

### Component Patterns
1. **Compound Components**: Card, Modal, Table use compound pattern (Card.Header, Card.Content, Card.Footer)
2. **Variant Systems**: Button, Card use variant props for styling (primary, secondary, outline, ghost)
3. **Size Presets**: Button, Input, Spinner use size props (sm, md, lg)
4. **Controlled/Uncontrolled**: Input, Textarea support both modes
5. **Framer Motion**: Used for animations (Button, Modal, Toast, Carousel, Tabs)
6. **Radix UI Primitives**: Tooltip, Avatar, Switch, Separator, Progress use Radix

### Missing Components (Critical for 16 Pages)
1. **Sheet/Drawer** - Mobile nav, filters (HIGH priority)
2. **Dropdown/Menu** - Actions, filters (HIGH priority)
3. **Empty State** - No data states (HIGH priority)
4. **Command Palette** - Global Cmd+K (HIGH priority, placeholder exists)
5. **Pagination** - Data tables (MEDIUM priority)
6. **Select/Combobox** - Form inputs (MEDIUM priority)
7. **Page-Level Skeletons** - TableSkeleton, DashboardSkeleton (MEDIUM priority)
8. **Breadcrumb** - Navigation hierarchy (LOW priority, basic support exists)

### Token Mapping Gaps
- **Table**: Uses `bg-muted/50`, `text-muted-foreground`, `border-borderSemantic-subtle` (typo)
- **Tooltip**: Uses `bg-primary`, `text-primary-foreground`
- **Badge**: Uses `bg-primary`, `bg-secondary`, `bg-destructive`, `focus:ring-ring`
- **Avatar**: Uses `bg-muted`, `text-muted-foreground`
- **Switch**: Uses `bg-primary`, `bg-input`, `bg-background`, `focus-visible:ring-ring`
- **Progress**: Uses `bg-muted`, `bg-primary`

**Fix**: Add missing CSS variables to `globals.css` or update components to use semantic tokens

### Duplicate Components
- **Skeleton**: 3 implementations (LoadingState.Skeleton, Skeleton.tsx, SkeletonCard/List/Text.tsx)
- **Command**: 2 implementations (CommandMenu for slash commands, CommandPalette placeholder for Cmd+K)

**Recommendation**: Consolidate Skeleton into LoadingState.tsx, rebuild CommandPalette

### Design System Conventions
- **Rounded corners**: `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for buttons/modals
- **Glass morphism**: `bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md` for elevated surfaces
- **Transitions**: 150-200ms with `cubic-bezier(0.2, 0.8, 0.2, 1)` easing
- **Focus rings**: `focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2`
- **Dark mode**: Class-based (`dark:`) with semantic token overrides

### Page-Specific Needs
- **Data-heavy pages** (`/history`, `/analytics`, `/metrics`): Need Table (fix tokens), Dropdown, Pagination, EmptyState
- **Settings pages** (`/settings`, `/knowledge`): Need Tabs (ready), Switch (fix tokens), Dropdown
- **Mobile experience**: Need Sheet/Drawer for navigation and filters
- **Global UX**: Need Command Palette (Cmd+K) for navigation and actions

### Next Agent Guidance
1. **Task 2**: Fix token mappings (add CSS variables or update components)
2. **Tasks 3-7**: Create missing primitives (parallelizable)
   - Sheet/Drawer (Task 3)
   - Dropdown/Menu (Task 4)
   - Empty State (Task 5)
   - Command Palette (Task 6)
   - Pagination (Task 7)
3. **Task 8**: Consolidate duplicates
4. **Tasks 9-24**: Page implementations (can use audit to know which components are safe)

### Key Insight
The component library has a **strong foundation** (15 production-ready primitives) but needs **6 token fixes** and **8 new components** before page implementations can proceed confidently. The audit provides a clear roadmap for parallelizable work.
