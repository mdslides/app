<template>
  <HomeView />
</template>

<script lang="ts">
import { defineComponent } from 'vue'

import HomeView from './views/HomeView.vue'

export default defineComponent({
  components: {
    HomeView,
  },
})
</script>

<style lang="scss">
@import '~@fortawesome/fontawesome-free/css/fontawesome.css';
@import '~@fortawesome/fontawesome-free/css/solid.css';
@import '~codemirror/lib/codemirror.css';
@import 'styles/codeMirror';

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
