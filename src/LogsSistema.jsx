import { useEffect, useMemo, useState } from 'react';
import './LogsSistema.css';
import { API_BASE } from './config/apiBase';

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(body?.mensagem || body?.detail || body?.message || response.statusText);
  }

  return body;
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('pt-BR');
}

function summarizeUserAgent(value) {
  if (!value) return '-';
  return String(value).split('|')[0].trim();
}

function LogsSistema() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [pagePath, setPagePath] = useState('');
  const [limit, setLimit] = useState('100');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  const actionOptions = useMemo(() => (
    [...new Set(logs.map((item) => item.action).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'))
  ), [logs]);

  const pageOptions = useMemo(() => (
    [...new Set(logs.map((item) => item.pagePath).filter(Boolean))]
      .sort((a, b) => String(a).localeCompare(String(b), 'pt-BR'))
  ), [logs]);

  async function loadLogs(event) {
    event?.preventDefault();

    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (action) params.set('action', action);
      if (pagePath) params.set('pagePath', pagePath);
      params.set('limit', limit || '100');

      const data = await request(`/api/access-logs?${params.toString()}`);
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os logs.');
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setSearch('');
    setAction('');
    setPagePath('');
    setLimit('100');
  }

  return (
    <main className="logs-page">
      <section className="logs-header">
        <span>Auditoria</span>
        <h1>Logs do sistema</h1>
        <p>Consulte acessos, ações executadas, página acessada, usuário, IP e data/hora dos registros.</p>
      </section>

      <form className="logs-filters" onSubmit={loadLogs}>
        <label className="logs-search-field">
          Buscar
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Usuário, e-mail, página, ação ou IP"
          />
        </label>

        <label>
          Ação
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="">Todas</option>
            {actionOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Página
          <select value={pagePath} onChange={(event) => setPagePath(event.target.value)}>
            <option value="">Todas</option>
            {pageOptions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          Limite
          <select value={limit} onChange={(event) => setLimit(event.target.value)}>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="500">500</option>
          </select>
        </label>

        <div className="logs-actions">
          <button type="submit" disabled={loading}>{loading ? 'Consultando...' : 'Consultar'}</button>
          <button type="button" className="logs-secondary-button" onClick={clearFilters} disabled={loading}>
            Limpar
          </button>
        </div>
      </form>

      {error && <p className="logs-message error">Erro: {error}</p>}

      <section className="logs-table-card">
        <div className="logs-table-header">
          <div>
            <span>Resultado</span>
            <strong>{logs.length} registro(s)</strong>
          </div>
        </div>

        {loading ? (
          <p className="logs-empty">Carregando logs...</p>
        ) : logs.length === 0 ? (
          <p className="logs-empty">Nenhum log encontrado.</p>
        ) : (
          <div className="logs-table-wrap">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data/hora</th>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Página</th>
                  <th>Ação</th>
                  <th>IP</th>
                  <th>Status</th>
                  <th>User agent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td data-label="ID">{log.id}</td>
                    <td data-label="Data/hora">{formatDate(log.createdAt)}</td>
                    <td data-label="Usuário">
                      <strong>{log.userName || '-'}</strong>
                      <span>{log.userEmail || '-'}</span>
                    </td>
                    <td data-label="Perfil">{log.userType || '-'}</td>
                    <td data-label="Página">
                      <strong>{log.pageTitle || '-'}</strong>
                      <span>{log.pagePath}</span>
                    </td>
                    <td data-label="Ação">{log.action}</td>
                    <td data-label="IP">{log.ipAddress || '-'}</td>
                    <td data-label="Status">{log.statusCode || '-'}</td>
                    <td data-label="User agent">{summarizeUserAgent(log.userAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default LogsSistema;
