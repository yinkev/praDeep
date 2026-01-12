# 2026 Frontend Design Compliance Report

Date: 2026-01-12  
Scope: `web/` (Next.js App Router + Tailwind v4 + Framer Motion)

## Executive Summary

The codebase is already largely aligned with a 2026 “liquid glass / soft minimalism” direction (design tokens in `tailwind.config.js`, glass utilities and focus/motion defaults in `app/globals.css`). The main gaps were inconsistent dark-mode styling and rounded-corner usage in a few shared UI primitives and custom modals, plus a handful of accessibility issues (icon-only controls, “clickable divs”, and modal focus management).

## Checklist Results (with fixes)

### 1) Glassmorphism

Status: **Mostly compliant → improved for key surfaces**

- Existing: glass utilities (`.glass`, `.glass-subtle`), translucency tokens, and gradient wash background utilities.
- Fixes:
  - `components/ui/Modal.tsx` now renders as a glass surface (translucent background + `backdrop-blur`) with a softened blurred backdrop.
  - `components/ui/Toast.tsx` now uses a glass frame style and larger corner radius.
  - `components/AddToNotebookModal.tsx`, `components/NotebookImportModal.tsx`, and `components/CoMarkerEditor.tsx` popovers/overlays updated to use translucent surfaces with appropriate dark-mode styling.

### 2) Soft shadows (not harsh)

Status: **Compliant after cleanup**

- Reduced “too heavy” modal-style shadows in a few places (example: `components/knowledge/VersionsModal.tsx` switched `shadow-2xl` → `shadow-xl`).
- Continued using the project’s shadow tokens instead of bespoke heavy shadows.

### 3) Rounded corners (`rounded-xl` / `rounded-2xl`)

Status: **Compliant for primary surfaces**

- Updated core primitives and navigation surfaces to default to `rounded-xl/2xl`:
  - `components/ui/Button.tsx`, `components/ui/Input.tsx`, `components/ui/Modal.tsx`, `components/ui/Toast.tsx`
  - `components/Sidebar.tsx`, `components/ui/MediaUpload.tsx`
  - Custom modals and popovers updated where they represent “card/panel” surfaces.
- Smaller “micro controls” retain tighter radii when appropriate.

### 4) Subtle gradients

Status: **Compliant**

- Existing subtle gradient washes and accent gradients are consistent with the target style.
- Dark-mode gradient usage kept low-alpha (to avoid contrast issues).

### 5) Motion design

Status: **Compliant**

- Existing: Framer Motion is used for navigation, modals, toasts; Tailwind keyframes are present.
- Fixes:
  - Modal + button interactions respect reduced motion (no forced motion-only affordances).

### 6) Dark mode ready

Status: **Improved**

- Fixed dark-mode gaps in:
  - shared primitives (`Button`, `Input`, `Modal`, `Toast`)
  - navigation (`Sidebar`)
  - custom modals (`AddToNotebookModal`, `NotebookImportModal`)
  - editor overlays/popovers (`CoMarkerEditor`)
- Theme initialization already handled via `components/ThemeScript.tsx`.

### 7) Accessibility

Status: **Improved**

- Modal focus management: `components/ui/Modal.tsx` now traps focus, supports `Escape`, and restores focus on close.
- Converted “clickable divs” → buttons: `components/NotebookImportModal.tsx` (notebook and record selections are now keyboard-operable and expose toggle state via `aria-expanded` / `aria-pressed`).
- Icon-only controls:
  - Added/ensured `aria-label` on key icon-only buttons (e.g. sidebar collapse toggle, media remove buttons, editor toolbar buttons).

## Notable Implementation Changes

- `app/globals.css`: increased default glass radius (`--radius`) to better match `rounded-xl`.
- `components/ui/Card.tsx`: added `solid` as a backwards-compatible `CardVariant` alias (mapped to `default`) to resolve type mismatches.

## Verification

- `npx tsc -p tsconfig.json --noEmit`
- `npm run build`
- `npm run lint` (warn-only; no errors)

## Follow-ups / Recommendations

- `npm run lint` is now wired to ESLint flat config (`eslint.config.mjs`), but the codebase still emits several warnings (notably from newer `react-hooks/*` rules and a few remaining a11y/`<img>` warnings). Consider addressing these incrementally or tightening `--max-warnings` once the warning count is under control.
