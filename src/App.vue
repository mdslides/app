<script setup lang="ts">
import {
  useLanguageInitialize,
  useLanguagePreserve,
} from '@/functions/language'
import { RootView } from '@/views'

useLanguagePreserve()
useLanguageInitialize()
</script>

<template>
  <RootView />
</template>

<style lang="scss">
@import '@fontsource/mulish/400.css';
@import '@fontsource/mulish/500.css';
@import '@fontsource/mulish/700.css';

@import 'styles/theme';
@import 'styles/codeMirror';
@import 'styles/slideTypography';

::selection {
  background-color: var(--color-selection);
}

* {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  overflow: hidden;
}

body {
  margin: 0;
  padding: 0;
  background-color: var(--color-background);
  line-height: 1;
  color: var(--color-text);
}

#app {
  font-family: Mulish, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
