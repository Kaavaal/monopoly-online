import { defineConfig } from 'vitest/config';

// Only this repo's tests. Without it vitest also crawls the gitignored .pnpm-store, where pnpm links
// other projects that share the store.
export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
});
