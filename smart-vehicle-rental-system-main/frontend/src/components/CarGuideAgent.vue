<template>
  <v-card rounded="xl" elevation="1" class="mt-4">
    <v-card-title class="pa-5 pb-2 d-flex align-center">
      <v-icon color="primary" class="mr-2">mdi-robot-excited</v-icon>
      Car Feature Guide
      <v-spacer />
      <v-btn v-if="messages.length" icon size="small" variant="text" color="error" @click="clearChat">
        <v-icon>mdi-delete-outline</v-icon>
      </v-btn>
    </v-card-title>

    <v-card-text class="px-5 pb-2">
      <p class="text-body-2 text-medium-emphasis mb-3">
        Ask anything about your <strong>{{ brand }} {{ model }}</strong> — features, controls, settings.
      </p>

      <!-- Suggestion chips -->
      <div class="d-flex flex-wrap gap-2 mb-4">
        <v-chip
          v-for="q in suggestions" :key="q"
          size="small" variant="tonal" color="primary"
          class="cursor-pointer" @click="askQuestion(q)"
        >{{ q }}</v-chip>
      </div>

      <!-- Chat thread -->
      <div v-if="messages.length" class="chat-thread mb-4" ref="chatThread">
        <div v-for="(msg, i) in messages" :key="i" class="mb-3">
          <!-- User bubble -->
          <div v-if="msg.role === 'user'" class="d-flex justify-end">
            <div class="user-bubble">{{ msg.text }}</div>
          </div>
          <!-- Assistant bubble -->
          <div v-else>
            <div class="d-flex align-center gap-1 mb-1">
              <v-icon size="16" color="primary">mdi-robot-excited</v-icon>
              <span class="text-caption text-medium-emphasis">Car Guide</span>
              <v-chip v-if="msg.cached" size="x-small" color="success" variant="tonal" class="ml-1">cached</v-chip>
            </div>
            <div class="answer-body" v-html="formatText(msg.text)" />
            <!-- Rating -->
            <div class="d-flex align-center gap-2 mt-2">
              <span class="text-caption text-medium-emphasis">Helpful?</span>
              <v-btn icon size="x-small" variant="text" color="success" @click="rate(i, 'up')">
                <v-icon size="16">{{ msg.rated === 'up' ? 'mdi-thumb-up' : 'mdi-thumb-up-outline' }}</v-icon>
              </v-btn>
              <v-btn icon size="x-small" variant="text" color="error" @click="rate(i, 'down')">
                <v-icon size="16">{{ msg.rated === 'down' ? 'mdi-thumb-down' : 'mdi-thumb-down-outline' }}</v-icon>
              </v-btn>
              <span v-if="msg.rated" class="text-caption text-success">Thanks!</span>
            </div>
          </div>
        </div>
        <!-- Typing indicator -->
        <div v-if="loading" class="d-flex align-center gap-2 text-medium-emphasis mt-1">
          <v-progress-circular indeterminate size="14" width="2" color="primary" />
          <span class="text-caption">Thinking…</span>
        </div>
      </div>

      <!-- Input row -->
      <div class="d-flex align-end gap-2">
        <v-textarea
          v-model="userQuestion"
          :label="`Ask about your ${brand} ${model}…`"
          variant="outlined" density="comfortable" rounded="lg"
          rows="1" auto-grow hide-details class="flex-grow-1"
          @keydown.enter.prevent="submit"
        />
        <v-btn icon :color="listening ? 'error' : 'primary'" variant="tonal" size="large" rounded="lg" @click="toggleVoice" :title="listening ? 'Stop' : 'Speak'">
          <v-icon>{{ listening ? 'mdi-microphone-off' : 'mdi-microphone' }}</v-icon>
        </v-btn>
        <v-btn icon color="primary" variant="flat" size="large" rounded="lg" :loading="loading" :disabled="!userQuestion.trim()" @click="submit">
          <v-icon>mdi-send</v-icon>
        </v-btn>
      </div>
      <p v-if="listening" class="text-caption text-error mt-1">
        <v-icon size="12">mdi-record</v-icon> Listening… speak now
      </p>
    </v-card-text>

    <v-card-text v-if="error" class="px-5 pb-4">
      <v-alert type="error" variant="tonal" density="compact" rounded="lg" closable @click:close="error=''">{{ error }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export default {
  name: 'CarGuideAgent',
  props: {
    brand: { type: String, required: true },
    model: { type: String, required: true },
    type:  { type: String, default: '' },
  },
  data() {
    return {
      userQuestion: '',
      messages: [],
      loading: false,
      error: '',
      listening: false,
      recognition: null,
    }
  },
  computed: {
    suggestions() {
      const base = [
        `Bluetooth in ${this.brand} ${this.model}?`,
        `Fuel economy tips for ${this.brand} ${this.model}?`,
      ]
      const byType = {
        SUV:      [`4WD mode on ${this.brand} ${this.model}?`, `Hill descent control?`],
        Electric: [`Charging ${this.brand} ${this.model}?`, `Regenerative braking?`],
        Sedan:    [`Cruise control on ${this.brand} ${this.model}?`, `Trunk release?`],
        Van:      [`Sliding door on ${this.brand} ${this.model}?`, `Rear AC controls?`],
        Hatchback:[`Folding rear seats in ${this.brand} ${this.model}?`, `Parking sensors?`],
        Default:  [`Cruise control on ${this.brand} ${this.model}?`, `Parking sensors?`],
      }
      return [...base, ...(byType[this.type] || byType.Default)]
    },
  },
  methods: {
    formatText(text) {
      return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/^(\d+\.\s)/gm, '<br><span style="color:var(--v-theme-primary);font-weight:600">$1</span>')
        .replace(/\n/g, '<br>')
        .replace(/^<br>/, '')
    },
    askQuestion(q) { this.userQuestion = q; this.submit() },
    clearChat() { this.messages = []; this.error = '' },
    rate(index, value) {
      this.messages[index].rated = value
      const ratings = JSON.parse(localStorage.getItem('guide_ratings') || '[]')
      ratings.push({ question: this.messages[index - 1]?.text, rating: value, car: `${this.brand} ${this.model}`, date: new Date().toISOString() })
      localStorage.setItem('guide_ratings', JSON.stringify(ratings))
    },
    toggleVoice() {
      if (this.listening) { this.recognition?.stop(); this.listening = false; return }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) { this.error = 'Voice not supported. Use Chrome.'; return }
      this.recognition = new SR()
      this.recognition.lang = 'en-US'
      this.recognition.onresult = (e) => { this.userQuestion = e.results[0][0].transcript; this.listening = false; this.submit() }
      this.recognition.onerror = () => { this.listening = false }
      this.recognition.onend   = () => { this.listening = false }
      this.recognition.start()
      this.listening = true
    },
    async submit() {
      if (!this.userQuestion.trim() || this.loading) return
      const question = this.userQuestion.slice(0, 120)
      this.userQuestion = ''
      this.error = ''
      this.loading = true
      this.messages.push({ role: 'user', text: question })
      this.$nextTick(() => this.scrollToBottom())

      // Cache check
      const cacheKey = `guide_${this.brand}_${this.model}_${question}`.toLowerCase().replace(/\s+/g, '_').slice(0, 100)
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        this.messages.push({ role: 'assistant', text: JSON.parse(cached), rated: null, cached: true })
        this.loading = false
        this.$nextTick(() => this.scrollToBottom())
        return
      }

      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            max_tokens: 300,
            messages: [
              { role: 'system', content: `You are a helpful car assistant. The user rented a ${this.brand} ${this.model} (${this.type}). Give a short numbered step-by-step answer. Max 5 steps. No intro sentence. Be direct.` },
              { role: 'user', content: question }
            ],
          }),
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || `Error ${res.status}`) }
        const data = await res.json()
        const answer = data.choices?.[0]?.message?.content || 'No response received.'
        this.messages.push({ role: 'assistant', text: answer, rated: null, cached: false })
        localStorage.setItem(cacheKey, JSON.stringify(answer))
      } catch (e) {
        this.messages.pop()
        this.error = e.message || 'Something went wrong.'
      } finally {
        this.loading = false
        this.$nextTick(() => this.scrollToBottom())
      }
    },
    scrollToBottom() {
      const el = this.$refs.chatThread
      if (el) el.scrollTop = el.scrollHeight
    },
  },
}
</script>

<style scoped>
.chat-thread { max-height: 400px; overflow-y: auto; padding: 4px 2px; scroll-behavior: smooth; }
.user-bubble {
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-on-surface));
  border-radius: 16px 16px 4px 16px;
  padding: 10px 14px;
  max-width: 80%;
  font-size: 0.88rem;
  line-height: 1.6;
}
.answer-body {
  font-size: 0.88rem;
  line-height: 1.75;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 4px 16px 16px 16px;
  padding: 10px 14px;
}
.cursor-pointer { cursor: pointer; }
</style>