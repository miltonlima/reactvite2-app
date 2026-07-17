import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from './config/apiBase';
import './Home2.css';

let home2LastPageViewAt = 0;

const SUMMARY_CARDS = [
  { key: 'alunos', label: 'Alunos', caption: 'Usuários cadastrados' },
  { key: 'modalidades', label: 'Modalidades', caption: 'Áreas de ensino' },
  { key: 'cursos', label: 'Cursos', caption: 'Turmas disponíveis' },
  { key: 'avaliacoes', label: 'Avaliações', caption: 'Respostas enviadas' },
];

function normalizeCollection(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.mensagem || body?.message || body?.detail || response.statusText;
    throw new Error(message);
  }

  return body;
}

function getAccessSessionId() {
  const storageKey = 'access_session_id';
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const nextId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storageKey, nextId);
  return nextId;
}

function getStoredUser() {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

async function getClientUserAgent() {
  if (typeof navigator === 'undefined') return null;

  const baseUserAgent = navigator.userAgent || '';

  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const hints = await navigator.userAgentData.getHighEntropyValues([
        'platform',
        'platformVersion',
        'model',
        'uaFullVersion',
        'fullVersionList',
      ]);
      const browserVersion = hints.fullVersionList?.map((item) => `${item.brand} ${item.version}`).join(', ') || hints.uaFullVersion;
      const details = [
        baseUserAgent,
        hints.platform ? `platform=${hints.platform}` : '',
        hints.platformVersion ? `platformVersion=${hints.platformVersion}` : '',
        hints.model ? `model=${hints.model}` : '',
        browserVersion ? `browser=${browserVersion}` : '',
      ].filter(Boolean);

      return details.join(' | ');
    }
  } catch {
    return baseUserAgent || null;
  }

  return baseUserAgent || null;
}

function getClientPlatform() {
  return typeof navigator === 'undefined' ? null : navigator.userAgentData?.platform || navigator.platform || null;
}

async function logHome2Event({ action, statusCode = 200, httpMethod = 'POST', metadata = {} }) {
  try {
    const user = getStoredUser();
    const clientUserAgent = await getClientUserAgent();
    const clientPlatform = getClientPlatform();

    await fetch(`${API_BASE}/api/access-logs`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: Number(user?.id) || null,
        userEmail: user?.email || null,
        userName: user?.full_name || user?.fullName || user?.name || null,
        userType: user?.tipo || user?.tipoUsuario || user?.userType || user?.perfil || user?.role || null,
        sessionId: getAccessSessionId(),
        pagePath: window.location.pathname,
        pageTitle: 'Home2',
        action,
        httpMethod,
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'Home2',
          route: '/home2',
          clientPlatform,
          ...metadata,
        },
      }),
    });
  } catch (err) {
    console.warn('Falha ao registrar log do Home2:', err);
  }
}

function getValue(item, ...keys) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
  }
  return 0;
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
}

function formatPercent(value) {
  return Number(value || 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('pt-BR');
}

function ChartPlaceholder({ items }) {
  const max = Math.max(...items.map((item) => Number(item.value) || 0), 1);

  return (
    <div className="home-chart-bars" aria-label="Resumo geral em gráfico de barras">
      {items.map((item) => {
        const value = Number(item.value) || 0;
        const height = Math.max(6, Math.round((value / max) * 100));

        return (
          <div className="home-chart-item" key={item.key}>
            <div className="home-chart-track">
              <div className="home-chart-fill" style={{ '--bar-size': `${height}%` }} />
            </div>
            <strong>{formatNumber(value)}</strong>
            <span>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function Home2() {
  const [summary, setSummary] = useState({
    alunos: 0,
    modalidades: 0,
    cursos: 0,
    avaliacoes: 0,
  });
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const now = Date.now();
    if (now - home2LastPageViewAt < 1000) return;
    home2LastPageViewAt = now;

    logHome2Event({
      action: 'page_view',
      statusCode: 200,
      httpMethod: 'GET',
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [alunosData, modalidadesData, turmasData, avaliacoesData] = await Promise.all([
          request('/api/alunos?includeInactive=true'),
          request('/api/modalidades'),
          request('/api/turmas'),
          request('/api/avaliacoes/respostas'),
        ]);

        if (!active) return;

        const alunos = normalizeCollection(alunosData, 'alunos');
        const modalidades = normalizeCollection(modalidadesData, 'modalidades');
        const turmas = normalizeCollection(turmasData, 'turmas');
        const avaliacoes = normalizeCollection(avaliacoesData, 'avaliacoes');

        setSummary({
          alunos: alunos.length,
          modalidades: modalidades.length,
          cursos: turmas.length,
          avaliacoes: avaliacoes.length,
        });
        setRecentEvaluations(avaliacoes.slice(0, 5));
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Falha ao carregar dados do dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const summaryCards = useMemo(
    () => SUMMARY_CARDS.map((card) => ({ ...card, value: summary[card.key] })),
    [summary]
  );

  return (
    <main className="home-dashboard-page">
      <header className="home-dashboard-hero">
        <div>
          <span className="home-dashboard-kicker">Painel administrativo</span>
          <h1>Resumo da plataforma</h1>
          <p>Acompanhe os principais números do ambiente de ensino em uma visão rápida.</p>
        </div>
        <span className={`home-dashboard-status ${loading ? 'is-loading' : ''}`}>
          {loading ? 'Atualizando dados' : 'Dados atualizados'}
        </span>
      </header>

      {error && <p className="home-dashboard-error">Erro: {error}</p>}

      <section className="home-stat-grid" aria-label="Indicadores principais">
        {summaryCards.map((card, index) => (
          <article className={`home-stat-card ${index === 0 ? 'is-primary' : ''}`} key={card.key}>
            <span>{card.label}</span>
            <strong>{loading ? '...' : formatNumber(card.value)}</strong>
            <p>{card.caption}</p>
          </article>
        ))}
      </section>

      <section className="home-dashboard-main">
        <article className="home-panel">
          <div className="home-panel-header">
            <div>
              <span>Visão geral</span>
              <h2>Distribuição dos dados</h2>
            </div>
          </div>
          <ChartPlaceholder items={summaryCards} />
        </article>

        <article className="home-panel">
          <div className="home-panel-header">
            <div>
              <span>Histórico</span>
              <h2>Avaliações recentes</h2>
            </div>
          </div>

          {loading && <p className="home-empty-state">Carregando dados...</p>}
          {!loading && recentEvaluations.length === 0 && (
            <p className="home-empty-state">Nenhuma avaliação registrada.</p>
          )}
          {!loading && recentEvaluations.length > 0 && (
            <div className="home-evaluation-list">
              {recentEvaluations.map((item) => {
                const totalCorretas = getValue(item, 'totalCorretas', 'total_corretas');
                const totalPerguntas = getValue(item, 'totalPerguntas', 'total_perguntas');
                const percentual = getValue(item, 'percentual');
                const createdAt = item.createdAt || item.created_at;

                return (
                  <div className="home-evaluation-item" key={item.id}>
                    <div>
                      <strong>{item.alunoNome || item.aluno_nome || 'Aluno não informado'}</strong>
                      <span>
                        {formatNumber(totalCorretas)} de {formatNumber(totalPerguntas)} acertos
                        {createdAt ? ` · ${formatDate(createdAt)}` : ''}
                      </span>
                    </div>
                    <b>{formatPercent(percentual)}%</b>
                  </div>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

export default Home2;
