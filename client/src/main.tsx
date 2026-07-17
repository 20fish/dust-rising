import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import App from './App.tsx'
import { useGameStore } from './store/gameStore'
import { ALL_ARTIFACTS } from './game/artifacts'

/* 暴露 Zustand Store 到全局，方便测试 */
(window as any).__ZUSTAND_STORE__ = useGameStore;
(window as any).__ARTIFACTS__ = ALL_ARTIFACTS;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)