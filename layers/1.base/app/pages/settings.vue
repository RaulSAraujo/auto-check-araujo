<script setup lang="ts">
import {
  SETTINGS_HUB_ITEMS,
  SETTINGS_HUB_SECTION_LABEL,
  SETTINGS_HUB_SECTIONS
} from '../utils/settings-hub'

defineOptions({ name: 'SettingsHubPage' })

definePageMeta({
  path: '/ajustes'
})

useSeoMeta({
  title: 'Ajustes',
  description: 'Configuração da oficina.'
})

const { can } = usePermissions()

const visibleItems = computed(() =>
  SETTINGS_HUB_ITEMS.filter(item => !item.permission || can(item.permission))
)

const sections = computed(() =>
  SETTINGS_HUB_SECTIONS
    .map(section => ({
      id: section,
      label: SETTINGS_HUB_SECTION_LABEL[section],
      items: visibleItems.value.filter(item => item.section === section)
    }))
    .filter(section => section.items.length > 0)
)
</script>

<template>
  <UDashboardPanel>
    <template #body>
      <div class="bg-muted p-4 sm:p-5">
        <div class="mx-auto w-full max-w-3xl space-y-6">
          <BasePageHeader
            title="Ajustes"
            description="Equipe, catálogo e parâmetros."
          />

          <BaseEmptyState
            v-if="!sections.length"
            icon="i-lucide-settings"
          >
            Nenhuma opção disponível para o seu papel.
          </BaseEmptyState>

          <section
            v-for="section in sections"
            :key="section.id"
            class="space-y-3"
          >
            <h2 class="text-xs font-semibold uppercase tracking-wide text-muted">
              {{ section.label }}
            </h2>

            <ul class="grid gap-2 sm:grid-cols-2">
              <li
                v-for="item in section.items"
                :key="item.id"
              >
                <NuxtLink
                  :to="item.to"
                  class="group flex items-start gap-3 rounded-lg border border-default bg-default/60 px-3.5 py-3 transition-colors hover:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span
                    class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-elevated text-highlighted"
                  >
                    <UIcon
                      :name="item.icon"
                      class="size-5"
                    />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="flex items-center justify-between gap-2">
                      <span class="font-medium text-highlighted">
                        {{ item.label }}
                      </span>
                      <UIcon
                        name="i-lucide-chevron-right"
                        class="size-4 shrink-0 text-dimmed transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                    <span class="mt-0.5 block text-sm text-muted text-pretty">
                      {{ item.description }}
                    </span>
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
