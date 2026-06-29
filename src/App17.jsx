
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from './config/apiBase';
import './App17.css';

let apiCapabilitiesPromise = null;
let page17AccessLogged = false;

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
    const rawUser = localStorage.getItem('user');
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

async function logAccessEvent({ action, statusCode = 200, user = null, metadata = {} }) {
  try {
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
        pageTitle: 'Página 17',
        action,
        httpMethod: 'GET',
        referrer: document.referrer || null,
        statusCode,
        metadata: {
          source: 'App17',
          route: '/page17',
          ...metadata,
        },
      }),
    });
  } catch (err) {
    console.warn('Falha ao registrar log de acesso:', err);
  }
}

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

async function getApiCapabilities() {
  if (apiCapabilitiesPromise) {
    return apiCapabilitiesPromise;
  }

  apiCapabilitiesPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/swagger/v1/swagger.json`);
      if (!response.ok) {
        return {
          hasInscricoesByAluno: false,
          hasAlunoDashboard: false,
          hasCreateInscricao: false,
        };
      }

      const swagger = await response.json();
      const paths = swagger?.paths || {};
      const inscricoesPath = paths['/api/inscricoes'];

      return {
        hasInscricoesByAluno: Boolean(paths['/api/inscricoes/aluno/{alunoId}']),
        hasAlunoDashboard: Boolean(paths['/api/alunos/{alunoId}/dashboard']),
        hasCreateInscricao: Boolean(inscricoesPath?.post),
      };
    } catch {
      return {
        hasInscricoesByAluno: false,
        hasAlunoDashboard: false,
        hasCreateInscricao: false,
      };
    }
  })();

  return apiCapabilitiesPromise;
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

function formatDate(value) {
  if (!value) return 'Sem data definida';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem data definida';
  return parsed.toLocaleDateString('pt-BR');
}

function getAlunoIdFromStorage() {
  try {
    const user = getStoredUser();
    const alunoId = Number(user?.id);
    return alunoId > 0 ? alunoId : null;
  } catch {
    return null;
  }
}

function App17() {
  const navigate = useNavigate();
  const [modalidades, setModalidades] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inscricaoMensagem, setInscricaoMensagem] = useState('');
  const [inscrevendoTurmaId, setInscrevendoTurmaId] = useState(null);
  const [alunoId, setAlunoId] = useState(null);
  const [turmasInscritas, setTurmasInscritas] = useState(() => new Set());
  const [busca, setBusca] = useState('');
  const [canCreateInscricao, setCanCreateInscricao] = useState(false);

  useEffect(() => {
    if (!page17AccessLogged) {
      page17AccessLogged = true;
      logAccessEvent({ action: 'page_view', statusCode: 200, user: getStoredUser() });
    }
    loadCatalog();
  }, []);

  async function loadCatalog() {
    try {
      setLoading(true);
      setError('');

      const currentAlunoId = getAlunoIdFromStorage();
      setAlunoId(currentAlunoId);

      const [modalidadesData, turmasData] = await Promise.all([
        request('/api/modalidades'),
        request('/api/turmas'),
      ]);

      setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);
      setTurmas(Array.isArray(turmasData) ? turmasData : []);

      if (currentAlunoId) {
        const capabilities = await getApiCapabilities();
        setCanCreateInscricao(Boolean(capabilities.hasCreateInscricao));

        const inscricoesPromise = capabilities.hasInscricoesByAluno
          ? requestWithFallback(`/api/inscricoes/aluno/${currentAlunoId}`, [])
          : Promise.resolve([]);

        const dashboardPromise = capabilities.hasAlunoDashboard
          ? requestWithFallback(`/api/alunos/${currentAlunoId}/dashboard`, null)
          : Promise.resolve(null);

        const [inscricoesData, dashboardData] = await Promise.all([
          inscricoesPromise,
          dashboardPromise,
        ]);

        const turmaIds = new Set(
          (Array.isArray(inscricoesData) ? inscricoesData : [])
            .map((item) => Number(item?.turmaId))
            .filter((id) => id > 0)
        );
        setTurmasInscritas(turmaIds);
        setDashboard(Array.isArray(dashboardData?.turmas) ? dashboardData.turmas : []);
      } else {
        setCanCreateInscricao(false);
        setTurmasInscritas(new Set());
        setDashboard([]);
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar catálogo de inscrições.');
    } finally {
      setLoading(false);
    }
  }

  const turmasAtivas = useMemo(
    () => turmas.filter((item) => item.active).filter((item) => {
      if (!busca.trim()) return true;
      const termo = busca.trim().toLowerCase();
      return `${item.nomeTurma} ${item.modalidadeNome || ''}`.toLowerCase().includes(termo);
    }),
    [turmas, busca]
  );

  const progressoMap = useMemo(() => {
    const map = new Map();
    for (const item of dashboard) {
      map.set(Number(item.turmaId), item);
    }
    return map;
  }, [dashboard]);

  const continuarAprendendo = useMemo(() => {
    return turmasAtivas
      .filter((item) => turmasInscritas.has(Number(item.id)))
      .map((item) => {
        const progresso = progressoMap.get(Number(item.id));
        return {
          turmaId: Number(item.id),
          turmaNome: item.nomeTurma,
          modalidadeNome: item.modalidadeNome || '',
          percentualProgresso: Number(progresso?.percentualProgresso || 0),
          totalAulas: Number(progresso?.totalAulas || 0),
        };
      });
  }, [progressoMap, turmasAtivas, turmasInscritas]);

  const turmasNaoInscritas = useMemo(
    () => turmasAtivas.filter((item) => !turmasInscritas.has(Number(item.id))),
    [turmasAtivas, turmasInscritas]
  );

  const turmasPorModalidade = useMemo(() => {
    const grouped = new Map();
    for (const turma of turmasNaoInscritas) {
      const key = Number(turma.modalidadeId);
      const current = grouped.get(key) || [];
      grouped.set(key, [...current, turma]);
    }
    return grouped;
  }, [turmasNaoInscritas]);

  async function handleInscricao(modalidade, turma) {
    try {
      setInscricaoMensagem('');
      setError('');

      if (!alunoId) {
        setError('Faça login para realizar a inscrição.');
        return;
      }

      if (!canCreateInscricao) {
        setError('Inscrições indisponíveis no momento. Atualize a API publicada no Render e tente novamente.');
        return;
      }

      setInscrevendoTurmaId(turma.id);

      const data = await request('/api/inscricoes', {
        method: 'POST',
        body: JSON.stringify({ alunoId, turmaId: turma.id }),
      });

      setInscricaoMensagem(
        data?.mensagem || `Inscrição realizada em ${modalidade.courseName} - ${turma.nomeTurma}.`
      );
      setTurmasInscritas((previous) => new Set([...previous, Number(turma.id)]));
      await loadCatalog();
    } catch (err) {
      if (err?.status === 404) {
        setError('Endpoint de inscrição não encontrado em produção. Publique a versão mais recente da API no Render.');
      } else 
      if (err?.status === 409 || /já\s+está\s+inscrito/i.test(err?.message || '')) {
        setError('');
        setInscricaoMensagem(`Você já está inscrito em ${turma.nomeTurma}.`);
        setTurmasInscritas((previous) => new Set([...previous, Number(turma.id)]));
      } else {
        setError(err.message || 'Não foi possível concluir a inscrição.');
      }
    } finally {
      setInscrevendoTurmaId(null);
    }
  }

  return (
    <div className="student-home-page">
      <header className="student-hero">
        <div className="student-hero-copy">
          <span className="student-kicker">Área do aluno</span>
          <h1>Minha Escola Online</h1>
          <p>Encontre seus cursos, acompanhe o progresso e descubra novas oportunidades de aprendizagem.</p>
        </div>
        <div className="student-search-panel">
          <label>
            Buscar curso
            <input
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Nome do curso ou modalidade"
            />
          </label>
        </div>
      </header>

      <section className="student-metrics" aria-label="Resumo do aluno">
        <article>
          <span>Meus cursos</span>
          <strong>{turmasInscritas.size}</strong>
        </article>
        <article>
          <span>Continuar</span>
          <strong>{continuarAprendendo.length}</strong>
        </article>
        <article>
          <span>Cursos abertos</span>
          <strong>{turmasNaoInscritas.length}</strong>
        </article>
        <article>
          <span>Modalidades</span>
          <strong>{modalidades.length}</strong>
        </article>
      </section>

      {loading && <p>Carregando modalidades e cursos...</p>}
      {error && <p className="error">Erro: {error}</p>}
      {inscricaoMensagem && <p className="success">{inscricaoMensagem}</p>}

      {!loading && continuarAprendendo.length > 0 && (
        <section className="student-section">
          <div className="student-section-header">
            <h2>Continuar estudando</h2>
            <span>{continuarAprendendo.length} em andamento</span>
          </div>
          <div className="student-course-grid enrolled">
            {continuarAprendendo.map((item) => (
              <article key={item.turmaId} className="student-course-card">
                <strong>{item.turmaNome}</strong>
                <span>{item.modalidadeNome}</span>
                <div className="student-progress">
                  <div
                    style={{
                      width: `${Number(item.percentualProgresso || 0)}%`,
                    }}
                  />
                </div>
                <small>
                  {Number(item.percentualProgresso || 0)}% concluído
                  {item.totalAulas > 0 ? (
                    <span>
                      • {item.totalAulas} {item.totalAulas === 1 ? 'aula' : 'aulas'}
                    </span>
                  ) : null}
                </small>
                <button
                  type="button"
                  onClick={() => navigate(`/acesso-turma/${item.turmaId}`)}
                  className="student-primary-action"
                >
                  Continuar curso
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && modalidades.length === 0 && (
        <p>Nenhuma modalidade cadastrada no momento.</p>
      )}

      {!loading && !error && modalidades.map((modalidade) => {
        const cursos = turmasPorModalidade.get(Number(modalidade.id)) || [];

        return (
          <section key={modalidade.id} className="student-section catalog-section">
            <header className="student-section-header">
              <strong>{modalidade.courseName}</strong>
              <span>
                {cursos.length} {cursos.length === 1 ? 'curso' : 'cursos'} disponíveis
              </span>
            </header>

            <div>
              {cursos.length === 0 ? (
                <p className="student-empty">Ainda não há cursos ativos vinculados a esta modalidade.</p>
              ) : (
                <div className="student-course-grid">
                  {cursos.map((turma) => {
                    const turmaId = Number(turma.id);
                    const jaInscrito = turmasInscritas.has(turmaId);

                    return (
                      <article
                        key={turma.id}
                        className="student-course-card available"
                      >
                        <strong>{turma.nomeTurma}</strong>
                        <span>{modalidade.courseName}</span>
                        <div className="student-date-row">
                          <span>Início: {formatDate(turma.dataInicio)}</span>
                          <span>Fim: {formatDate(turma.dataFim)}</span>
                        </div>

                        {jaInscrito && progressoMap.has(turmaId) && (
                          <small>
                            Progresso: {Number(progressoMap.get(turmaId)?.percentualProgresso || 0)}%
                          </small>
                        )}

                        {jaInscrito ? (
                          <Link
                            to={`/acesso-turma/${turmaId}`}
                            className="student-primary-action"
                          >
                            Acessar sala
                          </Link>
                        ) : (
                          <Link
                            to="#"
                            onClick={(event) => {
                              event.preventDefault();
                              if (!canCreateInscricao || inscrevendoTurmaId === turma.id) return;
                              handleInscricao(modalidade, turma);
                            }}
                            style={{
                              cursor: !canCreateInscricao || inscrevendoTurmaId === turma.id ? 'default' : 'pointer',
                              opacity: !canCreateInscricao || inscrevendoTurmaId === turma.id ? 0.75 : 1,
                            }}
                            className="student-primary-action"
                          >
                            {!canCreateInscricao
                              ? 'Inscrição indisponível'
                              : inscrevendoTurmaId === turma.id
                                ? 'Inscrevendo...'
                                : 'Inscrever-se'}
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
  );
}

export default App17;
