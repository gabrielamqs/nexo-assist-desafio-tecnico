import { defineConfig } from "vitest/config";

const MINUTOS = 60_000;

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["tests/eval/**/*.eval.ts"],
    setupFiles: ["tests/eval/variaveis-de-ambiente.ts"],
    testTimeout: 3 * MINUTOS,
  },
});
