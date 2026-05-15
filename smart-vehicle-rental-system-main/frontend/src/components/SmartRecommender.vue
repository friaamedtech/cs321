<template>
  <v-card rounded="xl" elevation="1" class="mb-6" v-if="show">
    <v-card-title class="pa-5 pb-3 d-flex align-center">
      <v-icon color="secondary" class="mr-2">mdi-creation</v-icon>
      AI Vehicle Recommender
      <v-spacer />
      <v-btn icon size="small" variant="text" @click="show=false"><v-icon>mdi-close</v-icon></v-btn>
    </v-card-title>
    <v-card-text class="px-5 pb-5">
      <p class="text-body-2 text-medium-emphasis mb-3">Tell us what you need and we'll pick the best vehicle for you.</p>
      <v-row dense>
        <v-col cols="12" md="4">
          <v-select v-model="form.purpose" label="Purpose" :items="['City commute','Road trip','Business','Family outing','Moving stuff']" variant="outlined" density="comfortable" rounded="lg" hide-details />
        </v-col>
        <v-col cols="12" md="4">
          <v-select v-model="form.duration" label="Duration" :items="['A few hours','Half a day','Full day','Multiple days']" variant="outlined" density="comfortable" rounded="lg" hide-details />
        </v-col>
        <v-col cols="12" md="4">
          <v-select v-model="form.budget" label="Budget" :items="['Under 50 TND','50–150 TND','150–500 TND','500+ TND']" variant="outlined" density="comfortable" rounded="lg" hide-details />
        </v-col>
      </v-row>
      <v-btn color="secondary" variant="tonal" rounded="xl" class="mt-4" prepend-icon="mdi-creation" :loading="loading" @click="recommend">
        Get AI Recommendation
      </v-btn>

      <div v-if="result" class="mt-4">
        <v-divider class="mb-3" />
        <div class="answer-body" v-html="formatted" />
      </div>
      <v-alert v-if="error" type="error" variant="tonal" density="compact" rounded="lg" class="mt-3">{{ error }}</v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export default {
  name: 'SmartRecommender',
  props: {
    vehicles: { type: Array, default: () => [] }
  },
  data() {
    return {
      show: true,
      loading: false,
      result: '',
      error: '',
      form: { purpose: 'City commute', duration: 'Full day', budget: '50–150 TND' }
    }
  },
  computed: {
    formatted() {
      return this.result
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br>')
    },
    availableFleet() {
      return this.vehicles
        .filter(v => v.status === 'AVAILABLE')
        .map(v => `- ${v.brand} ${v.model} (${v.type}): ${v.pricePerDay} TND/day, ${v.pricePerMinute} TND/min, located in ${v.city}`)
        .join('\n')
    }
  },
  methods: {
    async recommend() {
      if (!this.availableFleet) {
        this.error = 'No available vehicles found.'
        return
      }
      this.loading = true
      this.result = ''
      this.error = ''
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            max_tokens: 200,
            messages: [
              {
                role: 'system',
                content: 'You are a smart car rental advisor. The user will give you their needs and the available vehicles. Recommend the best 1-2 options from the list only. Give the vehicle name and one sentence explaining why. Be brief.'
              },
              {
                role: 'user',
                content: `My needs:\n- Purpose: ${this.form.purpose}\n- Duration: ${this.form.duration}\n- Budget: ${this.form.budget}\n\nAvailable vehicles in our fleet:\n${this.availableFleet}`
              }
            ]
          })
        })
        if (!res.ok) {
          const e = await res.json()
          throw new Error(e.error?.message || `Error ${res.status}`)
        }
        const data = await res.json()
        this.result = data.choices?.[0]?.message?.content || 'No recommendation available.'
      } catch (e) {
        this.error = e.message || 'Something went wrong.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>

<style scoped>
.answer-body {
  font-size: 0.88rem;
  line-height: 1.75;
  background: rgba(var(--v-theme-secondary), 0.05);
  border-radius: 12px;
  padding: 12px 16px;
}
</style>