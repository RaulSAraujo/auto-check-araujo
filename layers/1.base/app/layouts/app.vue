<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { signOut } = useAuth()
const { nome: profileNome } = useColaboradorNome()
const { papel, can } = usePermissions()
const signingOut = ref(false)

async function onSignOut() {
  if (signingOut.value) return
  signingOut.value = true
  try {
    await signOut()
  } finally {
    signingOut.value = false
  }
}

const items = computed<NavigationMenuItem[]>(() => {
  const navigation: NavigationMenuItem[] = [
    {
      label: 'Início',
      icon: 'i-lucide-layout-dashboard',
      to: APP_ROUTES.home
    },
    {
      label: 'Ordens de serviço',
      icon: 'i-lucide-clipboard-list',
      to: APP_ROUTES.orders
    },
    {
      label: 'Kanban',
      icon: 'i-lucide-columns-3',
      to: APP_ROUTES.kanban
    },
    {
      label: 'Agendamentos',
      icon: 'i-lucide-calendar-days',
      to: APP_ROUTES.scheduling
    },
    {
      label: 'Clientes',
      icon: 'i-lucide-users',
      to: APP_ROUTES.customers
    },
    {
      label: 'Veículos',
      icon: 'i-lucide-car',
      to: APP_ROUTES.vehicles
    }
  ]

  if (can('finance.view')) {
    navigation.push({
      label: 'Vendas',
      icon: 'i-lucide-trending-up',
      to: APP_ROUTES.sales
    })
  }

  if (can('catalog.manage')) {
    navigation.push({
      label: 'Serviços e Peças',
      icon: 'i-lucide-package',
      to: APP_ROUTES.catalog
    })
    navigation.push({
      label: 'Precificação',
      icon: 'i-lucide-calculator',
      to: APP_ROUTES.pricing
    })
  }

  if (can('collaborators.manage')) {
    navigation.push({
      label: 'Equipe',
      icon: 'i-lucide-user-cog',
      to: APP_ROUTES.team
    })
  }

  return navigation
})
</script>

<template>
  <UDashboardGroup
    unit="rem"
    storage="local"
  >
    <UDashboardSidebar
      collapsible
      resizable
      class="bg-default"
      :ui="{
        root: 'border-e border-default',
        footer: 'border-t border-default gap-3'
      }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          :to="APP_ROUTES.home"
          class="min-w-0"
        >
          <BaseBrandLogo
            v-if="collapsed"
            variant="icon"
            size="sm"
          />
          <BaseBrandLogo
            v-else
            size="sm"
          />
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="items"
          orientation="vertical"
          highlight
          highlight-color="primary"
          :ui="{
            link: 'before:rounded-md',
            linkLeadingIcon: 'size-4.5'
          }"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex w-full flex-col gap-3">
          <UButton
            v-if="can('orders.create')"
            :to="APP_ROUTES.ordersNew"
            icon="i-lucide-plus"
            :label="collapsed ? undefined : 'Nova OS'"
            :block="collapsed"
            class="justify-center"
            :class="collapsed ? undefined : 'w-full'"
          />

          <div
            v-if="!collapsed"
            class="px-1 text-xs text-muted truncate"
          >
            {{ profileNome }}
            <span class="text-dimmed">· {{ COLABORADOR_PAPEL_LABEL[papel] }}</span>
          </div>

          <div class="flex items-center gap-1">
            <UColorModeButton />
            <UButton
              type="button"
              :label="collapsed ? undefined : 'Sair'"
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              class="flex-1 justify-start"
              :block="collapsed"
              :loading="signingOut"
              @click="onSignOut"
            />
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
