
**Live demo:** [smart-vehicle-rental-system.vercel.app](https://cs321-jb6c-l747e2iio-yassinefriaa-s-projects6.vercel.app/vehicles)

---
# 🚗 SmartRent — AI-Powered Vehicle Rental System

> A smart vehicle rental platform built with Vue 3 and Vuetify 3, featuring three integrated AI features powered by the Groq API and Meta's Llama 3.1 model.

![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D?style=flat&logo=vue.js)
![Vuetify](https://img.shields.io/badge/Vuetify-3.x-1867C0?style=flat&logo=vuetify)
![Groq](https://img.shields.io/badge/Groq-LLaMA%203.1-orange?style=flat)
![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?style=flat&logo=vite)

---

## 🌐 Live Demo

👉 **Live demo:** [smart-vehicle-rental-system.vercel.app](https://cs321-jb6c-l747e2iio-yassinefriaa-s-projects6.vercel.app/vehicles)


---

## 📋 Project Overview

SmartRent is a full-featured vehicle rental system that supports three user roles — **Customer**, **Company**, and **Admin** — each with a dedicated dashboard. The platform allows customers to browse vehicles, start instant rentals or submit contract requests, and track their rental history.

On top of the core rental system, we integrated **three AI features** that cover the full customer journey — from choosing a car, to using it, to analyzing spending habits.

---

## 🤖 AI Features

### 1. 🔍 Car Feature Guide (`CarGuideAgent`)
**Located on:** Vehicle Detail Page  
**What it does:** Customers can ask any question about how to use a feature of their rented car (Bluetooth, cruise control, parking sensors, etc.) and receive a numbered step-by-step guide instantly.

**Technical details:**
- Model: `llama-3.1-8b-instant` hosted on Groq's LPU infrastructure
- Dynamic system prompt injection with brand, model and car type
- Voice input via browser Web Speech API (Chrome)
- localStorage cache — repeated questions load instantly without API call
- Thumbs up/down rating system saved to localStorage
- Chat thread UI with auto-scroll

---

### 2. ✨ Smart Vehicle Recommender (`SmartRecommender`)
**Located on:** Vehicles Page (customers only)  
**What it does:** Customer selects their purpose, duration and budget. The AI reads the live fleet inventory and recommends the best 1-2 vehicles with a brief explanation.

**Technical details:**
- Real-time fleet data injected into the prompt (simplified RAG)
- Grounding instruction: "recommend from the list only" — prevents hallucination
- Only renders after fleet data is fully loaded

---

### 3. 📊 AI Trip Summary
**Located on:** My Rentals Page  
**What it does:** Analyzes the customer's rental history and generates a personalized summary — most used car type, total spent, rental patterns, and a money-saving tip.

**Technical details:**
- Last 10 rentals formatted as structured text and injected into prompt
- Total spent computed client-side and passed as context
- One-click generation, result displayed inline

---

### 4. 📈 Admin AI Feedback Dashboard
**Located on:** Admin → Statistics  
**What it does:** Admin can see aggregated statistics on AI answer ratings — satisfaction rate, thumbs up/down counts, most queried vehicles, and a full ratings table.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Vue 3 (Options API) |
| UI Library | Vuetify 3 |
| Build Tool | Vite 7 |
| AI Model | Meta Llama 3.1 8B Instant |
| AI Infrastructure | Groq API |
| Storage | localStorage (no backend) |
| Deployment | Vercel |

---

## 👥 User Roles

| Role | Access |
|---|---|
| **Customer** | Browse vehicles, instant/contract rental, rental history, AI features |
| **Company** | Manage own fleet, view company rentals, dashboard |
| **Admin** | Full platform stats, user management, AI feedback dashboard |

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── CarGuideAgent.vue       # AI car feature chat agent
│   │   └── SmartRecommender.vue    # AI vehicle recommender
│   ├── views/
│   │   ├── VehicleDetailView.vue   # Vehicle detail + CarGuideAgent
│   │   ├── VehiclesView.vue        # Fleet page + SmartRecommender
│   │   ├── RentalsView.vue         # Rental history + AI Trip Summary
│   │   ├── AdminStatsView.vue      # Admin stats + AI feedback dashboard
│   │   ├── AdminView.vue
│   │   ├── AdminUsersView.vue
│   │   ├── CompanyDashboard.vue
│   │   ├── CompanyVehicles.vue
│   │   ├── CompanyRentals.vue
│   │   ├── HomeView.vue
│   │   ├── LoginView.vue
│   │   ├── MapView.vue
│   │   └── ProfileView.vue
│   ├── store/
│   │   └── data.js                 # localStorage data layer
│   └── router/
│       └── index.js
├── .env.local                      # API key (git-ignored)
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 20.19.0
- A free [Groq API key](https://console.groq.com)

### Installation

```bash
# Clone the repository
git clone https://github.com/friaamedtech/cs321.git
cd cs321/smart-vehicle-rental-system-main/smart-vehicle-rental-system-main/frontend

# Install dependencies
npm install

# Create environment file
echo "VITE_GROQ_API_KEY=your_groq_key_here" > .env.local

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## ⚙️ Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```
VITE_GROQ_API_KEY=gsk_your_key_here
```

Get a free key at [console.groq.com](https://console.groq.com) — no credit card required.

---

## 🔒 Known Limitations

| Limitation | Details |
|---|---|
| No backend | All data stored in localStorage, resets on browser clear |
| API key in frontend | Acceptable for demo — production would use a serverless proxy |
| No conversation memory | Each question is independent to keep payload size small |
| Free tier rate limit | 30 requests/minute — sufficient for demo use |
| Knowledge cutoff | Llama 3.1 trained on data up to early 2024 |
| Voice input | Chrome/Edge only — Firefox not supported |

---

## 📚 Academic Context

This project was developed as part of the **CS321** course at **MedTech** (Mediterranean Institute of Technology).

**AI integration concepts demonstrated:**
- Prompt Engineering (role assignment, output constraints, context injection)
- Retrieval Augmented Generation (RAG) — simplified, no vector database
- Inference via third-party LLM API
- Client-side semantic caching
- User feedback collection for model improvement loop

---

## 👨‍💻 Author

**Yassine Friaa**  
**Aya Riahi**
**Aziz Zmzmi**
**Bilel Didi**
MedTech — Mediterranean Institute of Technology  
[github.com/friaamedtech](https://github.com/friaamedtech)
