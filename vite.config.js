import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, forward /api/* to the Express proxy so the API key never reaches the browser.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:3001' } },
});
