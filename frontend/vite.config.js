// Vite: server di sviluppo, build e configurazione dei test (Vitest).
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Indirizzo del backend per il proxy di sviluppo (porta di backend/.env).
const backend = process.env.VITE_BACKEND_URL || 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  server: {
    // Le chiamate a /api vanno al backend: niente CORS in sviluppo.
    proxy: { '/api': backend },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
  },
});
