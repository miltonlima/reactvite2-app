import { useEffect, useState, createContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SidebarMenu from './SidebarMenu';

// Cria um Context para compartilhar a função de logout com componentes filhos.
export const AuthContext = createContext(null);

function Layout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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
    localStorage.removeItem('user');
    navigate('/page15');
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ handleLogout }}>
      <div className="dashboard">
        <SidebarMenu userName={userName} userEmail={userEmail} />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <h2>Dashboard User</h2>
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
