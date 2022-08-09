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
  height: 100vh;

  & > * {
    flex: 1 0;

    &:first-child {
      flex-basis: 70%;
      border-right: 1px solid #ddd;
    }

    &:last-child {
      flex-basis: 30%;
    }
  }
}
</style>
