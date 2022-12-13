<template>
  <HomeView />
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'

import HomeView from './views/HomeView.vue'

export default defineComponent({
  components: {
    HomeView,
  },
  setup() {
    const { fallbackLocale, locale } = useI18n()

    const searchParams = new URLSearchParams(window.location.search)
    if (searchParams.has('lang')) {
      locale.value = searchParams.get('lang') ?? fallbackLocale.value.toString()
      window.history.pushState(undefined, '', window.location.pathname)
    }
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
