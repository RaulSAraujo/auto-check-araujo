<script setup lang="ts">
defineOptions({ name: 'BaseEmptyState' })

withDefaults(defineProps<{
  icon?: string
}>(), {
  icon: undefined
})
</script>

<template>
  <div class="rounded-md border border-dashed border-default px-4 py-6 text-center">
    <UIcon
      v-if="icon"
      :name="icon"
      class="mx-auto mb-2 size-6 text-muted"
    />
    <p class="text-sm text-muted">
      <slot />
    </p>
    <div
      v-if="$slots.actions"
      class="mt-3 flex justify-center"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
