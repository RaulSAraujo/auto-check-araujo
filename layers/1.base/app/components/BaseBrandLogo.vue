<script setup lang="ts">
defineOptions({ name: 'BaseBrandLogo' })

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  variant?: 'full' | 'icon'
}>(), {
  size: 'md',
  showName: false,
  variant: 'full'
})

const isIcon = computed(() => props.variant === 'icon')

const heightClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'h-8'
    case 'lg': return 'h-14 sm:h-16'
    default: return 'h-10'
  }
})
</script>

<template>
  <div class="flex items-center gap-2.5 min-w-0">
    <BaseBrandIcon
      v-if="isIcon"
      :size="size"
    />
    <img
      v-else
      :src="BRAND.logoSrc"
      :alt="BRAND.logoAlt"
      :class="[
        heightClass,
        'w-auto max-w-full object-contain shrink-0'
      ]"
    >
    <div
      v-if="showName"
      class="min-w-0"
    >
      <p class="font-semibold text-highlighted truncate leading-tight">
        {{ BRAND.businessName }}
      </p>
      <p class="text-xs text-muted truncate">
        {{ BRAND.location }}
      </p>
    </div>
  </div>
</template>
