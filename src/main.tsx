import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ReceiptPrintRoot from '@/components/ReceiptPrintRoot'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <ReceiptPrintRoot />
  </StrictMode>,
)
