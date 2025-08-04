import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'es2017',
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2017',
      // Force all dependencies to be transpiled
      // This helps with iOS Safari compatibility
      supported: {
        'top-level-await': true,
      },
    },
    include: [
      // Add all major dependencies here if needed
    ],
  },
}));
