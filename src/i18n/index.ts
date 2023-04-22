import { createI18n } from 'vue-i18n'

import be from './locales/be.json'
import en from './locales/en.json'

export default createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages: {
    be,
    en,
  },
})
