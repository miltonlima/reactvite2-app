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
  const alunoAllowedPaths = new Set([
    '/page17',
    '/home2',
    '/inscricao',
    '/avaliacao',
    '/arquivo',
    '/mensagem',
    '#',
  ]);
  const menuItems = [
    { name: 'home', icon: '🏠', path: '/page17' },
    { name: 'Dashbord', icon: '📊', path: '/home2' },
    { name: 'Aluno', icon: '🔎', path: '/aluno' },
    { name: 'Modalidade', icon: '📝', path: '/modalidade' },
    { name: 'Curso', icon: '📗', path: '/turma' },
    { name: 'Inscrição', icon: '📝', path: '/inscricao' },
    { name: 'Módulo / Aula', icon: '🧑', path: '/professor/conteudo' },
    { name: 'Prova', icon: '🎓', path: '/avaliacao' },
    { name: 'Banco de Questões', icon: '📋', path: '/banco-questoes' },
    { name: 'Prova / Banco', icon: '🧪', path: '/prova-banco' },
    { name: 'Arquivo', icon: '📁', path: '/arquivo' },
    { name: 'Mensagem', icon: '✉️', path: '/mensagem' },
    { name: 'Notificação', icon: '🔔', path: '#' },
    { name: 'Localização', icon: '📍', path: '#' },
    { name: 'Logs', icon: '📊', path: '#' }
  ].filter((item) => !isAlunoUser(userType) || alunoAllowedPaths.has(item.path));

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
