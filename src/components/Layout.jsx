import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import SidebarMenu from './SidebarMenu';

function getUserType(user) {
  return String(
    user?.tipo ||
    user?.tipoUsuario ||
    user?.tipo_usuario ||
    user?.userType ||
    user?.user_type ||
    user?.perfil ||
    user?.role ||
    ''
  ).trim().toLowerCase();
}

function isAlunoUser(userType) {
  return ['aluno', 'student', 'estudante'].includes(userType);
}

function getStoredUser() {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => getStoredUser());
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(user);
  const userName = user?.full_name || 'Usuário';
  const userEmail = user?.email || '';
  const userType = getUserType(user);

  useEffect(() => {
    if (!user) {
      navigate('/page15', { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAlunoUser(userType) && location.pathname.startsWith('/modalidade')) {
      navigate('/page17', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, userType]);

  // Função de logout que será compartilhada via Context.
  function handleLogout() {
    const shouldLogout = window.confirm('Deseja realmente deslogar da plataforma?');
    if (!shouldLogout) {
      return;
    }

    localStorage.removeItem('user');
    setUser(null);
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
          userType={userType}
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
