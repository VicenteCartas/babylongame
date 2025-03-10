import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    fs: {
      // Allow serving files outside of the root
      allow: [
        "../.."
      ]
    },
    open: true,
  },
  optimizeDeps: { exclude: ["@babylonjs/havok"] }
});
