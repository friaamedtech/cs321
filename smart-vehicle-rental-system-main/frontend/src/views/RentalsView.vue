<template>
  <div style="max-width:1100px; margin:0 auto; padding:28px 32px;">
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h2 style="font-family:'Cabinet Grotesk','Instrument Sans',sans-serif;font-size:24px;font-weight:700;">My Rentals</h2>
        <p style="font-size:13px;color:rgb(var(--v-theme-on-surface-variant));margin-top:2px;">Your complete rental history</p>
      </div>
      <v-btn variant="tonal" color="primary" prepend-icon="mdi-refresh" @click="load" rounded="lg">Refresh</v-btn>
    </div>

    <!-- AI Trip Summary -->
    <v-card v-if="enriched.length && !loading" rounded="xl" elevation="1" class="mb-5">
      <v-card-title class="pa-5 pb-3 d-flex align-center">
        <v-icon color="primary" class="mr-2">mdi-chart-timeline-variant</v-icon>
        AI Trip Summary
        <v-spacer />
        <v-btn v-if="!summary && !summaryLoading" size="small" color="primary" variant="tonal" rounded="lg" prepend-icon="mdi-creation" @click="generateSummary">
          Generate
        </v-btn>
      </v-card-title>
      <v-card-text class="px-5 pb-5">
        <div v-if="summaryLoading" class="d-flex align-center gap-2 text-medium-emphasis">
          <v-progress-circular indeterminate size="18" width="2" color="primary" />
          <span class="text-body-2">Analyzing your rental history…</span>
        </div>
        <div v-else-if="summary" class="summary-body" v-html="summaryFormatted" />
        <p v-else class="text-body-2 text-medium-emphasis">Click Generate to get an AI analysis of your rental habits and spending.</p>
      </v-card-text>
    </v-card>

    <!-- Skeleton -->
    <v-card v-if="loading" rounded="xl" elevation="1" class="skeleton">
      <v-card-text class="pa-6">
        <div v-for="i in 5" :key="i" style="height:48px;background:rgba(92,107,192,0.07);border-radius:8px;margin-bottom:10px;" />
      </v-card-text>
    </v-card>

    <v-card v-else rounded="xl" elevation="1">
      <v-data-table :headers="headers" :items="enriched" :items-per-page="10" rounded="xl">
        <template v-slot:item.rentalType="{ item }">
          <v-chip :color="item.rentalType==='INSTANT'?'warning':'primary'" variant="tonal" size="small">
            <v-icon start size="12">{{ item.rentalType==='INSTANT'?'mdi-lightning-bolt':'mdi-file-sign' }}</v-icon>
            {{ item.rentalType }}
          </v-chip>
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip :color="sc(item.status)" variant="tonal" size="small">{{ item.status }}</v-chip>
        </template>
        <template v-slot:item.totalPrice="{ item }">
          <span :class="item.totalPrice?'text-success font-weight-bold':'text-medium-emphasis'">
            {{ item.totalPrice ? item.totalPrice+' TND' : '—' }}
          </span>
        </template>
        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-1">
            <v-btn v-if="item.status==='ACTIVE'&&item.rentalType==='INSTANT'" color="error" variant="tonal" size="small" rounded="lg" @click="end(item)">End</v-btn>
            <v-btn v-if="item.status==='COMPLETED'" color="success" variant="tonal" size="small" rounded="lg" :to="`/rentals/${item.id}/receipt`" prepend-icon="mdi-receipt">Receipt</v-btn>
            <v-btn v-if="item.rentalType==='CONTRACT'" color="primary" variant="tonal" size="small" rounded="lg" :to="`/rentals/${item.id}/contract`" prepend-icon="mdi-eye">Details</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="sb.show" :color="sb.color" :timeout="3000" rounded="lg">{{ sb.text }}</v-snackbar>
  </div>
</template>

<script>
import { getRentalsByCustomer, getVehicleById, endInstantRental, getCurrentUser } from '../store/data.js'

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY

export default {
  name: 'RentalsView',
  data() {
    return {
      rentals: [], loading: true, currentUser: getCurrentUser(),
      sb: { show: false, text: '', color: 'success' },
      summary: '', summaryLoading: false,
      headers: [
        { title: '#', key: 'id', width: '60px' }, { title: 'Vehicle', key: 'vehicleName' },
        { title: 'Type', key: 'rentalType' }, { title: 'Status', key: 'status' },
        { title: 'Start', key: 'startTime' }, { title: 'Total', key: 'totalPrice' },
        { title: '', key: 'actions', sortable: false }
      ]
    }
  },
  computed: {
    enriched() {
      return this.rentals.map(r => {
        const v = getVehicleById(r.vehicleId)
        return { ...r, vehicleName: v ? `${v.brand} ${v.model}` : '—', startTime: r.startTime ? new Date(r.startTime).toLocaleString() : '—' }
      })
    },
    summaryFormatted() {
      return this.summary.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
    },
    totalSpent() {
      return this.rentals.filter(r => r.totalPrice).reduce((s, r) => s + Number(r.totalPrice), 0).toFixed(2)
    }
  },
  mounted() { setTimeout(() => { this.load() }, 400) },
  methods: {
    load() { this.rentals = getRentalsByCustomer(this.currentUser.id); this.loading = false },
    sc(s) { return s==='ACTIVE'?'success':s==='PENDING'?'warning':s==='COMPLETED'?'primary':'error' },
    end(r) { endInstantRental(r.id); this.load(); this.sb = { show: true, text: 'Rental ended!', color: 'success' } },
    async generateSummary() {
      this.summaryLoading = true
      const snapshot = this.enriched.slice(0, 10).map(r =>
        `${r.vehicleName} | ${r.rentalType} | ${r.status} | ${r.totalPrice ? r.totalPrice + ' TND' : 'ongoing'}`
      ).join('\n')
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            max_tokens: 200,
            messages: [
              { role: 'system', content: 'You are a rental analytics assistant. Summarize the user rental history in 3-4 short bullet points. Cover: most used car type, total spent, rental pattern, and one tip to save money. Be friendly and concise.' },
              { role: 'user', content: `My rentals:\n${snapshot}\nTotal spent: ${this.totalSpent} TND` }
            ]
          })
        })
        if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message) }
        const data = await res.json()
        this.summary = data.choices?.[0]?.message?.content || 'No summary available.'
      } catch (e) {
        this.summary = 'Could not generate summary. Try again later.'
      } finally {
        this.summaryLoading = false
      }
    }
  }
}
</script>

<style scoped>
.summary-body { font-size: 0.88rem; line-height: 1.8; background: rgba(var(--v-theme-primary), 0.05); border-radius: 12px; padding: 12px 16px; }
</style>