// Página de dashboard: mostra estatísticas simples, um gráfico placeholder e atividade recente.
// Este arquivo usa estilos inline para um protótipo rápido; considere mover os estilos para `App.css`.
import { useState, useMemo, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'
import SidebarMenu from './components/SidebarMenu.jsx';

// Componente principal do dashboard. Usa dados mock locais (`stats` e `recent`).
// Substitua useMemo/useState por chamadas à API quando os endpoints estiverem prontos.
function Arquivo() {
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

  return (
    <div className="dashboard">
      {/* Sidebar vertical */}
      <SidebarMenu userName={userName} userEmail={userEmail} />

      {/* Área principal */}
      <div style={{ padding: '20px' }}>
        <h1>Página de Arquivos</h1>
        <p>Esta é a página para gerenciar arquivos.</p>
        <h1>🎓💼💻🏢🏠📘🗄🖥📝🔒</h1>
        <Link to="/page17">Voltar ao Dashboard</Link>
      </div>
    </div>
  )
}

export default Arquivo
