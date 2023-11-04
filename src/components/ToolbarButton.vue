<script setup lang="ts">
const props = defineProps<{
  active?: boolean
}>()
</script>

<template>
  <button class="toolbar-button" :class="{ active: props.active }" />
</template>

<style lang="scss">
.toolbar-button {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px;
  border: 1px solid transparent;
  border-radius: 50%;
  background-color: transparent;
  color: var(--color-text);
  transition: border 0.1s;
  cursor: pointer;

  &:disabled {
    cursor: default;
    pointer-events: none;

    svg {
      fill: var(--color-border);
    }
  }

  &:not(:disabled) {
    &:hover {
      border-color: var(--color-border);
    }

    &.active {
      border-color: var(--color-text);
    }
  }

  svg {
    width: 22px;
    height: 22px;
    fill: var(--color-text);
  }
}
</style>
