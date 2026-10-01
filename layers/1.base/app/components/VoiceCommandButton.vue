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
const { supported, listening, interim, error, start, stop, cancel, onChunk } = useSpeechRecognition()
const { run } = useVoiceCommand()
const { messages, pending, muted, ask, cancel: cancelAsk, reset: resetAsk, stopSpeaking, toggleMute } = useVoiceAsk()
const conversing = computed(() => messages.value.length > 0)

const open = ref(false)
const text = ref('')
const notUnderstood = ref(false)
const running = ref(false)
let runId = 0

onChunk((chunk) => {
  text.value = text.value.trim() ? `${text.value.trim()} ${chunk}` : chunk
})

watch(open, (value) => {
  if (value) return
  cancel()
  runId++
  resetAsk()
})

function openModal() {
  open.value = true
  text.value = ''
  error.value = null
  notUnderstood.value = false
  if (supported.value) start()
}

function toggleListening() {
  stopSpeaking()
  if (listening.value) stop()
  else start()
}

function clearText() {
  text.value = ''
  interim.value = ''
  // The segment still being recognized would come back on the next result; restarting drops it.
  if (listening.value) start()
  notUnderstood.value = false
}

function pickExample(example: string) {
  cancel()
  text.value = example
}

async function sendQuestion(question: string) {
  text.value = ''
  interim.value = ''
  const answered = await ask(question)
  if (!answered && open.value && !text.value) text.value = question
}

async function submit() {
  const command = [text.value, interim.value].map(part => part.trim()).filter(Boolean).join(' ')
  cancel()
  if (!command || running.value) return
  text.value = command
  notUnderstood.value = false
  running.value = true
  const id = ++runId
  const isCancelled = () => id !== runId
  try {
    if (conversing.value) {
      await sendQuestion(command)
      return
    }
    const result = await run(command, isCancelled)
    if (isCancelled()) return
    if (result.ok && result.ask) await sendQuestion(command)
    else if (!result.ok && result.reason === 'not_understood') notUnderstood.value = true
    else open.value = false
  } catch {
    if (isCancelled()) return
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
    :title="conversing ? 'Pergunta por voz' : 'Comando de voz'"
    :description="conversing ? 'Pergunte mais alguma coisa ou toque num atalho. A conversa some ao fechar.' : 'Fale à vontade, pode pausar. Toque em Enviar quando terminar e confira os dados antes de salvar.'"
  >
    <template #body>
      <div class="space-y-4">
        <ol
          v-if="conversing"
          class="space-y-3"
          aria-live="polite"
        >
          <li
            v-for="(message, index) in messages"
            :key="index"
            class="flex flex-col gap-2"
            :class="message.role === 'user' ? 'items-end' : 'items-start'"
          >
            <p
              class="max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm"
              :class="{
                'bg-primary text-inverted': message.role === 'user',
                'bg-elevated text-default': message.role === 'assistant',
                'bg-error/10 text-error': message.role === 'error'
              }"
            >
              {{ message.content }}
            </p>
            <div
              v-if="message.refs?.length"
              class="flex flex-wrap gap-2"
            >
              <UButton
                v-for="link in message.refs"
                :key="link.to"
                :to="link.to"
                :label="link.label"
                size="xs"
                color="neutral"
                variant="outline"
                trailing-icon="i-lucide-arrow-up-right"
                @click="open = false"
              />
            </div>
          </li>
        </ol>

        <p
          v-if="pending"
          role="status"
          class="flex items-center gap-2 text-sm text-muted"
        >
          <UIcon
            name="i-lucide-loader-circle"
            class="size-4 animate-spin"
          />
          Consultando…
          <UButton
            label="Cancelar"
            color="neutral"
            variant="link"
            size="xs"
            @click="cancelAsk"
          />
        </p>
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
          :placeholder="conversing ? 'Pergunte mais alguma coisa…' : 'Ex.: abre a OS do ABC1D23 e coloca no diagnóstico pastilha gasta'"
          aria-label="Comando"
          class="w-full"
        />

        <p
          v-if="interim"
          class="text-sm italic text-muted"
          aria-hidden="true"
        >
          {{ interim }}
        </p>

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
          v-if="notUnderstood && !conversing"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-help"
          description="Não entendi o comando. Veja os exemplos abaixo."
        />

        <UCollapsible v-if="!conversing">
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
      <div class="flex w-full flex-wrap justify-end gap-2">
        <UButton
          v-if="conversing"
          :icon="muted ? 'i-lucide-volume-x' : 'i-lucide-volume-2'"
          :aria-label="muted ? 'Ativar leitura das respostas' : 'Silenciar respostas'"
          color="neutral"
          variant="ghost"
          class="me-auto"
          @click="toggleMute"
        />
        <UButton
          v-if="supported"
          :icon="listening ? 'i-lucide-square' : 'i-lucide-mic'"
          :label="listening ? 'Parar' : 'Continuar ouvindo'"
          color="neutral"
          variant="outline"
          @click="toggleListening"
        />
        <UButton
          label="Limpar"
          color="neutral"
          variant="ghost"
          :disabled="(!text.trim() && !interim) || running"
          @click="clearText"
        />
        <UButton
          label="Enviar"
          icon="i-lucide-send"
          :disabled="!text.trim() && !interim"
          :loading="running"
          @click="submit()"
        />
      </div>
    </template>
  </UModal>
</template>
