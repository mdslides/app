<template>
  <div class="slides-preview">
    <div class="slides-preview__render">
      <template v-for="(slide, i) in slidesMarkup" :key="i">
        <div ref="slidesRendered" v-html="slide" />
      </template>
    </div>

    <div class="slides-preview__display">
      <template v-for="(slide, i) in slidesSvg" :key="i">
        <img :src="slide" class="slides-preview__slide" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, ref, watch } from 'vue'
import { marked } from 'marked'
import { sanitize } from 'dompurify'
import { toSvg } from 'html-to-image'
import { throttle } from 'lodash'

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
    const slidesRendered = ref<HTMLDivElement[]>()
    const slidesSvg = ref<string[]>()

    const createSlidesSvg = throttle(() => {
      nextTick(async () => {
        slidesSvg.value = slidesRendered.value?.length
          ? await Promise.all(slidesRendered.value.map((item) => toSvg(item)))
          : []
      })
    }, 200)

    const slidesMarkup = computed(() => {
      return sanitize(marked(props.value, markedOptions))
        .split(/\n(?=<h[12])/)
        .filter(Boolean)
    })

    watch(() => props.value, createSlidesSvg)

    onMounted(() => {
      createSlidesSvg()
    })

    return {
      slidesMarkup,
      slidesRendered,
      slidesSvg,
    }
  },
})
</script>

<style lang="scss" scoped>
.slides-preview {
  overflow: auto;

  &__render {
    position: fixed;
    top: 200vh;
    left: 200vw;
    z-index: -100;

    & > * {
      padding: 20px;
      width: 400px;
      height: 300px;
      background-color: gold;
      overflow: hidden;
    }
  }

  &__display {
    padding: 16px;

    img {
      display: block;
      max-width: 100%;

      & + img {
        margin-top: 16px;
      }
    }
  }
}
</style>
