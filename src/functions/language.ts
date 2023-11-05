import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { LANGUAGE_KEY, LANGUAGE_PARAM } from '@/constants'
import { isLocalStorageAvailable } from '@/utils'

export const useLanguageInitialize = () => {
  const { availableLocales, fallbackLocale, locale } = useI18n({
    useScope: 'global',
  })

  const url = new URL(window.location.href)
  const requestedLocale = url.searchParams.get(LANGUAGE_PARAM)

  if (requestedLocale) {
    url.searchParams.delete(LANGUAGE_PARAM)
    window.history.pushState(undefined, '', url)
  }

  if (requestedLocale && availableLocales.includes(requestedLocale)) {
    locale.value = requestedLocale
  } else if (isLocalStorageAvailable()) {
    locale.value =
      localStorage.getItem(LANGUAGE_KEY) ?? (fallbackLocale.value as string)
  }
}

export const useLanguagePreserve = () => {
  const { locale } = useI18n({ useScope: 'global' })

  if (isLocalStorageAvailable()) {
    watch(locale, () => {
      localStorage.setItem(LANGUAGE_KEY, String(locale.value))
    })
  }
}
