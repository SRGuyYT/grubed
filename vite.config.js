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
    eslint({
      eslintOptions: {
        overrideConfigFile: '.eslintrc.js', // <- explicitly point to your ESLint config
      },
      emitWarning: true,  // show warnings in console
      emitError: true,    // show errors in console
      failOnWarning: false, // don’t break dev server for warnings
      failOnError: false,   // don’t break dev server for errors
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
    },
    allowedHosts: [
      'grub.sky0cloud.dpdns.org',
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
