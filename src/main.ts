import { createApp } from 'vue'

import '@fontsource/mulish/400.css'
import '@fontsource/mulish/500.css'
import '@fontsource/mulish/700.css'

import './registerServiceWorker'

import App from './App.vue'
import i18n from './i18n'

createApp(App).use(i18n).mount('#app')
