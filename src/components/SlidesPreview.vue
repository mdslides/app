<template>
  <div class="slides-preview">
    <div class="slides-preview__render">
      <template v-if="slidesMarkup.length">
        <template v-for="(slide, i) in slidesMarkup" :key="i">
          <div ref="slidesRendered" v-html="slide" />
        </template>
      </template>
    </div>

    <div class="slides-preview__display">
      <template v-for="(slide, i) in slidesSvg" :key="i">
        <img :src="slide" />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, ref, watch } from 'vue'
import { throttle } from 'lodash'
import { marked } from 'marked'
import { sanitize } from 'dompurify'
import { toCanvas, toSvg } from 'html-to-image'

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
  emits: ['render'],
  setup(props, { emit }) {
    const slidesRendered = ref<HTMLDivElement[]>([])
    const slidesSvg = ref<string[]>([])

    const createSlidesSvg = throttle(() => {
      nextTick(async () => {
        const svgs = slidesRendered.value.map((item) => toSvg(item))
        slidesSvg.value = await Promise.all(svgs)

        const canvases = slidesRendered.value.map((item) => toCanvas(item))
        emit('render', await Promise.all(canvases))
      })
    }, 200)

    const slidesMarkup = computed(() => {
      return sanitize(marked(props.value, markedOptions)).split(/\n(?=<h[12])/)
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
  &__render {
    position: fixed;
    top: 200vh;
    left: 200vw;
    color: #000;
    z-index: -100;

    & > * {
      padding: 20px;
      width: 400px;
      height: 300px;
      background-color: #fff;
      overflow: hidden;
    }
  }

  &__display {
    padding: 16px;
    height: 100%;
    overflow: auto;

    img {
      display: block;
      width: 100%;
      border: 1px solid var(--color-border);
      border-radius: 1px;

      & + img {
        margin-top: 16px;
      }
    }

    @media (max-width: 768px) {
      display: flex;
      padding-right: 0;
      padding-left: 0;

      &::before,
      &::after {
        content: '';
        flex: 0 0 16px;
      }

      img {
        width: auto;
        height: 100%;

        & + img {
          margin-top: 0;
          margin-left: 16px;
        }
      }
    }

    @media (prefers-color-scheme: dark) {
      img {
        border: none;
      }
    }
  }
}
</style>
