/** @type {import('next').NextConfig} */

const nextConfig = {
  // Move dev indicator to bottom-right corner
  devIndicators: {
    position: "bottom-right",
  },

  // Transpile mermaid and related packages for proper ESM handling
  transpilePackages: ["mermaid"],

  // Turbopack configuration (Next.js 16+ uses Turbopack by default for dev)
  turbopack: {
    // Ensure Turbopack resolves from the Next.js app root (avoids lockfile-root inference).
    root: __dirname,
    resolveAlias: {
      // Fix for mermaid's cytoscape dependency - use CJS version
      cytoscape: "cytoscape/dist/cytoscape.cjs.js",
    },
  },

  // Webpack configuration (used for production builds - next build)
  webpack: (config) => {
    const path = require("path");
    config.resolve.alias = {
      ...config.resolve.alias,
      cytoscape: path.resolve(
        __dirname,
        "node_modules/cytoscape/dist/cytoscape.cjs.js",
      ),
    };

    // Encourage better tree-shaking for our UI/component modules.
    config.optimization = {
      ...config.optimization,
      usedExports: true,
      sideEffects: true,
    };

    config.module.rules.push({
      test: /\.[jt]sx?$/,
      include: [path.resolve(__dirname, "components")],
      sideEffects: false,
    });

    return config;
  },
};

module.exports = nextConfig;
