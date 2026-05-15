import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
 
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/groq': {
        target: 'https://api.groq.com',
        changeOrigin: true,
        rewrite: () => '/openai/v1/chat/completions',
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            proxyReq.setHeader('Authorization', 'Bearer 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')
            proxyReq.setHeader('Content-Type', 'application/json')
            // Allow large payloads
            proxyReq.removeHeader('content-length')
          })
        }
      }
    }
  }
})
 