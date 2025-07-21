import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3001,
    strictPort: true, // ⚠️ NUNCA trocar de porta automaticamente
    // Hot reload configuração para Docker/WSL
    watch: {
      usePolling: true,
      interval: 1000
    },
    // Permitir acesso via Cloudflare Tunnel
    allowedHosts: [
      'localhost',
      '.trycloudflare.com', // Permite todos os subdomínios do Cloudflare
      '127.0.0.1'
    ]
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
}));
