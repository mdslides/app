<template>
  <div class="home-view">
    <div class="home-view__header">
      <AppLogo />
    </div>

    <div class="home-view__split">
      <MarkdownEditor v-model="content" />

      <SlidesPreview :value="content" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import AppLogo from '../components/AppLogo.vue'
import MarkdownEditor from '../components/MarkdownEditor.vue'
import SlidesPreview from '../components/SlidesPreview.vue'

export default defineComponent({
  components: {
    AppLogo,
    MarkdownEditor,
    SlidesPreview,
  },
  setup() {
    const content = ref('')

    return {
      content,
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
    padding: 16px;
  }

  &__split {
    display: flex;
    height: calc(100vh - 80px);
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
