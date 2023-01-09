<template>
  <div class="slides-preview">
    <template v-for="(slide, i) in slidesMarkup" :key="i">
      <div v-html="slide" class="slides-preview__slide" />
    </template>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { marked } from 'marked'
import { sanitize } from 'dompurify'

const markedOptions: marked.MarkedOptions = {
  breaks: true,
  gfm: true,
}

export default defineComponent({
  props: {
    value: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const slidesMarkup = computed(() => {
      return sanitize(marked(props.value, markedOptions)).split(/\n(?=<h[12])/)
    })

    return {
      slidesMarkup,
    }
  },
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables';
@import '@/styles/mixins';

$slideRatio: 4 / 3;
$slideSize: 0.25;
$slideFont: 0.009;

.slides-preview {
  padding: 16px;
  height: 100%;
  overflow: auto;

  &__slide {
    padding: 20px;
    width: 100vw * $slideSize;
    height: 100vw * $slideSize / $slideRatio;
    box-shadow: 0 0 0 1px var(--color-border);
    background-color: #fff;
    font-size: 100vw * $slideFont;
    color: #000;
    overflow: hidden;

    & + * {
      margin-top: 16px;
    }
  }

  @include media-breakpoint-up($lg) {
    &__slide {
      width: $lg * $slideSize;
      height: $lg * $slideSize / $slideRatio;
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
