import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'

function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <h1 className="text-4xl font-black text-emerald-400 tracking-tight animate-bounce">
        Tailwind v4 is Alive!
      </h1>
      <p className="text-slate-400 mt-2">Environment is fully weaponized.</p>
    </div>
  )
}

export default App