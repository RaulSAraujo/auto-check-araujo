import type { AppConfigInput } from 'nuxt/schema'

export default defineAppConfig({
  ui: {
    colors: {
      primary: 'brand',
      secondary: 'accent',
      neutral: 'workshop',
      info: 'brand',
      success: 'ok',
      warning: 'caution',
      error: 'red'
    },
    dashboardSidebar: {
      slots: {
        root: 'bg-default'
      }
    },
    dashboardPanel: {
      slots: {
        body: 'bg-muted'
      }
    },
    navigationMenu: {
      compoundVariants: [
        {
          active: true,
          variant: 'pill',
          class: {
            link: 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-brand-300',
            linkLeadingIcon: 'text-primary dark:text-brand-300'
          }
        }
      ]
    },
    button: {
      defaultVariants: {
        color: 'primary'
      }
    },
    table: {
      slots: {
        th: 'text-xs uppercase tracking-wide text-muted'
      }
    }
  }
} as AppConfigInput)
