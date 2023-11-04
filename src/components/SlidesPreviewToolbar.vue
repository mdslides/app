<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import playArrowIcon from '@material-design-icons/svg/sharp/play_arrow.svg?raw'

import { useSlidesStore } from '@/stores/slides'
import { ToolbarButton } from '@/components'

const { t } = useI18n()
const slidesStore = useSlidesStore()
</script>

<template>
  <div class="slides-preview-toolbar">
    <span>
      {{ t('preview') }}
    </span>

    <ToolbarButton @click="slidesStore.play" v-html="playArrowIcon" />
  </div>
</template>

<style lang="scss" scoped>
.slides-preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  line-height: 32px;
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
  user-select: none;
}
</style>
