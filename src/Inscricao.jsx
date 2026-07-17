import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE } from './config/apiBase';
import './Inscricao.css';

let inscricaoLastPageViewAt = 0;

async function request(path, options = {}) {
  const hasBody = typeof options.body !== 'undefined';
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(data?.mensagem || data?.detail || data?.message || response.statusText);
    error.status = response.status;
    throw error;
  }

  return data;
}

async function requestWithFallback(path, fallbackValue, options = {}) {
  try {
    return await request(path, options);
  } catch (error) {
    if (error?.status === 404) {
      return fallbackValue;
    }
    throw error;
  }
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

async function logInscricaoEvent({ action, statusCode = 200, httpMethod = 'POST', metadata = {} }) {
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
        pageTitle: 'Inscrições',
        action,
        httpMethod,
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'Inscricao',
          route: '/inscricao',
          clientPlatform,
          ...metadata,
        },
      }),
    });
  } catch (err) {
    console.warn('Falha ao registrar log de inscrição:', err);
  }
}

function formatDate(value) {
  if (!value) return 'Sem data definida';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem data definida';
  return parsed.toLocaleDateString('pt-BR');
}

function Inscricao() {
  const [searchParams] = useSearchParams();
  const selectedModalidadeId = Number(searchParams.get('modalidadeId') || 0);
  const selectedTurmaId = Number(searchParams.get('turmaId') || 0);

  const [modalidades, setModalidades] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [turmasInscritas, setTurmasInscritas] = useState(() => new Set());

  useEffect(() => {
    const now = Date.now();
    if (now - inscricaoLastPageViewAt >= 1000) {
      inscricaoLastPageViewAt = now;
      logInscricaoEvent({
        action: 'page_view',
        statusCode: 200,
        httpMethod: 'GET',
        metadata: {
          modalidadeId: selectedModalidadeId || null,
          turmaId: selectedTurmaId || null,
        },
      });
    }

    loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      setError('');

      const [modalidadesData, turmasData] = await Promise.all([
        request('/api/modalidades'),
        request('/api/turmas'),
      ]);

      setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);
      setTurmas(Array.isArray(turmasData) ? turmasData : []);

      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        setTurmasInscritas(new Set());
        return;
      }

      const user = JSON.parse(rawUser);
      const alunoId = Number(user?.id);
      if (!alunoId) {
        setTurmasInscritas(new Set());
        return;
      }

      const inscricoesData = await requestWithFallback(`/api/inscricoes/aluno/${alunoId}`, []);
      const turmaIds = new Set(
        (Array.isArray(inscricoesData) ? inscricoesData : [])
          .map((item) => Number(item?.turmaId))
          .filter((id) => id > 0)
      );
      setTurmasInscritas(turmaIds);
    } catch (err) {
      setError(err.message || 'Falha ao carregar cursos disponíveis para inscrição.');
    } finally {
      setLoading(false);
    }
  }

  const turmasAtivas = useMemo(() => turmas.filter((item) => item.active), [turmas]);

  const turmasPorModalidade = useMemo(() => {
    const grouped = new Map();
    for (const turma of turmasAtivas) {
      const key = Number(turma.modalidadeId);
      const current = grouped.get(key) || [];
      grouped.set(key, [...current, turma]);
    }
    return grouped;
  }, [turmasAtivas]);

  const modalidadesExibidas = useMemo(() => {
    if (!selectedModalidadeId) return modalidades;
    return modalidades.filter((m) => Number(m.id) === selectedModalidadeId);
  }, [modalidades, selectedModalidadeId]);

  const totalModalidadesComCursos = useMemo(
    () => modalidades.filter((modalidade) => (turmasPorModalidade.get(Number(modalidade.id)) || []).length > 0).length,
    [modalidades, turmasPorModalidade]
  );

  return (
    <div className="inscricao-page">
      <header className="inscricao-hero">
        <div className="inscricao-hero-copy">
          <span className="inscricao-kicker">Inscrições abertas</span>
          <h1>Cursos disponíveis para inscrição</h1>
          <p>
            Escolha um curso ativo, confira os detalhes e conclua sua inscrição na página do curso.
          </p>
          <Link to="/page17" className="inscricao-back-link">Voltar para catálogo</Link>
        </div>

        <div className="inscricao-summary" aria-label="Resumo das inscrições">
          <article>
            <span>Cursos ativos</span>
            <strong>{turmasAtivas.length}</strong>
          </article>
          <article>
            <span>Modalidades</span>
            <strong>{totalModalidadesComCursos}</strong>
          </article>
          <article>
            <span>Minhas inscrições</span>
            <strong>{turmasInscritas.size}</strong>
          </article>
        </div>
      </header>

      <div className="inscricao-feedback" aria-live="polite">
        {loading && <p className="inscricao-state">Carregando cursos disponíveis...</p>}
        {error && <p className="inscricao-alert inscricao-alert-error">Erro: {error}</p>}
      </div>

      {!loading && !error && modalidadesExibidas.length === 0 && (
        <p className="inscricao-empty">Nenhuma modalidade encontrada para inscrição.</p>
      )}

      {!loading && !error && (
        <div className="inscricao-modalidades">
          {modalidadesExibidas.map((modalidade) => {
            const cursos = turmasPorModalidade.get(Number(modalidade.id)) || [];

            return (
              <section key={modalidade.id} className="inscricao-section">
                <header className="inscricao-section-header">
                  <div>
                    <span>Modalidade</span>
                    <h2>{modalidade.courseName}</h2>
                  </div>
                  <span className="inscricao-count">
                    {cursos.length} {cursos.length === 1 ? 'curso' : 'cursos'} disponíveis
                  </span>
                </header>

                <div className="inscricao-section-body">
                  {cursos.length === 0 ? (
                    <p className="inscricao-empty">Ainda não há cursos ativos vinculados a esta modalidade.</p>
                  ) : (
                    <div className="inscricao-course-grid">
                      {cursos.map((turma) => {
                        const turmaId = Number(turma.id);
                        const destacado = selectedTurmaId === turmaId;
                        const jaInscrito = turmasInscritas.has(turmaId);

                        return (
                          <article
                            key={turma.id}
                            className={`inscricao-course-card${destacado ? ' is-highlighted' : ''}${jaInscrito ? ' is-enrolled' : ''}`}
                          >
                            <div className="inscricao-course-top">
                              <span className="inscricao-course-status">
                                {jaInscrito ? 'Inscrito' : destacado ? 'Selecionado' : 'Disponível'}
                              </span>
                              <strong>{turma.nomeTurma}</strong>
                            </div>

                            <dl className="inscricao-dates">
                              <div>
                                <dt>Início</dt>
                                <dd>{formatDate(turma.dataInicio)}</dd>
                              </div>
                              <div>
                                <dt>Fim</dt>
                                <dd>{formatDate(turma.dataFim)}</dd>
                              </div>
                            </dl>

                            {jaInscrito ? (
                              <Link to={`/acesso-turma/${turmaId}`} className="inscricao-action">
                                Acessar sala
                              </Link>
                            ) : (
                              <Link
                                to={`/curso/${turmaId}`}
                                state={{ turma, modalidade }}
                                className="inscricao-action"
                              >
                                Inscrever-se
                              </Link>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Inscricao;
