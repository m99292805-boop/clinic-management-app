import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // إلزامي لـ Capacitor: بدونه الشاشة تطلع سودا فاضية لأن المسارات تصير مطلقة
  plugins: [react()],
  build: {
    target: ['es2019', 'chrome70', 'safari12'], // يدعم أجهزة أندرويد ذات WebView القديم
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  server: {
    port: 5174
  }
})
