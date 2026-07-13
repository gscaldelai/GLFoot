import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Expõe os stores no console em modo dev para inspeção e testes manuais
if (import.meta.env.DEV) {
  Promise.all([
    import('./stores/useMatchStore'),
    import('./stores/useLineupStore'),
    import('./stores/useFinanceStore'),
    import('./stores/useCoachStore'),
    import('./stores/useConfidenceStore'),
  ]).then(([m, l, f, c, cf]) => {
    ;(window as any).glfoot = {
      match: m.useMatchStore, lineup: l.useLineupStore, finance: f.useFinanceStore,
      coach: c.useCoachStore, confidence: cf.useConfidenceStore,
    }
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
