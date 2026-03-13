// src/components/SidebarMenu.jsx
import React from 'react';

// O menu da barra lateral é um componente de apresentação simples.
// Ele recebe `userName` e `userEmail` como props para exibir os detalhes do perfil.
// Os itens de navegação são atualmente dados estáticos.
function SidebarMenu({ userName, userEmail }) {
  const menuItems = [
    { name: 'home', icon: '🏠' },
    { name: 'Arquivo', icon: '📁' },
    { name: 'Mensagens', icon: '✉️' },
    { name: 'Notificação', icon: '🔔' },
    { name: 'Localização', icon: '📍' },
    { name: 'Gráfico', icon: '📊' }
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
          <div key={item.name} className="item">
            <span className="icon">{item.icon}</span>
            <span className="item-label">{item.name}</span>
          </div>
        ))}
      </nav>
    </aside>
  );
}

export default SidebarMenu;
