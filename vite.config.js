import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/GCKallin-BattleMode/', // MUSS exakt so heißen wie dein Repository auf GitHub
})
