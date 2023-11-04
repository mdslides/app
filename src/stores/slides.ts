import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSlidesStore = defineStore('slides', () => {
  const isPlaying = ref(false)

  const addListeners = () => {
    document.body.addEventListener('click', stopByClick)
    document.body.addEventListener('keydown', stopByEscape)
  }

  const removeListeners = () => {
    document.body.removeEventListener('click', stopByClick)
    document.body.removeEventListener('keydown', stopByEscape)
  }

  const play = () => {
    if (!isPlaying.value) {
      setTimeout(addListeners)
    } else {
      removeListeners()
    }
    isPlaying.value = !isPlaying.value
  }

  const stopByClick = () => {
    removeListeners()
    isPlaying.value = false
  }

  const stopByEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      removeListeners()
      isPlaying.value = false
    }
  }

  return {
    isPlaying,
    play,
  }
})
