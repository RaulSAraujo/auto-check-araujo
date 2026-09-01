<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { signOut } = useAuth()
const { nome: profileNome } = useColaboradorNome()

const items = computed<NavigationMenuItem[]>(() => [
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
    label: 'Clientes',
    icon: 'i-lucide-users',
    to: APP_ROUTES.customers
  },
  {
    label: 'Veículos',
    icon: 'i-lucide-car',
    to: APP_ROUTES.vehicles
  }
])
</script>

<template>
  <UDashboardGroup
    unit="rem"
    storage="local"
  >
    <UDashboardSidebar
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'border-t border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          :to="APP_ROUTES.home"
          class="flex items-center gap-2 min-w-0"
        >
          <UIcon
            name="i-lucide-wrench"
            class="size-5 text-primary shrink-0"
          />
          <span
            v-if="!collapsed"
            class="font-semibold text-highlighted truncate"
          >
            Auto Check Araujo
          </span>
        </NuxtLink>
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="items"
          orientation="vertical"
        />
      </template>

      <template #footer="{ collapsed }">
        <div class="flex flex-col gap-1 w-full">
          <div
            v-if="!collapsed"
            class="px-2 py-1 text-xs text-muted truncate"
          >
            {{ profileNome }}
          </div>
          <div class="flex items-center gap-1">
            <UColorModeButton />
            <UButton
              :label="collapsed ? undefined : 'Sair'"
              icon="i-lucide-log-out"
              color="neutral"
              variant="ghost"
              class="flex-1 justify-start"
              :block="collapsed"
              @click="signOut"
            />
          </div>
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
