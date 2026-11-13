import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  externals: {
    external: ["better-sqlite3"],
  },
});
