/**
 * ThemeScript - Initializes theme from localStorage before React hydration.
 *
 * Implementation note:
 * We intentionally use a plain inline `<script>` (not `next/script`) so it executes immediately
 * during HTML parsing, before any async Next/overlay scripts run in dev.
 */
export default function ThemeScript() {
  const themeScript = `
    (function() {
      try {
        // Guard against duplicate Custom Element registration during dev/HMR or injected overlays.
        // Only targets the known problematic tag to avoid masking legitimate errors.
        if (!window.__pradeep_ce_define_patched__) {
          window.__pradeep_ce_define_patched__ = true;

          var targetTag = 'mce-autosize-textarea';

          // Patch the registry instance
          var registry = window.customElements;
          if (registry && typeof registry.define === 'function' && typeof registry.get === 'function') {
            var originalDefine = registry.define;
            registry.define = function(name, constructor, options) {
              if (name === targetTag && registry.get(name)) return;
              return originalDefine.call(registry, name, constructor, options);
            };
          }

          // Patch the prototype (covers direct calls / fresh lookups)
          if (window.CustomElementRegistry && window.CustomElementRegistry.prototype) {
            var proto = window.CustomElementRegistry.prototype;
            if (typeof proto.define === 'function' && typeof proto.get === 'function') {
              var originalProtoDefine = proto.define;
              proto.define = function(name, constructor, options) {
                if (name === targetTag && this.get(name)) return;
                return originalProtoDefine.call(this, name, constructor, options);
              };
            }
          }
        }

        var theme = localStorage.getItem('deeptutor-theme');

        if (!theme) {
          // Use system preference if not set
          theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
          localStorage.setItem('deeptutor-theme', theme);
        }

        // Persisted theme attribute used by tests + CSS.
        document.documentElement.setAttribute('data-theme', theme);

        // Dark-mode class.
        var isDark = /dark$/.test(theme);
        if (isDark) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');

        // High contrast.
        if (theme.indexOf('high-contrast') === 0) {
          document.documentElement.classList.add('high-contrast');
        } else {
          document.documentElement.classList.remove('high-contrast');
        }

        // Custom overrides.
        var customRaw = localStorage.getItem('deeptutor-theme-custom');
        var shouldApplyCustom = theme.indexOf('custom-') === 0;

        if (shouldApplyCustom && customRaw) {
          try {
            var custom = JSON.parse(customRaw) || {};
            if (custom.primary) document.documentElement.style.setProperty('--primary', String(custom.primary));
            if (custom.ring) document.documentElement.style.setProperty('--ring', String(custom.ring));
          } catch (e) {
            // Ignore malformed custom settings.
          }
        } else {
          // Avoid leaking a previous custom theme into non-custom modes.
          document.documentElement.style.removeProperty('--primary');
          document.documentElement.style.removeProperty('--ring');
        }
      } catch (e) {
        // Silently fail - localStorage may be disabled
      }
    })();
  `

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
}
