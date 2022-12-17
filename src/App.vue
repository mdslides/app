<template>
  <HomeView />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import {
  useLanguageInitialize,
  useLanguagePreserve,
} from '@/functions/language'

import HomeView from './views/HomeView.vue'

export default defineComponent({
  components: {
    HomeView,
  },
  setup() {
    useLanguagePreserve()
    useLanguageInitialize()
  },
})
</script>

<style lang="scss">
@import '~@fortawesome/fontawesome-free/css/fontawesome.css';
@import '~@fortawesome/fontawesome-free/css/solid.css';
@import '~codemirror/lib/codemirror.css';
@import 'styles/theme';
@import 'styles/codeMirror';

* {
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--color-background);
  color: var(--color-text);
}

#app {
  font-family: Mulish, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
