import { useEffect, useState } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './routes/Home'
import { History } from './routes/History'
import { Export } from './routes/Export'

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <img src="/pwa.svg" width={28} height={28} alt="" />
          <div className="brandText">
            <div className="brandTitle">體重紀錄小幫手</div>
            <div className="brandSub">離線可用・本機保存</div>
          </div>
        </div>
        <nav className="nav">
          <NavLink className="navLink" to="/">
            今日
          </NavLink>
          <NavLink className="navLink" to="/history">
            紀錄
          </NavLink>
          <NavLink className="navLink" to="/export">
            導出
          </NavLink>
          <button
            className="btn themeBtn"
            onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
            aria-label="切換主題"
          >
            {theme === 'dark' ? '淺色' : '深色'}
          </button>
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/export" element={<Export />} />
        </Routes>
      </main>
    </div>
  )
}
