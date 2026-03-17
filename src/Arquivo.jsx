// A lógica de autenticação, estado do usuário e o SidebarMenu foram movidos para o componente Layout.
// Este componente agora apenas renderiza o conteúdo específico da página.
import { Link } from 'react-router-dom';

function Arquivo() {
  return (
    <>
      {/* O div "dashboard" e o SidebarMenu são renderizados pelo componente Layout pai */}
      <div style={{ padding: '20px' }}>
        <h1>Página de Arquivos</h1>
        <p>Esta é a página para gerenciar arquivos.</p>
        <br />
        {/* Este link deve levar de volta à página principal do dashboard, que é /page17 */}
        <Link to="/page17">Voltar ao Dashboard</Link>
      </div>
    </>
  );
}

export default Arquivo;
