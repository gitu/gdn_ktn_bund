import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,vue}'],
    setupFiles: ['src/test-setup.ts'],
    css: false, // Disable CSS processing for tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        'src/test-setup.ts',
      ],
    },
    server: {
      deps: {
        inline: ['vuetify']
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "vuetify/settings";`
      }
    }
  },
  // Define module mocks
  define: {
    'import.meta.vitest': undefined,
  }
});
