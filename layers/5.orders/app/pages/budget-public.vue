<script setup lang="ts">
defineOptions({ name: 'OrdersPublicBudgetPage' })

definePageMeta({
  path: '/orcamento/:token',
  layout: false
})

const route = useRoute()
const token = computed(() => route.params.token as string)

const { data: budget, pending, error } = await usePublicBudgetQuery(token)

useHead({
  title: computed(() => budget.value ? `Orçamento ${budget.value.numero}` : 'Orçamento')
})
</script>

<template>
  <div class="min-h-dvh bg-default">
    <header class="border-b border-default bg-elevated/50 px-4 py-3 print:hidden">
      <div class="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <BaseBrandLogo size="sm" />
        <UButton
          v-if="budget"
          label="Imprimir"
          icon="i-lucide-printer"
          color="neutral"
          variant="soft"
          size="sm"
          @click="printPage()"
        />
      </div>
    </header>

    <main class="p-4 sm:p-6">
      <div
        v-if="pending && !budget"
        class="mx-auto max-w-3xl space-y-3"
      >
        <USkeleton class="h-8 w-48" />
        <USkeleton class="h-64 w-full" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="subtle"
        title="Orçamento indisponível"
        description="Este link é inválido ou o orçamento ainda não foi liberado para visualização."
        class="mx-auto max-w-3xl"
      />

      <OrdersPublicBudgetDocument
        v-else-if="budget"
        :budget="budget"
        class="mx-auto max-w-3xl"
      />
    </main>
  </div>
</template>

<style src="../assets/css/print.css"></style>
