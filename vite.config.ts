import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api/advocu': {
        target: 'https://api.advocu.com/personal-api/v1/gde',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/advocu/, ''),
      },
    },
  },
});
