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
    padding: 8px;
    width: 64px;
    height: 48px;
    background-color: var(--color-text);
    font-size: 16px;
    font-weight: 900;
    color: var(--color-background);
  }

  &__text {
    margin-left: 6px;
    line-height: 48px;
    font-size: 32px;
    font-weight: 500;
  }
}
</style>
