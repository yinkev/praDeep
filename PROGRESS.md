# Progress Log

## Session: Sat Jan 17 2026
**Status:** Initializing frontend redesign and resolving token/theme inconsistencies.

**Completed:**
- [x] Defined App Router IA and core navigation routes in `Sidebar.tsx`.
- [x] Established basic shell layout with scroll container and sidebar.
- [x] Integrated `geist` font package (v1.5.1) into the project.

**Next:**
- [ ] Unify `web/app/globals.css` to a single token system (OKLCH) following Geist/Vercel guidance.
- [ ] Fix missing `color-border-subtle` and reconcile Tailwind config with component tokens.
- [ ] Consolidate `web/app/page.tsx` and `web/app/HomePageClient.tsx` into a single, rich landing page.
- [ ] Implement light-themed "utilitarian x teenage engineer" aesthetic (non-purple accent).
- [ ] Add wallpaper parallax (SVG/Canvas) to the home implementation.
- [ ] Transition root layout from Google fonts to Geist Sans/Mono.

**Risks:**
- Theme conflicts: Overlapping CSS variable systems may lead to visual regressions.
- Token mismatch: Components using `bg-surface-base` etc. will break until Tailwind config is aligned.
- Hydration: Complex parallax/animations in `HomePageClient` must be carefully handled for SSR.
