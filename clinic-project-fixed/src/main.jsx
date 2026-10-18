import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import '@fortawesome/fontawesome-free/css/fontawesome.min.css'
import '@fortawesome/fontawesome-free/css/solid.min.css'
import '@fortawesome/fontawesome-free/css/brands.min.css'
import '@fontsource/tajawal/400.css'
import '@fontsource/tajawal/500.css'
import '@fontsource/tajawal/700.css'
import '@fontsource/tajawal/900.css'
import '@fontsource/cairo/400.css'
import '@fontsource/cairo/500.css'
import '@fontsource/cairo/700.css'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
)

// بعد أول رسم فعلي: أوقف مؤقت الخطأ وأزل شاشة الإقلاع
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    window.__appMounted = true
    const boot = document.getElementById('boot')
    if (boot) boot.remove()
  })
})
