<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { COLABORADOR_PAPEL_LABEL } from '~~/shared/types/oficina'
import { isSettingsHubPath } from '../utils/settings-hub'

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
      to: APP_ROUTES.home,
      active: route.path === APP_ROUTES.home
    },
    {
      label: 'Agenda',
      to: APP_ROUTES.scheduling,
      active: pathMatches(APP_ROUTES.scheduling)
    },
    {
      label: 'Clientes',
      to: APP_ROUTES.customers,
      active: pathMatches(APP_ROUTES.customers)
    }
  ]

  if (can('finance.view')) {
    items.push({
      label: 'Financeiro',
      to: APP_ROUTES.finance,
      active: pathMatches(APP_ROUTES.finance)
    })
  }

  items.push(
    {
      label: 'Ordens',
      to: APP_ROUTES.orders,
      active: pathMatches(APP_ROUTES.orders)
    },
    {
      label: 'Veículos',
      to: APP_ROUTES.vehicles,
      active: pathMatches(APP_ROUTES.vehicles)
    }
  )

  return items
})

const settingsActive = computed(() => isSettingsHubPath(route.path))

const isDark = computed(() => colorMode.value === 'dark')

const userMenuItems = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: 'Ajustes',
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
  link: 'px-2.5 py-1.5 rounded-full',
  linkLeadingIcon: 'hidden',
  linkTrailingIcon: 'size-3.5 text-dimmed'
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
</script>

<template>
  <header class="sticky top-0 z-50 flex justify-center px-3 py-2 sm:py-4">
    <div
      class="flex w-full max-w-4xl items-center justify-between gap-1 rounded-full border border-default/60 bg-muted/80 px-1.5 py-1 shadow-lg shadow-neutral-950/10 backdrop-blur-md dark:border-accented/40 dark:shadow-none sm:w-auto"
    >
      <UNavigationMenu
        :items="links"
        variant="pill"
        color="primary"
        class="min-w-0 flex-1 overflow-x-auto sm:flex-none [&::-webkit-scrollbar]:hidden"
        :ui="navUi"
      />

      <USeparator
        orientation="vertical"
        class="mx-0.5 h-5"
      />

      <UDropdownMenu
        :items="userMenuItems"
        :content="{ align: 'end', sideOffset: 10 }"
      >
        <UButton
          color="neutral"
          :variant="settingsActive ? 'soft' : 'ghost'"
          class="rounded-full pe-2.5 ps-1.5"
          :aria-label="`Conta de ${profileNome || 'usuário'}`"
        >
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
        </UButton>
      </UDropdownMenu>
    </div>
  </header>
</template>
