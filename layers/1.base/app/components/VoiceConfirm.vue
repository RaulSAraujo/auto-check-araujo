<script setup lang="ts">
defineOptions({ name: 'BaseVoiceConfirm' })

const { request, settle } = useVoiceConfirm()
const router = useRouter()

// The layout's useRoute() syncs only after the new page's setup, which may already have asked for confirmation.
watch(() => router.currentRoute.value.path, () => {
  if (request.value) settle(false)
})

const open = computed({
  get: () => !!request.value,
  set: (value: boolean) => {
    if (!value) settle(false)
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="request?.title ?? ''"
    description="Comando de voz"
  >
    <template
      v-if="request?.description"
      #body
    >
      <p class="whitespace-pre-line text-sm text-muted">
        {{ request.description }}
      </p>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          label="Cancelar"
          color="neutral"
          variant="ghost"
          @click="settle(false)"
        />
        <UButton
          :label="request?.confirmLabel ?? 'Confirmar'"
          icon="i-lucide-check"
          autofocus
          @click="settle(true)"
        />
      </div>
    </template>
  </UModal>
</template>
