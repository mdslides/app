<template>
  <div :id="containerId" class="slides-preview">
    <template v-for="(slide, i) in slidesMarkup" :key="i">
      <div class="slides-preview__slide slide-typography" v-html="slide" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

import { previewContainerId } from '@/constants'

const markedOptions: marked.MarkedOptions = {
  breaks: true,
  gfm: true,
}

const sanitizeHtmlOptions = {
  allowedSchemes: sanitizeHtml.defaults.allowedSchemes.concat(['data']),
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
}

const props = defineProps<{
  value: string
}>()

const containerId = ref(previewContainerId)

const slidesMarkup = computed(() => {
  return sanitizeHtml(
    marked.parse(props.value, markedOptions),
    sanitizeHtmlOptions
  ).split(/\n(?=<h[12])/)
})
</script>

<style lang="scss" scoped>
@use 'sass:math';

@import '@/styles/variables';
@import '@/styles/mixins';

$slideRatio: math.div(4, 3);
$slideSize: 0.25;
$slideFont: 0.009;

.slides-preview {
  padding: 16px;
  height: 100%;
  overflow: auto;

  &__slide {
    width: 100vw * $slideSize;
    height: math.div(100vw * $slideSize, $slideRatio);
    box-shadow: 0 0 0 1px var(--color-border);
    font-size: 100vw * $slideFont;
    overflow: hidden;

    & + * {
      margin-top: 16px;
    }
  }

  @include media-breakpoint-up($lg) {
    &__slide {
      width: $lg * $slideSize;
      height: math.div($lg * $slideSize, $slideRatio);
      font-size: $lg * $slideFont;
    }
  }

  @include media-breakpoint-down($sm) {
    display: flex;
    padding-right: 0;
    padding-left: 0;

    &::before,
    &::after {
      content: '';
      flex: 0 0 16px;
    }

    &__slide {
      flex: 0 0 (100vh * $slideSize * $slideRatio);
      height: 100vh * $slideSize;
      font-size: 100vh * $slideFont * $slideRatio;

      & + * {
        margin-top: 0;
        margin-left: 16px;
      }
    }
  }

  @include color-scheme-dark {
    &__slide {
      box-shadow: none;
    }
  }
}
</style>
