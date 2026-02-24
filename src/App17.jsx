import { useState, useMemo } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

function StatCard({ title, value, diff }) {
  return (
    <div style={{
      flex: 1,
      padding: 16,
      margin: 8,
      borderRadius: 8,
      background: '#fff',
      boxShadow: '0 1px 4px rgba(0,0,0,0.08)'
    }}>
      <div style={{ fontSize: 12, color: '#666' }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 8 }}>{value}</div>
      {diff !== undefined && (
        <div style={{ marginTop: 6, color: diff >= 0 ? '#0a0' : '#a00', fontSize: 12 }}>
          {diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}%
        </div>
      )}
    </div>
  )
}

function ChartPlaceholder({ width = '100%', height = 160 }) {
  const bars = [50, 80, 40, 120, 90, 60, 100]
  const max = Math.max(...bars)
  return (
    <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <svg viewBox={`0 0 ${bars.length * 20} ${max}`} width={width} height={height} preserveAspectRatio="none">
        {bars.map((b, i) => (
          <rect key={i} x={i * 20 + 6} y={max - b} width={12} height={b} fill="#4f46e5" rx={3} />
        ))}
      </svg>
    </div>
  )
}

function App17() {
  const [count, setCount] = useState(0)

  const stats = useMemo(() => ({ totalUsers: 1240, activeUsers: 312, newToday: 8 }), [])

  const recent = [
    { id: 1, user: 'Ana Silva', action: 'login', when: '10:12' },
    { id: 2, user: 'Carlos Souza', action: 'signup', when: '09:48' },
    { id: 3, user: 'Mariana', action: 'password reset', when: '08:30' }
  ]

  return (
    <>

      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 20 }}>
        <img src={viteLogo} style={{ height: 36 }} alt="Vite" />
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <img src={reactLogo} style={{ height: 28 }} alt="React" />
          <button onClick={() => setCount(c => c + 1)} style={{ padding: '6px 12px' }}>Clicks: {count}</button>
        </div>
      </header>

      <main style={{ padding: 20 }}>
        <section style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <StatCard title="Total users" value={stats.totalUsers} diff={2.4} />
          <StatCard title="Active now" value={stats.activeUsers} diff={-1.2} />
          <StatCard title="New today" value={stats.newToday} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
          <div>
            <h3 style={{ marginTop: 0 }}>Engagement (last 7 days)</h3>
            <ChartPlaceholder />
          </div>

          <div>
            <h3 style={{ marginTop: 0 }}>Recent activity</h3>
            <div style={{ background: '#fff', borderRadius: 8, padding: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {recent.map(r => (
                  <li key={r.id} style={{ padding: '8px 6px', borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ fontWeight: 600 }}>{r.user}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{r.action} · {r.when}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default App17
