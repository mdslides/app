<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { marked } from 'marked'
import sanitizeHtml from 'sanitize-html'

import playArrowIcon from '@material-design-icons/svg/sharp/play_arrow.svg?raw'

import { PREVIEW_CONTAINER_ID } from '@/constants'
import { useSlidesStore } from '@/stores/slides'
import { ToolbarButton } from '@/components'

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

const { t } = useI18n()
const slidesStore = useSlidesStore()

const slidesMarkup = computed(() => {
  return sanitizeHtml(
    marked.parse(props.value, markedOptions),
    sanitizeHtmlOptions
  ).split(/\n(?=<h[12])/)
})
</script>

<template>
  <div class="slides-preview">
    <div class="slides-preview__toolbar">
      <span>{{ t('preview') }}</span>

      <ToolbarButton @click="slidesStore.play" v-html="playArrowIcon" />
    </div>

    <div
      :id="PREVIEW_CONTAINER_ID"
      class="slides-preview__content"
      :class="{
        'slides-preview__content--full': slidesStore.isPlaying,
      }"
    >
      <template v-for="(slide, i) in slidesMarkup" :key="i">
        <div class="slides-preview__slide slide-typography" v-html="slide" />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use 'sass:math';

@import '@/styles/variables';
@import '@/styles/mixins';

$slideRatioW: 4;
$slideRatioH: 3;
$slideRatio: math.div($slideRatioW, $slideRatioH);
$slideSize: 0.25;
$slideFont: 0.009;

.slides-preview {
  $self: &;

  &__toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    line-height: 32px;
    border-bottom: 1px solid var(--color-border);
    font-weight: 600;
    user-select: none;
  }

  &__content {
    padding: 16px;
    height: calc(100% - 65px);
    overflow: auto;

    &--full {
      display: block !important;
      position: fixed;
      top: 0;
      left: 0;
      padding: 0;
      width: 100vw;
      height: 100vh;
      background-color: #000;
      z-index: 1000;

      #{$self}__slide {
        margin: 0 auto !important;
        width: 100vw !important;
        height: math.div(100vw, $slideRatio) !important;
        box-shadow: 0 0 0 1px #ddd;
        font-size: math.div(100vw * $slideFont, $slideSize) !important;

        @media (min-aspect-ratio: (#{$slideRatioW} / #{$slideRatioH})) {
          width: 100vh * $slideRatio !important;
          height: 100vh !important;
          font-size: 100vh * $slideFont * math.div($slideRatio, $slideSize) !important;
        }
      }
    }
  }

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
    &__content {
      display: flex;
      padding-right: 0;
      padding-left: 0;

      &::before,
      &::after {
        content: '';
        flex: 0 0 16px;
      }

      #{$self}__slide {
        flex: 0 0 (100vh * $slideSize * $slideRatio);
        height: 100vh * $slideSize;
        font-size: 100vh * $slideFont * $slideRatio;

        & + * {
          margin-top: 0;
          margin-left: 16px;
        }
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
