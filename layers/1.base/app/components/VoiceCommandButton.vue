<script setup lang="ts">
import type { ButtonProps } from '@nuxt/ui'
import { VOICE_EXAMPLES } from '../utils/voice/types'

defineOptions({ name: 'BaseVoiceCommandButton', inheritAttrs: false })

withDefaults(defineProps<{
  variant?: ButtonProps['variant']
  color?: ButtonProps['color']
  size?: ButtonProps['size']
}>(), {
  variant: 'ghost',
  color: 'neutral',
  size: 'md'
})

const toast = useToast()
const { supported, listening, transcript, error, start, stop, cancel, onFinal } = useSpeechRecognition()
const { run } = useVoiceCommand()

const open = ref(false)
const text = ref('')
const notUnderstood = ref(false)
const running = ref(false)

watch(transcript, (value) => {
  if (listening.value) text.value = value
})

watch(open, (value) => {
  if (!value) stop()
})

onFinal((value) => {
  if (open.value) void submit(value)
})

function openModal() {
  open.value = true
  text.value = ''
  error.value = null
  notUnderstood.value = false
  if (supported.value) start()
}

function toggleListening() {
  if (listening.value) stop()
  else start()
}

function pickExample(example: string) {
  cancel()
  text.value = example
}

async function submit(value = text.value) {
  cancel()
  const command = value.trim()
  if (!command || running.value) return
  text.value = command
  notUnderstood.value = false
  running.value = true
  try {
    const result = await run(command)
    if (!result.ok && result.reason === 'not_understood') notUnderstood.value = true
    else open.value = false
  } catch {
    toast.add({
      title: 'Não foi possível executar o comando',
      description: 'Tente de novo.',
      color: 'error'
    })
  } finally {
    running.value = false
  }
}
</script>

<template>
  <UButton
    v-bind="$attrs"
    icon="i-lucide-mic"
    :color="color"
    :variant="variant"
    :size="size"
    class="rounded-full"
    aria-label="Comando de voz"
    @click="openModal"
  />

  <UModal
    v-model:open="open"
    title="Comando de voz"
    description="Diga o que quer cadastrar. O formulário abre preenchido para você conferir."
  >
    <template #body>
      <div class="space-y-4">
        <p
          role="status"
          aria-live="polite"
          class="flex items-center gap-2 text-sm font-medium text-primary"
        >
          <template v-if="listening">
            <UIcon
              name="i-lucide-audio-lines"
              class="size-5 animate-pulse"
            />
            Ouvindo…
          </template>
        </p>

        <UTextarea
          v-model="text"
          autoresize
          placeholder="Ex.: novo cliente João telefone 11 98888 7777"
          aria-label="Comando"
          class="w-full"
        />

        <UAlert
          v-if="!supported"
          color="neutral"
          variant="subtle"
          icon="i-lucide-info"
          description="Seu navegador não suporta reconhecimento de voz. Digite o comando."
        />

        <UAlert
          v-if="error"
          color="error"
          variant="subtle"
          icon="i-lucide-mic-off"
          :description="error"
        />

        <UAlert
          v-if="notUnderstood"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-help"
          description="Não entendi o comando. Veja os exemplos abaixo."
        />

        <UCollapsible>
          <UButton
            label="Exemplos"
            color="neutral"
            variant="link"
            trailing-icon="i-lucide-chevron-down"
            class="px-0"
          />

          <template #content>
            <ul class="mt-2 space-y-1">
              <li
                v-for="example in VOICE_EXAMPLES"
                :key="example"
              >
                <UButton
                  :label="example"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  class="w-full text-start"
                  :ui="{ label: 'whitespace-normal text-start' }"
                  @click="pickExample(example)"
                />
              </li>
            </ul>
          </template>
        </UCollapsible>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          v-if="supported"
          :icon="listening ? 'i-lucide-square' : 'i-lucide-mic'"
          :label="listening ? 'Parar' : 'Ouvir de novo'"
          color="neutral"
          variant="outline"
          @click="toggleListening"
        />
        <UButton
          label="Preencher"
          :disabled="!text.trim()"
          :loading="running"
          @click="submit()"
        />
      </div>
    </template>
  </UModal>
</template>
