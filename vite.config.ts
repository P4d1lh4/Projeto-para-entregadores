import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Increase request timeout for large file uploads
    timeout: 300000, // 5 minutes
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
  // Optimize for large file processing
  build: {
    rollupOptions: {
      external: [],
      // Increase chunk size limit for better performance
      output: {
        manualChunks: undefined,
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    },
    // Increase chunk size warning limit to 1MB
    chunkSizeWarningLimit: 1000,
  },
  // Worker configuration for better large file handling
  worker: {
    format: 'es'
  },
  // Optimize dependencies for better performance
  optimizeDeps: {
    include: ['xlsx', 'papaparse'],
    esbuildOptions: {
      // Increase memory limit for large file processing
      target: 'esnext'
    }
  }
}));
