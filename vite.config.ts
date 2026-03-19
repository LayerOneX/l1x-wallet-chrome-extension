import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  base: "",
  server: {
    port: 3000,
    watch: {
      usePolling: true
    }
  },
  plugins: [
    nodePolyfills(),
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "manifest.json",
          dest: "",
        },
        {
          src: "offscreen.html",
          dest: "",
        },
      ],
    }),
  ],
  resolve: {
    alias: {
      "@assets": path.resolve(__dirname, "src", "assets"),
      "@util": path.resolve(__dirname, "util"),
      "@virtual_machines": path.resolve(__dirname, "virtual_machines"),
      "@factory": path.resolve(__dirname, "factory"),
      "@abi": path.resolve(__dirname, "abi"),
      "@ui": path.resolve(__dirname, "src", "ui"),
      "@features": path.resolve(__dirname, "src", "features"),
      "@components": path.resolve(__dirname, "src", "components")
    },
  },
  esbuild: {
    // drop: ["console", "debugger"], // temporarily disabled for debugging
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        main2: path.resolve(__dirname, "notification.html"),
        service_worker: path.resolve(
          __dirname,
          "service_worker", "index.ts"
        ),
        content_script: path.resolve(
          __dirname,
          "content_script",
          "index.ts"
        ),
        sdk: path.resolve(__dirname, "sdk", "index.ts"),
        ethereum_sdk: path.resolve(__dirname, "sdk", "ethereum.ts"),
        offscreen: path.resolve(__dirname, "offscreen", "index.ts"),
      },
      output: {
        entryFileNames: "[name]/index.js",
        chunkFileNames: "[name]/[name].[hash].chunk.js",
      },
    },
  },
});
