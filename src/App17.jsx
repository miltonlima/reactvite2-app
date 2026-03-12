// Página de dashboard: mostra estatísticas simples, um gráfico placeholder e atividade recente.
// Este arquivo usa estilos inline para um protótipo rápido; considere mover os estilos para `App.css`.
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

// Pequeno componente reutilizável de cartão de estatística exibido no cabeçalho do dashboard.
// Props:
// - title: rótulo exibido acima do valor principal
// - value: número ou valor principal da estatística
// - diff: variação percentual opcional (positiva verde, negativa vermelha)
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

// Gráfico de barras simples em SVG para visualização rápida de dados.
// Substitua por uma biblioteca de gráficos profissional (Chart.js, Recharts, etc.) em produção.
function ChartPlaceholder({ width = '100%', height = 160 }) {
  const bars = [50, 80, 40, 120, 90, 60, 100, 30, 10, 10, 50, 80, 120]
  const max = Math.max(...bars)
  return (
    <div style={{ padding: 12, background: '#fff', borderRadius: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <svg viewBox={`0 0 ${bars.length * 20} ${max}`} width={width} height={height} preserveAspectRatio="none">
        {bars.map((b, i) => (
          <rect key={i} x={i * 20 + 6} y={max - b} width={5} height={b} fill="#4f46e5" rx={3} />
        ))}
      </svg>
    </div>
  )
}

// Componente principal do dashboard. Usa dados mock locais (`stats` e `recent`).
// Substitua useMemo/useState por chamadas à API quando os endpoints estiverem prontos.
function App17() {
  const [count, setCount] = useState(0)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()

  // Protege a página: redireciona para login se usuário não estiver autenticado
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (!user) {
      navigate('/page15')
    } else {
      setIsAuthenticated(true)
    }
  }, [navigate])

  // Dados de estatísticas mockados. Em produção, buscar esses dados de um endpoint da API.
  const stats = useMemo(() => ({ totalUsers: 1240, activeUsers: 312, newToday: 8 }), [])

  // Se não estiver autenticado, não renderiza nenhum conteúdo da página
  if (!isAuthenticated) {
    return null
  }

  // Função de logout: remove dados do usuário do localStorage e redireciona para a página de login
  function handleLogout() {
    localStorage.removeItem('user')
    navigate('/page15')
  }

  // Lista mockada de atividade recente. Em produção, buscar da API.
  const recent = [
    { id: 1, user: 'Ana Silva', action: 'login', when: '10:12' },
    { id: 2, user: 'Carlos Souza', action: 'signup', when: '09:48' },
    { id: 3, user: 'Mariana', action: 'password reset', when: '08:30' }
  ]

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
      {/* Sidebar vertical */}
      <aside style={{ width: 240, background: '#1e293b', color: '#fff', display: 'flex', flexDirection: 'column', padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#64748b',
            margin: '0 auto 12px'
          }}></div>
          <div style={{ fontWeight: 700 }}>John Don</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>johndon@company.com</div>
        </div>
        <nav style={{ flex: 1 }}>
          {[
            { name: 'home', icon: '🏠' },
            { name: 'Arquivo', icon: '📁' },
            { name: 'Mensagens', icon: '✉️' },
            { name: 'Notificação', icon: '🔔' },
            { name: 'Localização', icon: '📍' },
            { name: 'Gráfico', icon: '📊' }
          ].map(item => (
            <div key={item.name} style={{ padding: '8px 0', display: 'flex', alignItems: 'center', cursor: 'pointer', opacity: 0.9 }}>
              <span style={{ width: 24, textAlign: 'center' }}>{item.icon}</span>
              <span style={{ marginLeft: 8, fontSize: 14, textTransform: 'capitalize' }}>{item.name}</span>
            </div>
          ))}
        </nav>
      </aside>

      {/* Área principal */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#f1f5f9' }}>
        <header style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Dashboard User</h2>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4 }}>Sair</button>
        </header>

        <section style={{ padding: 20 }}>
          {/* cartões grandes de métricas */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ background: '#0ea5e9', color: '#fff', padding: 20, borderRadius: 8, flex: '1 1 200px' }}>
              <div>Earning</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>$ 628</div>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, flex: '1 1 200px' }}>
              <div>Share</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>2434</div>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, flex: '1 1 200px' }}>
              <div>Likes</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>1259</div>
            </div>
            <div style={{ background: '#fff', padding: 20, borderRadius: 8, flex: '1 1 200px' }}>
              <div>Rating</div>
              <div style={{ fontSize: 32, fontWeight: 700 }}>8,5</div>
            </div>
          </div>

          {/* gráficos de exemplo */}
          <div style={{ display: 'flex', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, flex: '2 1 500px' }}>
              <h3>Engagement Chart</h3>
              <ChartPlaceholder />
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, flex: '1 1 250px' }}>
              <h3>Activity</h3>
              <div style={{ width: '100%', height: 150, background: '#e5e7eb' }}></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App17
