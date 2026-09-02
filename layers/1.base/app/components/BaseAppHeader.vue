<script setup lang="ts">
import type { DropdownMenuItem, NavigationMenuItem } from '@nuxt/ui'
import { COLABORADOR_PAPEL_LABEL } from '~~/shared/types/oficina'

defineOptions({ name: 'BaseAppHeader' })

const route = useRoute()
const { signOut } = useAuth()
const { nome: profileNome } = useColaboradorNome()
const { papel, can } = usePermissions()
const signingOut = ref(false)
const mobileOpen = ref(false)

watch(() => route.fullPath, () => {
  mobileOpen.value = false
})

function pathMatches(to: string) {
  return route.path === to || route.path.startsWith(`${to}/`)
}

function childrenActive(children?: NavigationMenuItem[]) {
  return children?.some(child => typeof child.to === 'string' && pathMatches(child.to)) ?? false
}

const links = computed<NavigationMenuItem[]>(() => {
  const operacaoChildren: NavigationMenuItem[] = [
    { label: 'Ordens', to: APP_ROUTES.orders, icon: 'i-lucide-clipboard-list' },
    { label: 'Kanban', to: APP_ROUTES.kanban, icon: 'i-lucide-columns-3' },
    { label: 'Agenda', to: APP_ROUTES.scheduling, icon: 'i-lucide-calendar-days' }
  ]

  const cadastrosChildren: NavigationMenuItem[] = [
    { label: 'Clientes', to: APP_ROUTES.customers, icon: 'i-lucide-users' },
    { label: 'Veículos', to: APP_ROUTES.vehicles, icon: 'i-lucide-car' }
  ]

  const items: NavigationMenuItem[] = [
    {
      label: 'Início',
      to: APP_ROUTES.home,
      active: route.path === APP_ROUTES.home
    },
    {
      label: 'Operação',
      active: childrenActive(operacaoChildren),
      children: operacaoChildren
    },
    {
      label: 'Cadastros',
      active: childrenActive(cadastrosChildren),
      children: cadastrosChildren
    }
  ]

  const management: NavigationMenuItem[] = []

  if (can('finance.view')) {
    management.push(
      { label: 'Vendas', to: APP_ROUTES.sales, icon: 'i-lucide-trending-up' },
      { label: 'Financeiro', to: APP_ROUTES.finance, icon: 'i-lucide-wallet' }
    )
  }

  if (can('catalog.manage')) {
    management.push(
      { label: 'Catálogo', to: APP_ROUTES.catalog, icon: 'i-lucide-package' },
      { label: 'Precificação', to: APP_ROUTES.pricing, icon: 'i-lucide-calculator' }
    )
  }

  if (can('collaborators.manage')) {
    management.push({
      label: 'Equipe',
      to: APP_ROUTES.team,
      icon: 'i-lucide-user-cog'
    })
  }

  if (management.length) {
    items.push({
      label: 'Gestão',
      active: childrenActive(management),
      children: management
    })
  }

  return items
})

const userMenuItems = computed<DropdownMenuItem[]>(() => [
  {
    label: 'Sair',
    icon: 'i-lucide-log-out',
    onSelect: () => {
      void onSignOut()
    }
  }
])

const navUi = {
  item: 'py-0',
  link: 'px-2.5 py-1.5 rounded-full',
  linkLeadingIcon: 'hidden',
  linkTrailingIcon: 'size-3.5 text-dimmed',
  viewportWrapper: 'pt-3',
  viewport: 'bg-muted/80 backdrop-blur-md border border-default/60 dark:border-accented/40 shadow-lg shadow-neutral-950/10 dark:shadow-none ring-0 rounded-xl'
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
    <!-- Desktop floating pill -->
    <div
      class="hidden items-center gap-1 rounded-full border border-default/60 bg-muted/80 px-1.5 py-1 shadow-lg shadow-neutral-950/10 backdrop-blur-md dark:border-accented/40 dark:shadow-none lg:flex"
    >
      <UNavigationMenu
        :items="links"
        variant="pill"
        color="primary"
        content-orientation="vertical"
        :ui="navUi"
      />

      <USeparator
        orientation="vertical"
        class="mx-0.5 h-5"
      />

      <UColorModeButton
        color="neutral"
        variant="ghost"
        size="sm"
        class="rounded-full"
      />

      <UDropdownMenu
        :items="userMenuItems"
        :content="{ align: 'end', sideOffset: 10 }"
      >
        <UButton
          color="neutral"
          variant="ghost"
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
            :ui="{
              root: 'gap-2',
              name: 'text-xs font-semibold truncate max-w-28 leading-tight',
              description: 'text-[0.625rem] text-muted truncate max-w-28 leading-tight'
            }"
          />
        </UButton>
      </UDropdownMenu>
    </div>

    <!-- Mobile bar -->
    <div
      class="flex w-full max-w-lg items-center justify-between gap-2 rounded-full border border-default/60 bg-muted/80 px-2 py-1.5 shadow-lg shadow-neutral-950/10 backdrop-blur-md dark:border-accented/40 dark:shadow-none lg:hidden"
    >
      <USlideover
        v-model:open="mobileOpen"
        title="Menu"
        side="left"
        :ui="{ content: 'max-w-xs' }"
      >
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-menu"
          size="sm"
          square
          class="rounded-full"
          aria-label="Abrir menu"
        />

        <template #body>
          <UNavigationMenu
            :items="links"
            orientation="vertical"
            variant="pill"
            color="primary"
            class="w-full"
          />
        </template>
      </USlideover>

      <div class="flex items-center gap-0.5">
        <UColorModeButton
          color="neutral"
          variant="ghost"
          size="sm"
          class="rounded-full"
        />

        <UDropdownMenu
          :items="userMenuItems"
          :content="{ align: 'end', sideOffset: 8 }"
        >
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full p-1"
            :aria-label="`Conta de ${profileNome || 'usuário'}`"
          >
            <UAvatar
              :alt="profileNome || 'Usuário'"
              size="xs"
              :text="profileNome?.charAt(0)?.toUpperCase() || 'A'"
            />
          </UButton>
        </UDropdownMenu>
      </div>
    </div>
  </header>
</template>
