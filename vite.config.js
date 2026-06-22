import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true
  },
  base: '/startup-manager/'
})
