<template>
  <div>
    <MarkdownEditor />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import MarkdownEditor from '../components/MarkdownEditor.vue'

export default defineComponent({
  components: {
    MarkdownEditor,
  },
})
</script>
