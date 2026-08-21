import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // listen on every interface, not just localhost, so the phone on the same
    // wifi can reach it. Vite prints the Network: address to use.
    host: true,
    port: 5183,
    strictPort: true
  },
  preview: {
    host: true,
    port: 4183,
    strictPort: true
  }
});
