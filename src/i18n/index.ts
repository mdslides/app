import { createI18n } from 'vue-i18n'

import be from './locales/be.json'
import en from './locales/en.json'

export default createI18n({
  legacy: false,
  locale: process.env.VUE_APP_I18N_LOCALE || 'en',
  fallbackLocale: process.env.VUE_APP_I18N_FALLBACK_LOCALE || 'en',
  messages: {
    be,
    en,
  },
})
