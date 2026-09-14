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
const mobileMenuOpen = ref(false)

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
const mobilePrimaryLinks = computed(() => links.value.slice(0, 4))
const mobileMoreLinks = computed(() => links.value.slice(4))

function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

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
      onSelect: toggleTheme
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
    'max-sm:size-10 max-sm:justify-center max-sm:p-0 sm:px-2.5 sm:py-1.5 rounded-full gap-1.5',
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

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-50 hidden justify-center px-3 py-4 sm:flex">
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

  <nav
    class="fixed inset-x-0 bottom-0 z-50 border-t border-default bg-default/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgb(0_0_0_/_0.08)] backdrop-blur sm:hidden dark:shadow-none"
    aria-label="Navegação principal"
  >
    <div class="mx-auto grid max-w-lg grid-cols-5">
      <NuxtLink
        v-for="link in mobilePrimaryLinks"
        :key="link.label"
        :to="link.to"
        class="flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-medium text-muted transition-colors active:bg-elevated"
        :class="link.active ? 'text-primary' : ''"
        :aria-current="link.active ? 'page' : undefined"
        @click="prefetchAppRouteFromEvent"
      >
        <UIcon
          :name="link.icon"
          class="size-5"
        />
        <span>{{ link.label }}</span>
      </NuxtLink>

      <button
        type="button"
        class="flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-medium active:bg-elevated"
        :class="mobileMenuOpen || mobileMoreLinks.some(link => link.active) || settingsActive ? 'text-primary' : 'text-muted'"
        :aria-expanded="mobileMenuOpen"
        aria-controls="mobile-navigation-menu"
        @click="mobileMenuOpen = true"
      >
        <UIcon
          name="i-lucide-menu"
          class="size-5"
        />
        <span>Mais</span>
      </button>
    </div>
  </nav>

  <UDrawer
    v-model:open="mobileMenuOpen"
    title="Mais opções"
    description="Acesse as demais áreas da oficina."
    close
    class="sm:hidden"
  >
    <template #body>
      <div
        id="mobile-navigation-menu"
        class="space-y-1"
      >
        <NuxtLink
          v-for="link in mobileMoreLinks"
          :key="link.label"
          :to="link.to"
          class="flex min-h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium text-highlighted active:bg-elevated"
          :class="link.active ? 'bg-primary/10 text-primary' : ''"
          :aria-current="link.active ? 'page' : undefined"
          @click="closeMobileMenu"
        >
          <UIcon
            :name="link.icon"
            class="size-5"
          />
          {{ link.label }}
        </NuxtLink>

        <USeparator class="my-2" />

        <UButton
          :to="APP_ROUTES.settings"
          color="neutral"
          variant="ghost"
          icon="i-lucide-settings"
          label="Configuração"
          class="min-h-12 w-full justify-start px-3"
          @click="closeMobileMenu"
        />
        <UButton
          color="neutral"
          variant="ghost"
          :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          :label="isDark ? 'Tema claro' : 'Tema escuro'"
          class="min-h-12 w-full justify-start px-3"
          @click="toggleTheme"
        />
        <UButton
          color="error"
          variant="ghost"
          icon="i-lucide-log-out"
          label="Sair"
          :loading="signingOut"
          class="min-h-12 w-full justify-start px-3"
          @click="onSignOut"
        />
      </div>
    </template>
  </UDrawer>
</template>
