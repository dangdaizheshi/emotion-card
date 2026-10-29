import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { sensenovaPlugin } from './server/sensenova-plugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), sensenovaPlugin()],
  server: {
    port: 5173,
    open: true
  }
})
