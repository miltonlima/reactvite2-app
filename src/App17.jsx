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
    <>

      {/* Cabeçalho da página com logos, título e botão de logout */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 20, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={viteLogo} style={{ height: 36 }} alt="Vite" />
          <h1 style={{ margin: 0 }}>Dashboard</h1>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#f44336', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Sair
        </button>
      </header>

      {/* Seção com logo React e botão incrementador de cliques para demonstração */}
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', padding: '0 20px 12px 20px', gap: 8 }}>
        <img src={reactLogo} style={{ height: 28 }} alt="React" />
        <button onClick={() => setCount(c => c + 1)} style={{ padding: '6px 12px' }}>Clicks: {count}</button>
      </div>

      <main style={{ padding: 20 }}>
        {/* Seção superior: três cartões com estatísticas principais (usuários totais, ativos e novos) */}
        <section style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <StatCard title="Total users" value={stats.totalUsers} diff={2.4} />
          <StatCard title="Active now" value={stats.activeUsers} diff={-1.2} />
          <StatCard title="New today" value={stats.newToday} diff={2.4} />
        </section>

        {/* Seção principal: gráfico de engajamento à esquerda e lista de atividades recentes à direita */}
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
