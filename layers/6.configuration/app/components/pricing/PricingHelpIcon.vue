<script setup lang="ts">
defineOptions({ name: 'PricingHelpIcon' })

defineProps<{
  label: string
  text: string
}>()
</script>

<template>
  <UPopover :content="{ side: 'top', align: 'start', sideOffset: 6 }">
    <UButton
      type="button"
      icon="i-lucide-circle-help"
      color="neutral"
      variant="ghost"
      size="xs"
      square
      :aria-label="`Dúvida: ${label}`"
      class="text-muted hover:text-highlighted"
    />

    <template #content>
      <p class="max-w-56 p-3 text-sm text-muted">
        {{ text }}
      </p>
    </template>
  </UPopover>
</template>
