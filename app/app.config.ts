import type { AppConfigInput } from 'nuxt/schema'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'green',
      neutral: 'slate'
    }
  }
} as AppConfigInput)
