import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// [https://vitejs.dev/config/](https://vitejs.dev/config/)
export default defineConfig({
  plugins: [react()],
  base: '/uejo4/', // 這裡必須填入您的 repo 名稱 (uejo4)，前後要有斜線
})
