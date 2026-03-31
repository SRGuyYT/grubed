import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import eslint from 'vite-plugin-eslint';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    eslint(), // default plugin; will auto-detect .eslintrc.js
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: { usePolling: true },
    allowedHosts: ['grub.sky0cloud.dpdns.org'],
  },
  resolve: {
    alias: {
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@assets': '/src/assets',
      '@utils': '/src/utils',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
});
