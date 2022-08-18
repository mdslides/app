<template>
  <nav class="navigation-bar">
    <ul class="navigation-bar__group">
      <li
        role="button"
        :class="{ active: activeGroup === 'file' }"
        @click="handleGroupClick('file')"
      >
        {{ t('file') }}

        <ul class="navigation-bar__list">
          <li role="button">
            <span>{{ t('open') }}</span>
          </li>

          <li role="button">
            <span>{{ t('downloadAsMD') }}</span>
          </li>

          <li role="button">
            <span>{{ t('exportAsPDF') }}</span>
          </li>
        </ul>
      </li>
    </ul>
  </nav>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'

export default defineComponent({
  setup() {
    const { t } = useI18n()
    const activeGroup = ref<string | null>(null)

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
      handleGroupClick,
      t,
    }
  },
})
</script>

<i18n>
{
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

  &__group {
    display: flex;
    gap: 4px;

    & > * {
      position: relative;
      border: 1px solid transparent;
      transition: border 0.1s;
      z-index: 101;
      cursor: default;

      &:hover {
        border: 1px solid var(--color-border);
      }

      &.active {
        border-color: var(--color-border);

        ul {
          opacity: 1;
          pointer-events: all;
        }
      }
    }
  }

  &__list {
    position: absolute;
    top: 100%;
    left: -1px;
    border: 1px solid var(--color-border);
    background-color: var(--color-background);
    opacity: 0;
    transition: opacity 0.1s;
    pointer-events: none;

    & > * {
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

  @media (max-width: 768px) {
    ul {
      ul {
        right: -1px;
        left: auto;
      }
    }
  }
}
</style>
