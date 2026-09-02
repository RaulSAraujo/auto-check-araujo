<script setup lang="ts">
defineOptions({ name: 'BasePageHeader' })

withDefaults(defineProps<{
  title: string
  description?: string
}>(), {
  description: undefined
})
</script>

<template>
  <header class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <h1 class="text-xl font-semibold tracking-tight text-highlighted text-balance sm:text-2xl">
        {{ title }}
      </h1>
      <p
        v-if="description"
        class="mt-1 text-sm text-muted text-pretty"
      >
        {{ description }}
      </p>
      <div
        v-if="$slots.below"
        class="mt-2"
      >
        <slot name="below" />
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-wrap items-center gap-2 sm:justify-end"
    >
      <slot name="actions" />
    </div>
  </header>
</template>
