import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const currentDir = dirname(fileURLToPath(import.meta.url))

export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    'dayjs-nuxt'
  ],
  $meta: {
    name: 'base'
  },

  components: [{ path: 'components', pathPrefix: true, prefix: 'Base' }],

  imports: {
    dirs: ['utils']
  },

  css: [join(currentDir, 'app/assets/css/main.css')],

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
