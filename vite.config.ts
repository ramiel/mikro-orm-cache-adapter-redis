import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/*.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
    },
  },
});
