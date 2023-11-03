import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { isLocalStorageAvailable } from '@/utils'

const languageKey = 'mdslides_language'
const languageParam = 'lang'

export const useLanguageInitialize = () => {
  const { availableLocales, fallbackLocale, locale } = useI18n({
    useScope: 'global',
  })

  const url = new URL(window.location.href)
  const requestedLocale = url.searchParams.get(languageParam)

  if (requestedLocale) {
    url.searchParams.delete(languageParam)
    window.history.pushState(undefined, '', url)
  }

  if (requestedLocale && availableLocales.includes(requestedLocale)) {
    locale.value = requestedLocale
  } else if (isLocalStorageAvailable()) {
    locale.value =
      localStorage.getItem(languageKey) ?? (fallbackLocale.value as string)
  }
}

export const useLanguagePreserve = () => {
  const { locale } = useI18n({ useScope: 'global' })

  if (isLocalStorageAvailable()) {
    watch(locale, () => {
      localStorage.setItem(languageKey, String(locale.value))
    })
  }
}
