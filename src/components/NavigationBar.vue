<template>
  <nav class="navigation-bar">
    <ul>
      <li
        role="button"
        :class="{ active: activeGroup === 'file' }"
        @click="handleGroupClick('file')"
      >
        {{ t('file') }}

        <ul>
          <li role="button" @click="fileInput.click">
            <input ref="fileInput" type="file" @change="handleFileUpload" />

            <span>{{ t('open') }}</span>
          </li>

          <li role="button" @click="$emit('download')">
            <span>{{ t('downloadAsMD') }}</span>
          </li>

          <li role="button" @click="$emit('export')">
            <span>{{ t('exportAsPDF') }}</span>
          </li>
        </ul>
      </li>
    </ul>

    <ul class="compact">
      <li
        role="button"
        :class="{ active: activeGroup === 'language' }"
        @click="handleGroupClick('language')"
      >
        {{ locale }}

        <ul>
          <template v-for="item in availableLocales">
            <li
              v-if="item !== locale"
              :key="item"
              role="button"
              @click="locale = item"
            >
              <span>{{ item }}</span>
            </li>
          </template>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  emits: ['download', 'export', 'upload'],
  setup(props, { emit }) {
    const { availableLocales, locale } = useI18n({ useScope: 'global' })
    const { t } = useI18n()
    const fileInput = ref<HTMLInputElement>()
    const activeGroup = ref<string | null>(null)

    const handleFileUpload = (e: InputEvent) => {
      activeGroup.value = null

      const file = (e.target as HTMLInputElement)?.files?.[0]
      if (!file) {
        return
      }

      const fileReader = new FileReader()
      fileReader.onload = (data) => {
        emit('upload', data.target?.result)
      }
      fileReader.readAsText(file)

      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }

    const handleGroupClick = (group: string) => {
      if (activeGroup.value === group) {
        return
      }

      const listener = () => {
        document.body.removeEventListener('click', listener)
        activeGroup.value = null
      }

      setTimeout(() => {
        document.body.addEventListener('click', listener)
        activeGroup.value = group
      })
    }

    return {
      activeGroup,
      availableLocales,
      fileInput,
      locale,
      handleFileUpload,
      handleGroupClick,
      t,
    }
  },
})
</script>

<i18n>
{
  "be": {
    "downloadAsMD": "Spampavać jak Markdown",
    "exportAsPDF": "Ekspartavać jak PDF",
    "file": "Fajł",
    "open": "Adkryć Markdown fajł"
  },
  "en": {
    "downloadAsMD": "Download as Markdown",
    "exportAsPDF": "Export as PDF",
    "file": "File",
    "open": "Open Markdown file"
  }
}
</i18n>

<style lang="scss" scoped>
.navigation-bar {
  display: flex;
  gap: 4px;
  user-select: none;

  input[type='file'] {
    display: none;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 0 16px;
    line-height: 32px;
    font-weight: 500;
    color: var(--color-text);
    outline: none;
    cursor: pointer;
  }

  & > ul {
    &.compact {
      text-transform: capitalize;

      ul {
        right: -1px;
        left: -1px;

        li {
          width: 100%;
          max-width: 100%;
        }
      }
    }

    & > li {
      position: relative;
      border: 1px solid transparent;
      transition: border 0.1s;
      z-index: 101;

      &:hover {
        border-color: var(--color-border);
      }

      &.active {
        border-color: var(--color-border);

        ul {
          opacity: 1;
          pointer-events: all;
        }
      }

      ul {
        position: absolute;
        top: 100%;
        left: -1px;
        border: 1px solid var(--color-border);
        background-color: var(--color-background);
        opacity: 0;
        transition: opacity 0.1s;
        pointer-events: none;

        li {
          width: 100vw;
          max-width: 240px;

          &:first-child {
            padding-top: 8px;
          }

          &:last-child {
            padding-bottom: 8px;
          }

          &:hover {
            span {
              border-color: var(--color-text);
            }
          }

          span {
            border-bottom: 1px solid transparent;
            transition: border 0.1s;
          }
        }
      }
    }
  }

  @media (max-width: 768px) {
    & > ul {
      & > li {
        ul {
          right: -1px;
          left: auto;
        }
      }
    }
  }
}
</style>
