import { useEffect, useState, createContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';

// Cria um Context para compartilhar a função de logout com componentes filhos.
export const AuthContext = createContext(null);

function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/page15');
    } else {
      setIsAuthenticated(true);
      const user = JSON.parse(userData);
      setUserName(user.full_name || 'Usuário');
      setUserEmail(user.email || '');
    }
  }, [navigate]);

  // Função de logout que será compartilhada via Context.
  function handleLogout() {
    const shouldLogout = window.confirm('Deseja realmente deslogar da plataforma?');
    if (!shouldLogout) {
      return;
    }

    localStorage.removeItem('user');
    navigate('/page15');
  }

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 900) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ handleLogout }}>
      <div className="dashboard">
        <SidebarMenu
          userName={userName}
          userEmail={userEmail}
          isMobileOpen={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
        />
        <button
          type="button"
          className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
          aria-label="Fechar menu lateral"
          onClick={() => setSidebarOpen(false)}
        />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-header-left">
              <button
                type="button"
                className="mobile-menu-toggle"
                aria-label="Abrir menu"
                onClick={() => setSidebarOpen(true)}
              >
                Menu
              </button>
              <h2>Painel</h2>
            </div>
            <button onClick={handleLogout} className="logout-button">Sair</button>
          </header>
          {/* O Outlet renderiza o componente filho (ex: App17) diretamente aqui */}
          <Outlet />
        </main>
      </div>
    </AuthContext.Provider>
  );
}

export default Layout;
