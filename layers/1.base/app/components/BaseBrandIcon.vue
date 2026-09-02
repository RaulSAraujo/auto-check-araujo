<script setup lang="ts">
defineOptions({ name: 'BaseBrandIcon' })

const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
}>(), {
  size: 'md'
})

const sizeClass = computed(() => {
  switch (props.size) {
    case 'sm': return 'size-9'
    case 'lg': return 'size-14'
    default: return 'size-10'
  }
})
</script>

<template>
  <img
    :src="BRAND.brandIconSrc"
    :alt="BRAND.logoAlt"
    :class="[sizeClass, 'shrink-0 object-contain']"
  >
</template>
