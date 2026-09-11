<script setup lang="ts">
import { formatMoneyMask, moneyToMask, parseMoneyMask } from '~~/shared/utils/money'

defineOptions({ name: 'BaseCurrencyInput' })

const props = withDefaults(defineProps<{
  name?: string
  placeholder?: string
  disabled?: boolean
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** When true, clear input commits `0` instead of `undefined`. */
  emptyAsZero?: boolean
}>(), {
  name: undefined,
  placeholder: '0,00',
  disabled: false,
  size: 'md',
  emptyAsZero: false
})

const model = defineModel<number | undefined>({ default: undefined })

const display = ref(moneyToMask(model.value))
const focused = ref(false)

watch(model, (value) => {
  if (focused.value) return
  display.value = moneyToMask(value)
})

function onFocus() {
  focused.value = true
}

function onBlur() {
  focused.value = false
  display.value = moneyToMask(model.value)
}

function onUpdate(raw: string | number) {
  const next = formatMoneyMask(String(raw ?? ''))
  display.value = next
  const parsed = parseMoneyMask(next)
  model.value = parsed === undefined && props.emptyAsZero ? 0 : parsed
}
</script>

<template>
  <UInput
    :model-value="display"
    type="text"
    inputmode="numeric"
    autocomplete="off"
    spellcheck="false"
    :name="props.name"
    :placeholder="props.placeholder"
    :disabled="props.disabled"
    :size="props.size"
    class="w-full font-mono tabular-nums"
    @update:model-value="onUpdate"
    @focus="onFocus"
    @blur="onBlur"
  >
    <template #leading>
      <span class="text-sm text-muted">
        R$
      </span>
    </template>
  </UInput>
</template>
