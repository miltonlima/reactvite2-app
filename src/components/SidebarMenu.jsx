// src/components/SidebarMenu.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// O menu da barra lateral é um componente de apresentação simples.
// Ele recebe `userName` e `userEmail` como props para exibir os detalhes do perfil.
// Os itens de navegação são agora links que usam React Router.
function isAlunoUser(userType) {
  const normalized = String(userType || '').trim().toLowerCase();
  return ['aluno', 'student', 'estudante'].includes(normalized);
}

function formatUserProfile(userType) {
  const normalized = String(userType || '').trim().toLowerCase();
  const labels = {
    aluno: 'Aluno',
    estudante: 'Aluno',
    student: 'Aluno',
    professor: 'Professor',
    teacher: 'Professor',
    admin: 'Administrador',
    administrador: 'Administrador',
  };
  return labels[normalized] || userType || 'Perfil não informado';
}

function getUserInitials(userName, userEmail) {
  const nameParts = String(userName || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  return String(userEmail || 'U').slice(0, 2).toUpperCase();
}

function SidebarMenu({ userName, userEmail, userType, userPhoto, isMobileOpen, onNavigate, onProfileClick }) {
  const location = useLocation();
  const menuItems = [
    { name: 'home', icon: '🏠', path: '/page17' },
    { name: 'Dashbord', icon: '📊', path: '/home2' },
    { name: 'Alunos', icon: '🔎', path: '/aluno' },
    { name: 'Modalidades', icon: '📝', path: '/modalidade' },
    { name: 'Cursos', icon: '📗', path: '/turma' },
    { name: 'Inscrições', icon: '📝', path: '/inscricao' },
    { name: 'Módulos / Aulas', icon: '🧑', path: '/professor/conteudo' },
    { name: 'Avaliações', icon: '🎓', path: '/avaliacao' },
    { name: 'Banco de questões', icon: '📋', path: '/banco-questoes' },
    { name: 'Arquivos', icon: '📁', path: '/arquivo' },
    { name: 'Mensagens', icon: '✉️', path: '/mensagem' },
    { name: 'Notificações', icon: '🔔', path: '#' },
    { name: 'Localizações', icon: '📍', path: '#' },
    { name: 'Gráficos', icon: '📊', path: '#' }
  ].filter((item) => !(isAlunoUser(userType) && item.path === '/modalidade'));

  return (
    <aside className={`dashboard-sidebar ${isMobileOpen ? 'open' : ''}`}>
      <div className="profile">
        <div className="avatar">
          {userPhoto ? <img src={userPhoto} alt="" /> : <span>{getUserInitials(userName, userEmail)}</span>}
        </div>
        <div className="name">{userName}</div>
        <div className="email">{userEmail}</div>
        <button type="button" className="profile-type profile-edit-button" onClick={onProfileClick}>
          {formatUserProfile(userType)}
        </button>
      </div>
      <nav>
        {menuItems.map(item => {
          const isActive = item.path !== '#' && (
            location.pathname === item.path ||
            (item.path !== '/page17' && location.pathname.startsWith(`${item.path}/`))
          );

          return (
            <Link
              to={item.path}
              key={item.name}
              className={`item ${isActive ? 'active' : ''}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
              onClick={onNavigate}
            >
              <span className="icon">{item.icon}</span>
              <span className="item-label">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default SidebarMenu;
