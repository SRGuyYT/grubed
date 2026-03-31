import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr'; // Allows importing SVGs as React components
import eslint from 'vite-plugin-eslint'; // Adds linting for better code quality

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    eslint(),
  ],
  server: {
    host: true, // Allows access from LAN
    port: 5173,
    strictPort: true, // Fail if port is already in use
    watch: {
      usePolling: true, // Better for containerized environments
    },
    allowedHosts: [
      'grub.sky0cloud.dpdns.org', // Add the host here
    ],
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
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
