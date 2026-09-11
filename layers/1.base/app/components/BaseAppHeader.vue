<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { COLABORADOR_PAPEL_LABEL } from '~~/shared/types/oficina'
import { isSettingsHubPath } from '#layers/configuration/app/utils/settings-hub'

defineOptions({ name: 'BaseAppHeader' })

const route = useRoute()
const colorMode = useColorMode()
const { signOut } = useAuth()
const { nome: profileNome } = useColaboradorNome()
const { papel, can } = usePermissions()
const signingOut = ref(false)

function pathMatches(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

const links = computed<NavigationMenuItem[]>(() => {
  const items: NavigationMenuItem[] = [
    {
      label: 'Início',
      icon: 'i-lucide-house',
      to: APP_ROUTES.home,
      active: route.path === APP_ROUTES.home
    },
    {
      label: 'Agenda',
      icon: 'i-lucide-calendar-days',
      to: APP_ROUTES.scheduling,
      active: pathMatches(APP_ROUTES.scheduling)
    },
    {
      label: 'Ordens',
      icon: 'i-lucide-clipboard-list',
      to: APP_ROUTES.orders,
      active: pathMatches(APP_ROUTES.orders)
    },
    {
      label: 'Clientes',
      icon: 'i-lucide-users',
      to: APP_ROUTES.customers,
      active: pathMatches(APP_ROUTES.customers)
    },
    {
      label: 'Veículos',
      icon: 'i-lucide-car',
      to: APP_ROUTES.vehicles,
      active: pathMatches(APP_ROUTES.vehicles)
    }
  ]

  if (can('finance.view')) {
    items.push({
      label: 'Financeiro',
      icon: 'i-lucide-wallet',
      to: APP_ROUTES.finance,
      active: pathMatches(APP_ROUTES.finance)
    })
  }

  return items
})

const settingsActive = computed(() => isSettingsHubPath(route.path))

const isDark = computed(() => colorMode.value === 'dark')

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Configuração',
      icon: 'i-lucide-settings',
      to: APP_ROUTES.settings
    },
    {
      label: isDark.value ? 'Tema claro' : 'Tema escuro',
      icon: isDark.value ? 'i-lucide-sun' : 'i-lucide-moon',
      onSelect: () => {
        colorMode.preference = isDark.value ? 'light' : 'dark'
      }
    }
  ],
  [
    {
      label: 'Sair',
      icon: 'i-lucide-log-out',
      onSelect: () => {
        void onSignOut()
      }
    }
  ]
])

const navUi = {
  item: 'py-0',
  link: [
    'px-2 py-1.5 sm:px-2.5 rounded-full gap-1.5',
    'aria-[current=page]:font-semibold aria-[current=page]:text-primary',
    'aria-[current=page]:before:bg-primary/15'
  ].join(' '),
  linkLeadingIcon: 'size-4 shrink-0 sm:hidden',
  linkLabel: 'max-sm:sr-only',
  linkTrailingIcon: 'hidden'
} as const

async function onSignOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await signOut()
  } finally {
    signingOut.value = false
  }
}

function onUserMenuOpen(open: boolean) {
  if (open) prefetchAppRoute(APP_ROUTES.settings)
}
</script>

<template>
  <header class="sticky top-0 z-50 flex justify-center px-3 py-2 sm:py-4">
    <div
      class="flex w-full max-w-4xl items-center gap-1 rounded-full border border-default/60 bg-muted/80 px-1.5 py-1 shadow-lg shadow-neutral-950/10 backdrop-blur-md dark:border-accented/40 dark:shadow-none sm:w-auto"
    >
      <UNavigationMenu
        :items="links"
        variant="pill"
        color="primary"
        highlight
        highlight-color="primary"
        class="min-w-0 flex-1 sm:flex-none"
        :ui="navUi"
        @pointerover="prefetchAppRouteFromEvent"
        @focusin="prefetchAppRouteFromEvent"
      />

      <USeparator
        orientation="vertical"
        class="mx-0.5 h-5 shrink-0"
      />

      <UDropdownMenu
        :items="userMenuItems"
        :content="{ align: 'end', sideOffset: 10 }"
        @update:open="onUserMenuOpen"
      >
        <UButton
          color="neutral"
          :variant="settingsActive ? 'soft' : 'ghost'"
          class="shrink-0 rounded-full pe-2 ps-1.5"
          :aria-label="`Conta de ${profileNome || 'usuário'}`"
          :aria-haspopup="true"
        >
          <span class="flex items-center gap-1.5">
            <UUser
              :name="profileNome || 'Usuário'"
              :description="COLABORADOR_PAPEL_LABEL[papel]"
              :avatar="{
                alt: profileNome || 'Usuário',
                text: profileNome?.charAt(0)?.toUpperCase() || 'A',
                size: '2xs'
              }"
              size="sm"
              class="hidden sm:flex"
              :ui="{
                root: 'gap-2',
                name: 'text-xs font-semibold truncate max-w-28 leading-tight',
                description: 'text-[0.625rem] text-muted truncate max-w-28 leading-tight'
              }"
            />
            <UAvatar
              class="sm:hidden"
              :alt="profileNome || 'Usuário'"
              size="xs"
              :text="profileNome?.charAt(0)?.toUpperCase() || 'A'"
            />
            <UIcon
              name="i-lucide-chevron-down"
              class="size-3.5 shrink-0 text-dimmed"
            />
          </span>
        </UButton>
      </UDropdownMenu>
    </div>
  </header>
</template>
