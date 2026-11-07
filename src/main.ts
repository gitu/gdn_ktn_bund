import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'

import { definePreset } from '@primeuix/themes'
import Lara from '@primeuix/themes/lara'
import '@fontsource-variable/inter/wght.css'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

import '@/assets/styles.scss'

// Lara with softer corners and a hairline card: the rest of the look lives in assets/layout/variables/_tokens.scss.
const Preset = definePreset(Lara, {
  semantic: {
    content: { borderRadius: '12px' },
    formField: { borderRadius: '10px' },
    colorScheme: {
      dark: {
        // Slate/navy instead of Lara's neutral zinc, so PrimeVue surfaces match --gk-surface (900) and --gk-bg (950)
        surface: {
          0: '#ffffff',
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#cbd5e1',
          300: '#94a3b8',
          400: '#64748b',
          500: '#475569',
          600: '#334155',
          700: '#1e293b',
          800: '#151d2c',
          900: '#111826',
          950: '#0a0f18',
        },
      },
    },
  },
  components: {
    card: {
      root: { borderRadius: '16px', shadow: 'var(--gk-shadow-1)' },
      body: { padding: '1.25rem', gap: '0.75rem' },
    },
    button: { root: { borderRadius: '10px' } },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, {
  theme: {
    preset: Preset,
    options: {
      darkModeSelector: '.app-dark',
    },
  },
})
app.use(ToastService)
app.use(ConfirmationService)

// Keep <html lang> in step with the selected language (screen readers, hyphenation, translation prompts).
watch(
  () => (i18n.global.locale as unknown as { value: string }).value,
  (locale) => {
    document.documentElement.lang = locale
  },
  { immediate: true },
)

app.mount('#app')
