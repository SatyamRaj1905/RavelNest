import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      'server-only': fileURLToPath(
        new URL('./tests/server-only.ts', import.meta.url),
      ),
    },
  },
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/domain/**/*.ts',
        'src/application/**/*.ts',
        'src/infrastructure/**/*.ts',
        'src/client/**/*.ts',
        'src/components/use-generation.ts',
        'src/components/use-create-event.ts',
        'src/components/use-workspace.ts',
      ],
      reporter: ['text', 'json-summary', 'html'],
      thresholds: { statements: 95, lines: 95, functions: 95, branches: 90 },
    },
  },
});
