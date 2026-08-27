import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './presentation/styles/global.css'
import './presentation/styles/library.css'
import './presentation/styles/article.css'
import './presentation/styles/learning.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
