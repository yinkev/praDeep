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

        const stored = localStorage.getItem('deeptutor-theme');

        if (stored === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (stored === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          // Use system preference if not set
          if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('deeptutor-theme', 'dark');
          } else {
            localStorage.setItem('deeptutor-theme', 'light');
          }
        }
      } catch (e) {
        // Silently fail - localStorage may be disabled
      }
    })();
  `

  return <script dangerouslySetInnerHTML={{ __html: themeScript }} suppressHydrationWarning />
}
