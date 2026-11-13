import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  runtimeConfig: {
    numverifyApiKey: "",
    numverifyBaseUrl: "",
  },
  externals: {
    external: ["better-sqlite3"],
  },
});
