// Página de dashboard: mostra estatísticas simples, um gráfico placeholder e atividade recente.
// Este arquivo usa estilos inline para um protótipo rápido; considere mover os estilos para `App.css`.
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'
import SidebarMenu from './components/SidebarMenu.jsx';

// Pequeno componente reutilizável de cartão de estatística exibido no cabeçalho do dashboard.
// Props:
// - title: rótulo exibido acima do valor principal
// - value: número ou valor principal da estatística
// - diff: variação percentual opcional (positiva verde, negativa vermelha)
function StatCard({ title, value, diff }) {
  return (
    <div className="stat-card">
      <div className="title">{title}</div>
      <div className="value">{value}</div>
      {diff !== undefined && (
        <div className={`diff ${diff >= 0 ? 'positive' : 'negative'}`}>
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
    <div className="chart-placeholder">
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
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate()

  // Protege a página: redireciona para login se usuário não estiver autenticado
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/page15');
    } else {
      setIsAuthenticated(true);
      const user = JSON.parse(userData);
      // O endpoint de login retorna `full_name` e `email`
      setUserName(user.full_name || 'Usuário');
      setUserEmail(user.email || '');
    }
  }, [navigate]);

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
    <div className="dashboard">
      {/* Sidebar vertical */}
      <SidebarMenu userName={userName} userEmail={userEmail} />

      {/* Área principal */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <h2>Dashboard User</h2>
          <button onClick={handleLogout} className="logout-button">Sair</button>
        </header>

        <section className="dashboard-content">
          {/* cartões grandes de métricas */}
          <div className="dashboard-stats">
            <div className="card primary">
              <div>Earning</div>
              <div className="card-value">$ 628</div>
            </div>
            <div className="card-metric">
              <div>Share</div>
              <div className="card-value">2434</div>
            </div>
            <div className="card-metric">
              <div>Likes</div>
              <div className="card-value">1259</div>
            </div>
            <div className="card-metric">
              <div>Rating</div>
              <div className="card-value">8,5</div>
            </div>
          </div>

          {/* gráficos de exemplo */}
          <div className="dashboard-graphs">
            <div className="graph">
              <h3>Engagement Chart</h3>
              <ChartPlaceholder />
            </div>
          </div>

          {/* Atividade recente em largura total abaixo dos gráficos */}
          <div className="dashboard-activity-full">
            <h3>Recent activity</h3>
            <ul>
              {recent.map(r => (
                <li key={r.id}>
                  <div className="user-name">{r.user}</div>
                  <div className="user-action">{r.action} · {r.when}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App17
