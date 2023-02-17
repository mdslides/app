<template>
  <div class="home-view">
    <div class="home-view__header">
      <a :href="appLogoLink">
        <AppLogo />
      </a>

      <NavigationBar
        @download="handleDownload"
        @export="handleExport"
        @upload="handleUpload"
      />
    </div>

    <div class="home-view__split">
      <MarkdownEditor
        :placeholder="t('editorPlaceholder')"
        :value="contentOpened"
        @input="content = $event"
      />

      <SlidesPreview :value="content" />
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { debounce } from 'lodash'
import { fileOpen, fileSave } from 'browser-fs-access'

import { createPdf, isLocalStorageAvailable } from '@/utils'
import AppLogo from '../components/AppLogo.vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import NavigationBar from '../components/NavigationBar.vue'
import SlidesPreview from '../components/SlidesPreview.vue'

const autosaveKey = 'mdslides_draft'

export default defineComponent({
  components: {
    AppLogo,
    MarkdownEditor,
    NavigationBar,
    SlidesPreview,
  },
  setup() {
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
        })
      } catch {
        // ignore
      }
    }

    const handleExport = async () => {
      try {
        const slidesContainer = document.getElementById('slidesPreview')
        if (slidesContainer?.children.length) {
          const blob = await createPdf(slidesContainer.children)
          await fileSave(blob)
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

        contentOpened.value = await new Response(blob).text()
      } catch {
        // ignore
      }
    }

    const appLogoLink = computed(() => {
      return locale.value === fallbackLocale.value ? '/' : `/${locale.value}/`
    })

    if (isLocalStorageAvailable()) {
      watch(
        content,
        debounce(() => {
          localStorage.setItem(autosaveKey, content.value)
        }, 1600)
      )
    }

    onMounted(() => {
      if (isLocalStorageAvailable()) {
        contentOpened.value = localStorage.getItem(autosaveKey) ?? ''
      }
    })

    return {
      appLogoLink,
      content,
      contentOpened,
      handleDownload,
      handleExport,
      handleUpload,
      t,
    }
  },
})
</script>

<i18n>
{
  "be": {
    "editorPlaceholder": "Pačnicie nabirać tekst tut..."
  },
  "en": {
    "editorPlaceholder": "Start typing here..."
  }
}
</i18n>

<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/mixins';

.home-view {
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
          flex-basis: calc(25vh + 32px); // Safari fallback
          min-height: 0;
        }
      }
    }
  }
}
</style>
