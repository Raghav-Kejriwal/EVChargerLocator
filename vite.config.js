import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        auth: 'auth.html',
        profile: 'profile.html',
      },
    },
  }
});
