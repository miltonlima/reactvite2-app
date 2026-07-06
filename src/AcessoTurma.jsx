import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE } from './config/apiBase';
import './AcessoTurma.css';

const acessoTurmaLastPageViewById = new Map();

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

async function logAccessEvent({ action, statusCode = 200, user = null, metadata = {} }) {
  try {
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
        pageTitle: 'Acesso do Curso',
        action,
        httpMethod: 'GET',
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'AcessoTurma',
          route: '/acesso-turma/:turmaId',
          clientPlatform,
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

function formatDateTime(value) {
  if (!value) return 'Sem registro de data';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem registro de data';
  return parsed.toLocaleString('pt-BR');
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

function sortAulasForAccess(lista) {
  return [...lista].sort((a, b) => {
    const moduloOrdemA = Number.isFinite(Number(a.moduloOrdem)) ? Number(a.moduloOrdem) : Number.MAX_SAFE_INTEGER;
    const moduloOrdemB = Number.isFinite(Number(b.moduloOrdem)) ? Number(b.moduloOrdem) : Number.MAX_SAFE_INTEGER;
    if (moduloOrdemA !== moduloOrdemB) return moduloOrdemA - moduloOrdemB;

    const moduloTituloCompare = String(a.moduloTitulo || '').localeCompare(String(b.moduloTitulo || ''), 'pt-BR');
    if (moduloTituloCompare !== 0) return moduloTituloCompare;

    const ordemA = Number(a.ordem) || 0;
    const ordemB = Number(b.ordem) || 0;
    if (ordemA !== ordemB) return ordemA - ordemB;

    const tituloCompare = String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR');
    if (tituloCompare !== 0) return tituloCompare;

    return (Number(a.id) || 0) - (Number(b.id) || 0);
  });
}

function AcessoTurma() {
  const { turmaId } = useParams();
  const turmaIdNumero = useMemo(() => Number(turmaId), [turmaId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inscricao, setInscricao] = useState(null);
  const [aulas, setAulas] = useState([]);
  const [aulaAtualId, setAulaAtualId] = useState(null);
  const [isCompactLayout, setIsCompactLayout] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [salvandoProgresso, setSalvandoProgresso] = useState(false);

  useEffect(() => {
    const lastPageViewAt = acessoTurmaLastPageViewById.get(turmaIdNumero) || 0;
    const now = Date.now();

    if (turmaIdNumero && now - lastPageViewAt >= 1000) {
      acessoTurmaLastPageViewById.set(turmaIdNumero, now);
      logAccessEvent({
        action: 'page_view',
        statusCode: 200,
        user: getStoredUser(),
        metadata: {
          turmaId: turmaIdNumero,
        },
      });
    }
    loadAcesso();
  }, [turmaIdNumero]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 980px)');
    const updateLayout = () => setIsCompactLayout(mediaQuery.matches);

    updateLayout();
    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  useEffect(() => {
    if (!isCompactLayout) {
      setIsLessonModalOpen(false);
    }
  }, [isCompactLayout]);

  async function loadAcesso() {
    try {
      setLoading(true);
      setError('');

      if (!turmaIdNumero) {
        setError('Curso inválido para acesso.');
        return;
      }

      const alunoId = getAlunoIdFromStorage();
      if (!alunoId) {
        setError('Faça login para acessar o curso.');
        return;
      }

      const inscricoes = await requestWithFallback(`/api/inscricoes/aluno/${alunoId}`, null);
      if (!inscricoes) {
        setError('A API em produção ainda não possui o endpoint de inscrições por aluno. Publique a versão mais recente do back-end.');
        return;
      }

      const lista = Array.isArray(inscricoes) ? inscricoes : [];
      const encontrada = lista.find((item) => Number(item?.turmaId) === turmaIdNumero);

      if (!encontrada) {
        setError('Você não está inscrito neste curso.');
        return;
      }

      setInscricao(encontrada);

      const aulasData = await requestWithFallback(`/api/turmas/${turmaIdNumero}/aulas?alunoId=${alunoId}`, null);
      if (!aulasData) {
        setError('A API em produção ainda não possui o endpoint de aulas do curso. Publique a versão mais recente do back-end.');
        return;
      }

      const aulasLista = sortAulasForAccess(Array.isArray(aulasData) ? aulasData : []);
      setAulas(aulasLista);
      setAulaAtualId(aulasLista[0]?.id || null);
    } catch (err) {
      setError(err.message || 'Não foi possível validar o acesso do curso.');
    } finally {
      setLoading(false);
    }
  }

  const aulaAtual = useMemo(
    () => aulas.find((item) => Number(item.id) === Number(aulaAtualId)) || null,
    [aulas, aulaAtualId]
  );

  const aulaAtualIndex = useMemo(
    () => aulas.findIndex((item) => Number(item.id) === Number(aulaAtual?.id)),
    [aulaAtual, aulas]
  );

  const aulaAnterior = aulaAtualIndex > 0 ? aulas[aulaAtualIndex - 1] : null;
  const proximaAula = aulaAtualIndex >= 0 ? aulas[aulaAtualIndex + 1] : null;

  const resumoProgresso = useMemo(() => {
    const total = aulas.length;
    const concluidas = aulas.filter((item) => item.concluida).length;
    const percentual = total > 0 ? Math.round((concluidas * 100) / total) : 0;
    return { total, concluidas, percentual };
  }, [aulas]);

  const aulasPorModulo = useMemo(() => {
    const grupos = [];
    const gruposPorChave = new Map();

    aulas.forEach((aula, index) => {
      const hasModulo = Boolean(aula.moduloId);
      const key = hasModulo ? `modulo-${aula.moduloId}` : 'sem-modulo';

      if (!gruposPorChave.has(key)) {
        const grupo = {
          key,
          titulo: hasModulo ? aula.moduloTitulo || 'Módulo do curso' : 'Sem módulo',
          aulas: [],
        };
        gruposPorChave.set(key, grupo);
        grupos.push(grupo);
      }

      gruposPorChave.get(key).aulas.push({ ...aula, displayIndex: index + 1 });
    });

    return grupos;
  }, [aulas]);

  async function atualizarConclusao(concluir) {
    if (!aulaAtual || !inscricao) return;

    try {
      setSalvandoProgresso(true);
      setError('');

      const alunoId = getAlunoIdFromStorage();
      if (!alunoId) {
        setError('Faça login novamente para salvar o progresso.');
        return;
      }

      await request(`/api/aulas/${aulaAtual.id}/progresso`, {
        method: 'POST',
        body: JSON.stringify({
          alunoId,
          turmaId: Number(inscricao.turmaId),
          percentual: concluir ? 100 : 0,
          concluida: concluir,
        }),
      });

      setAulas((prev) => prev.map((item) => (
        Number(item.id) === Number(aulaAtual.id)
          ? { ...item, concluida: concluir, percentual: concluir ? 100 : 0 }
          : item
      )));
    } catch (err) {
      setError(err.message || 'Não foi possível atualizar o progresso da aula.');
    } finally {
      setSalvandoProgresso(false);
    }
  }

  function handleSelectAula(id) {
    setAulaAtualId(id);
    if (isCompactLayout) {
      setIsLessonModalOpen(true);
    }
  }

  function renderLessonDetail() {
    if (!aulaAtual) {
      return <span className="acesso-empty">Selecione uma aula para iniciar.</span>;
    }

    return (
      <>
        <div className="lesson-detail-heading">
          <span>{aulaAtual.moduloTitulo || 'Módulo do curso'}</span>
          <strong>{aulaAtual.titulo}</strong>
          <small>{aulaAtual.duracaoMinutos || 0} minutos de estudo</small>
        </div>

        <p>{aulaAtual.descricao || 'Sem descrição cadastrada para esta aula.'}</p>

        {aulaAtual.videoUrl ? (
          <a className="video-link" href={aulaAtual.videoUrl} target="_blank" rel="noreferrer">
            Abrir aula em vídeo
          </a>
        ) : (
          <span className="no-video">Nenhum vídeo vinculado.</span>
        )}

        <div className="lesson-actions">
          <button
            type="button"
            onClick={() => atualizarConclusao(!aulaAtual.concluida)}
            disabled={salvandoProgresso}
            className={aulaAtual.concluida ? 'secondary-action' : 'primary-action'}
          >
            {salvandoProgresso
              ? 'Salvando...'
              : aulaAtual.concluida
                ? 'Desmarcar conclusão'
                : 'Marcar como concluída'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (aulaAnterior) setAulaAtualId(aulaAnterior.id);
            }}
            disabled={!aulaAnterior}
            className="outline-action"
          >
            Voltar aula
          </button>

          <button
            type="button"
            onClick={() => {
              if (proximaAula) setAulaAtualId(proximaAula.id);
            }}
            disabled={!proximaAula}
            className="outline-action"
          >
            Próxima aula
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="acesso-turma-page">
      <header className="acesso-hero">
        <div>
          <span className="acesso-kicker">Área de estudos</span>
          <h1>Acesso do Curso</h1>
          <p>Continue suas aulas, acompanhe o progresso e marque as etapas concluídas.</p>
        </div>
        <Link to="/page17" className="acesso-back-link">Voltar para inscrições</Link>
      </header>

      {loading && <p className="acesso-state">Validando acesso...</p>}
      {!loading && error && <p className="error acesso-state">Erro: {error}</p>}

      {!loading && !error && inscricao && (
        <section className="acesso-shell">
          <div className="acesso-summary">
            <div className="acesso-course-info">
              <strong>{inscricao.turmaNome || `Curso #${inscricao.turmaId}`}</strong>
              <span>{inscricao.modalidadeNome || 'Modalidade não informada'}</span>
            </div>

            <div className="acesso-summary-grid">
              <div>
                <span>Status</span>
                <strong>{inscricao.status || 'ATIVA'}</strong>
              </div>
              <div>
                <span>Inscrição</span>
                <strong>{formatDateTime(inscricao.createdAt)}</strong>
              </div>
              <div>
                <span>Aulas concluídas</span>
                <strong>{resumoProgresso.concluidas}/{resumoProgresso.total}</strong>
              </div>
            </div>

            <div className="acesso-progress-row">
              <div className="acesso-progress-bar" aria-label={`Progresso geral ${resumoProgresso.percentual}%`}>
                <div style={{ width: `${resumoProgresso.percentual}%` }} />
              </div>
              <span>{resumoProgresso.percentual}%</span>
            </div>
          </div>

          <div className="acesso-content-layout">
            <aside className="acesso-lessons">
              <div className="acesso-panel-title">
                <strong>Conteúdo do curso</strong>
                <span>{aulas.length} aula(s)</span>
              </div>
              {aulas.length === 0 && <span className="acesso-empty">Este curso ainda não possui aulas cadastradas.</span>}
              {aulasPorModulo.map((grupo) => (
                <section key={grupo.key} className="acesso-module-group">
                  <div className="acesso-module-title">
                    <strong>{grupo.titulo}</strong>
                    <span>{grupo.aulas.length} aula(s)</span>
                  </div>

                  {grupo.aulas.map((aula) => {
                    const ativa = Number(aulaAtualId) === Number(aula.id);
                    return (
                  <button
                    key={aula.id}
                    type="button"
                    onClick={() => handleSelectAula(aula.id)}
                    className={`acesso-lesson-button ${ativa ? 'active' : ''}`}
                  >
                    <span className={aula.concluida ? 'lesson-status done' : 'lesson-status pending'}>
                      {aula.concluida ? 'Concluída' : 'Pendente'}
                    </span>
                    <div className="lesson-title">Aula {aula.displayIndex}: {aula.titulo}</div>
                    <div className="lesson-meta">
                      {aula.moduloTitulo || 'Módulo'} • {aula.duracaoMinutos || 0} min
                    </div>
                  </button>
                    );
                  })}
                </section>
              ))}
            </aside>

            <article className="acesso-lesson-detail">
              {renderLessonDetail()}
            </article>
          </div>
        </section>
      )}

      {isLessonModalOpen && aulaAtual && (
        <div
          className="acesso-lesson-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsLessonModalOpen(false);
          }}
        >
          <section className="acesso-lesson-modal" role="dialog" aria-modal="true" aria-labelledby="acesso-lesson-modal-title">
            <div className="acesso-lesson-modal-header">
              <div>
                <span>Aula selecionada</span>
                <h2 id="acesso-lesson-modal-title">{aulaAtual.titulo}</h2>
              </div>
              <button type="button" onClick={() => setIsLessonModalOpen(false)}>
                Fechar
              </button>
            </div>
            <div className="acesso-lesson-modal-body">
              {renderLessonDetail()}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AcessoTurma;
