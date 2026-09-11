<script setup lang="ts">
import { SETTINGS_HUB_ITEMS } from '../utils/settings-hub'

defineOptions({ name: 'ConfigurationHubPage' })

definePageMeta({
  path: '/configuracao'
})

useSeoMeta({
  title: 'Configuração',
  description: 'Equipe, catálogo e parâmetros da oficina.'
})

const { can } = usePermissions()

const visibleItems = computed(() =>
  SETTINGS_HUB_ITEMS.filter(item => can(item.permission))
)

const countLabel = computed(() => {
  const n = visibleItems.value.length
  if (!n) return null
  return n === 1 ? '1 área' : `${n} áreas`
})
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-5">
        <div class="mx-auto w-full max-w-xl space-y-5 pb-2">
          <BasePageHeader
            title="Configuração"
            description="O que a oficina usa no dia a dia."
          >
            <template
              v-if="countLabel"
              #below
            >
              <p class="text-xs text-muted tabular-nums">
                {{ countLabel }}
              </p>
            </template>
          </BasePageHeader>

          <BaseEmptyState
            v-if="!visibleItems.length"
            icon="i-lucide-settings"
          >
            Nenhuma opção disponível para o seu papel.
          </BaseEmptyState>

          <nav
            v-else
            aria-label="Áreas de configuração"
          >
            <ul class="overflow-hidden rounded-lg border border-default bg-elevated/25 divide-y divide-default">
              <li
                v-for="item in visibleItems"
                :key="item.to"
              >
                <NuxtLink
                  :to="item.to"
                  class="group flex min-h-14 items-center gap-3 px-4 py-3.5 transition-[background-color,transform] duration-200 hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary active:scale-[0.99]"
                >
                  <span
                    class="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary transition-colors duration-200 group-hover:bg-primary/15"
                    aria-hidden="true"
                  >
                    <UIcon
                      :name="item.icon"
                      class="size-5"
                    />
                  </span>

                  <span class="min-w-0 flex-1">
                    <span class="block font-medium tracking-tight text-highlighted">
                      {{ item.label }}
                    </span>
                    <span class="mt-0.5 block text-sm text-muted text-pretty">
                      {{ item.description }}
                    </span>
                  </span>

                  <UIcon
                    name="i-lucide-chevron-right"
                    class="size-4 shrink-0 text-dimmed transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-muted"
                    aria-hidden="true"
                  />
                </NuxtLink>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
