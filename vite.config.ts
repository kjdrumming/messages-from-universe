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
    target: 'es2015',
    commonjsOptions: {
      include: [/node_modules/, /src/],
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2015',
      supported: {
        'top-level-await': true,
      },
    },
    include: [
      '@tanstack/react-query',
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@supabase/auth-js',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-select',
      '@radix-ui/react-collection',
      'lucide-react',
      // Add more if needed
    ],
  },
}));
