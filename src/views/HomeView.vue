<template>
  <div class="home-view">
    <MarkdownEditor v-model="content" />

    <SlidesPreview :value="content" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'

import MarkdownEditor from '../components/MarkdownEditor.vue'
import SlidesPreview from '../components/SlidesPreview.vue'

export default defineComponent({
  components: {
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
  margin: 0 auto;
  max-width: 1200px;
  height: 100vh;

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

  @media (min-width: 1200px) {
    border-right: 1px solid var(--color-border);
    border-left: 1px solid var(--color-border);
  }

  @media (max-width: 768px) {
    flex-direction: column-reverse;
    height: auto;

    & > * {
      &:first-child {
        border-top: 1px solid var(--color-border);
        border-right: none;
      }
    }
  }
}
</style>
