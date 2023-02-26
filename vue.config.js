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
  pwa: {
    name: 'mdslides',
    themeColor: '#fff',
    msTileColor: '#fff',
    manifestOptions: {
      description: 'Markdown slides editor',
      display: 'standalone',
      background_color: '#fff',
      scope: process.env.PUBLIC_PATH,
      start_url: process.env.PUBLIC_PATH,
    },
    workboxPluginMode: 'GenerateSW',
  },
})
