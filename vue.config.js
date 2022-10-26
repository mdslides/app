const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  publicPath: process.env.PUBLIC_PATH,
  transpileDependencies: true,
  pluginOptions: {
    i18n: {
      locale: 'en',
      fallbackLocale: 'en',
      localeDir: 'i18n/locales',
      enableLegacy: false,
      runtimeOnly: false,
      compositionOnly: false,
      fullInstall: true,
    },
  },
})
