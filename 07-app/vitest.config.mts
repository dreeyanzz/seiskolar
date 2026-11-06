// Unit tests: the rules that need no browser (npm test). The flows are in tests/e2e.
import { resolve } from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': resolve(import.meta.dirname) } },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
})
