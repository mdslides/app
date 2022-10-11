<template>
  <div class="home-view">
    <div class="home-view__header">
      <AppLogo />

      <NavigationBar
        @download="handleDownload"
        @export="handleExport"
        @upload="handleUpload"
      />
    </div>

    <div class="home-view__split">
      <MarkdownEditor :value="contentOpened" @input="content = $event" />

      <SlidesPreview :value="content" @render="slideCanvases = $event" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { jsPDF } from 'jspdf'

import AppLogo from '../components/AppLogo.vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import NavigationBar from '../components/NavigationBar.vue'
import SlidesPreview from '../components/SlidesPreview.vue'

export default defineComponent({
  components: {
    AppLogo,
    MarkdownEditor,
    NavigationBar,
    SlidesPreview,
  },
  setup() {
    const { t } = useI18n()
    const content = ref('')
    const contentOpened = ref('')
    const slideCanvases = ref<HTMLCanvasElement[]>([])

    const handleDownload = () => {
      const file = new File([content.value], 'slides.md', {
        type: 'text/plain',
      })
      const linkEl = document.createElement('a')
      const objectUrl = URL.createObjectURL(file)
      linkEl.href = objectUrl
      linkEl.download = file.name
      document.body.appendChild(linkEl)
      linkEl.click()
      document.body.removeChild(linkEl)
      window.URL.revokeObjectURL(objectUrl)
    }

    const handleExport = () => {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [400, 300],
      })

      slideCanvases.value.forEach((canvas, i) => {
        if (i !== 0) {
          doc.addPage()
        }
        doc.addImage(canvas, 'PNG', 0, 0, 400, 300)
      })

      doc.save('slides.pdf')
    }

    const handleUpload = (value: string) => {
      contentOpened.value = value
    }

    return {
      content,
      contentOpened,
      slideCanvases,
      handleDownload,
      handleExport,
      handleUpload,
      t,
    }
  },
})
</script>

<style lang="scss" scoped>
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
  }

  &__split {
    display: flex;
    height: calc(100vh - 3rem - 32px);
    border-top: 1px solid var(--color-border);

    & > * {
      flex: 1 0;

      &:first-child {
        flex-basis: 70%;
        border-right: 1px solid var(--color-border);
      }

      &:last-child {
        flex-basis: 30%;
      }
    }
  }

  @media (min-width: 1200px) {
    border-right: 1px solid var(--color-border);
    border-left: 1px solid var(--color-border);
  }

  @media (max-width: 768px) {
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
          min-height: 0;
        }
      }
    }
  }
}
</style>
