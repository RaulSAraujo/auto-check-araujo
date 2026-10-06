<script setup lang="ts">
import { pt_br } from '@nuxt/ui/locale'

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

const title = BRAND_DISPLAY_NAME
const description = 'Sistema interno da oficina: clientes, veículos e ordens de serviço.'
const ogImage = `${useRequestURL().origin}/og-image.jpg`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: 'summary_large_image',
  twitterImage: ogImage
})
</script>

<template>
  <UApp :locale="pt_br">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
