import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["servers/file-server.ts", "servers/socket-server.ts"],
  outDir: "dist-servers",
  format: ["esm"],
  platform: "node",
  target: "node24",
  external: ["dotenv"],
  bundle: true,
  clean: true,
});