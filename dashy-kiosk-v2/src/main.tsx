import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

/**
 * Application entry point.
 *
 * Renders the root App component into the #root DOM element
 * using React 19's createRoot API with StrictMode enabled.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
