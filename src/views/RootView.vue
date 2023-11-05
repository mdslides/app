<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { debounce } from 'lodash'
import { fileOpen, fileSave } from 'browser-fs-access'

import {
  AUTOSAVE_DELAY,
  AUTOSAVE_KEY,
  EDITOR_INPUT_DELAY,
  PREVIEW_CONTAINER_ID,
} from '@/constants'
import { createPdf, getTitle, isLocalStorageAvailable } from '@/utils'
import {
  AppLogo,
  MarkdownEditor,
  NavigationBar,
  SlidesPreview,
} from '@/components'

const { fallbackLocale, locale, t } = useI18n()
const content = ref('')
const contentOpened = ref('')

const handleDownload = async () => {
  try {
    const blob = new Blob([content.value], {
      type: 'text/plain',
    })

    await fileSave(blob, {
      extensions: ['.md'],
      fileName: getTitle(content.value),
    })
  } catch {
    // ignore
  }
}

const handleEditorInput = debounce((value: string) => {
  content.value = value
}, EDITOR_INPUT_DELAY)

const handleExport = async () => {
  try {
    const slidesContainer = document.getElementById(PREVIEW_CONTAINER_ID)
    if (slidesContainer?.children.length) {
      const blob = await createPdf(slidesContainer.children)
      await fileSave(blob, {
        fileName: getTitle(content.value),
      })
    }
  } catch {
    // ignore
  }
}

const handleUpload = async () => {
  try {
    const blob = await fileOpen({
      mimeTypes: ['text/*'],
      extensions: ['.md'],
    })

    setContent(await new Response(blob).text())
  } catch {
    // ignore
  }
}

const setContent = (value: string) => {
  content.value = value
  contentOpened.value = value
}

const appLogoLink = computed(() => {
  return locale.value === fallbackLocale.value ? '/' : `/${locale.value}/`
})

if (isLocalStorageAvailable()) {
  watch(
    content,
    debounce(() => {
      localStorage.setItem(AUTOSAVE_KEY, content.value)
    }, AUTOSAVE_DELAY)
  )
}

onMounted(() => {
  if (isLocalStorageAvailable()) {
    setContent(localStorage.getItem(AUTOSAVE_KEY) ?? '')
  }
})
</script>

<template>
  <div class="root-view">
    <header class="root-view__header">
      <a :href="appLogoLink" target="_blank">
        <AppLogo />
      </a>

      <NavigationBar
        @download="handleDownload"
        @export="handleExport"
        @upload="handleUpload"
      />
    </header>

    <div class="root-view__split">
      <MarkdownEditor
        :placeholder="t('MarkdownEditor.placeholder')"
        :value="contentOpened"
        @input="handleEditorInput"
      />

      <SlidesPreview :value="content" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/mixins';

.root-view {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  max-width: 1200px;

  &__header {
    display: flex;
    gap: 32px;
    padding: 16px;
    align-items: center;

    & > a {
      text-decoration: none;
    }
  }

  &__split {
    display: flex;
    height: calc(100vh - 3rem - 32px);
    border-top: 1px solid var(--color-border);

    & > * {
      &:first-child {
        flex: 1 0;
        border-right: 1px solid var(--color-border);
        overflow: hidden;
      }

      &:last-child {
        flex: 0 0 min-content;
      }
    }
  }

  @include media-breakpoint-up($lg) {
    box-shadow: 0 0 0 1px var(--color-border);
  }

  @include media-breakpoint-down($sm) {
    &__header {
      justify-content: space-between;
    }

    &__split {
      flex-direction: column-reverse;

      & > * {
        &:first-child {
          border-top: 1px solid var(--color-border);
          border-right: none;
        }

        &:last-child {
          flex-basis: calc(25vh + 32px + 65px); // Safari fallback
          min-height: 0;
        }
      }
    }
  }
}
</style>
