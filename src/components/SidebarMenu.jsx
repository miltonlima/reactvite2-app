// src/components/SidebarMenu.jsx
import React from 'react';
import { Link } from 'react-router-dom';

// O menu da barra lateral é um componente de apresentação simples.
// Ele recebe `userName` e `userEmail` como props para exibir os detalhes do perfil.
// Os itens de navegação são agora links que usam React Router.
function SidebarMenu({ userName, userEmail }) {
  const menuItems = [
    { name: 'home', icon: '🏠', path: '/page17' },
    { name: 'Arquivo', icon: '📁', path: '/arquivo' },
    { name: 'Mensagens', icon: '✉️', path: '#' },
    { name: 'Notificação', icon: '🔔', path: '#' },
    { name: 'Localização', icon: '📍', path: '#' },
    { name: 'Gráfico', icon: '📊', path: '#' }
  ];

  return (
    <aside className="dashboard-sidebar">
      <div className="profile">
        <div className="avatar"></div>
        <div className="name">{userName}</div>
        <div className="email">{userEmail}</div>
      </div>
      <nav>
        {menuItems.map(item => (
          <Link to={item.path} key={item.name} className="item" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span className="icon">{item.icon}</span>
            <span className="item-label">{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}

export default SidebarMenu;
