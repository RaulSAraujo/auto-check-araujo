<script setup lang="ts">
defineOptions({ name: 'BasePanel' })

defineProps<{
  title?: string
}>()
</script>

<template>
  <section class="overflow-hidden rounded-md border border-default bg-elevated/25">
    <div
      v-if="title || $slots.header"
      class="border-b border-default px-4 py-3"
    >
      <slot name="header">
        <h2
          v-if="title"
          class="font-semibold text-highlighted"
        >
          {{ title }}
        </h2>
      </slot>
    </div>

    <div class="px-4 py-4">
      <slot />
    </div>
  </section>
</template>
