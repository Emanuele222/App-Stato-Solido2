import { defineConfig } from 'vitest/config'

// I test riguardano solo physics/ (TypeScript puro): ambiente node, niente DOM.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
})
