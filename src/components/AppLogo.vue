<template>
  <div class="app-logo">
    <div class="app-logo__icon">
      <span>md</span>
    </div>

    <div class="app-logo__text">slides</div>
  </div>
</template>

<style lang="scss" scoped>
.app-logo {
  display: flex;
  user-select: none;

  &__icon {
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    padding: 0.5rem;
    width: 4rem;
    height: 3rem;
    background-color: var(--color-text);
    font-size: 1rem;
    font-weight: 800;
    color: var(--color-background);
  }

  &__text {
    margin-left: 0.5rem;
    line-height: 3rem;
    font-size: 2rem;
    font-weight: 500;
  }
}
</style>
