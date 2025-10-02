// arcade-clash/vitest.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom', // or 'node' if no DOM interaction is needed
    globals: true,
    setupFiles: [], // if you have global setup files
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/poc_tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['src/grpc/**'], // Exclude generated gRPC files from coverage
    },
  },
});
