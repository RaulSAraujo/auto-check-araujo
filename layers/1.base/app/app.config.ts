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
            link: 'before:bg-primary/10 text-primary font-semibold dark:before:bg-primary/15 dark:text-brand-300',
            linkLeadingIcon: 'text-primary dark:text-brand-300'
          }
        }
      ]
    },
    button: {
      defaultVariants: {
        color: 'primary'
      },
      // Nuxt UI solid buttons use text-inverted; in .dark that token is near-black,
      // so primary CTAs lose contrast. Force white label/icon on solid primary.
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: 'text-white'
        }
      ]
    },
    tabs: {
      // Same inverted-token issue as buttons: active pill uses text-inverted (near-black in dark).
      compoundVariants: [
        {
          color: 'primary',
          variant: 'pill',
          class: {
            trigger: 'data-[state=active]:text-white'
          }
        }
      ]
    },
    table: {
      slots: {
        root: 'relative overflow-x-auto touch-pan-x outline-primary/25 focus-visible:outline-3',
        th: 'px-3 py-3 text-xs uppercase tracking-wide text-muted sm:px-4 sm:py-3.5',
        td: 'p-3 text-sm text-muted whitespace-nowrap [&:has([role=checkbox])]:pe-0 sm:p-4'
      }
    }
  }
} as AppConfigInput)
