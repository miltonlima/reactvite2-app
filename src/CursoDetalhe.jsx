import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { API_BASE } from './config/apiBase';
import './CursoDetalhe.css';

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
      return [
        baseUserAgent,
        hints.platform ? `platform=${hints.platform}` : '',
        hints.platformVersion ? `platformVersion=${hints.platformVersion}` : '',
        hints.model ? `model=${hints.model}` : '',
        browserVersion ? `browser=${browserVersion}` : '',
      ].filter(Boolean).join(' | ');
    }
  } catch {
    return baseUserAgent || null;
  }

  return baseUserAgent || null;
}

function getClientPlatform() {
  return typeof navigator === 'undefined' ? null : navigator.userAgentData?.platform || navigator.platform || null;
}

async function logCourseDetailEvent({ action, statusCode = 200, httpMethod = 'GET', metadata = {} }) {
  try {
    const user = getStoredUser();
    const clientUserAgent = await getClientUserAgent();
    const clientPlatform = getClientPlatform();

    await fetch(`${API_BASE}/api/access-logs`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: Number(user?.id) || null,
        userEmail: user?.email || null,
        userName: user?.full_name || user?.fullName || user?.name || null,
        userType: user?.tipo || user?.tipoUsuario || user?.userType || user?.perfil || user?.role || null,
        sessionId: getAccessSessionId(),
        pagePath: window.location.pathname,
        pageTitle: 'Detalhes do curso',
        action,
        httpMethod,
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'CursoDetalhe',
          route: '/curso/:turmaId',
          clientPlatform,
          ...metadata,
        },
      }),
    });
  } catch (error) {
    console.warn('Falha ao registrar log de detalhes do curso:', error);
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

function formatDate(value) {
  if (!value) return 'Não informado';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Não informado';
  return parsed.toLocaleDateString('pt-BR');
}

function formatPrice(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getAlunoIdFromStorage() {
  const user = getStoredUser();
  const alunoId = Number(user?.id);
  return alunoId > 0 ? alunoId : null;
}

function CursoDetalhe() {
  const { turmaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const initialTurma = location.state?.turma || null;
  const initialModalidade = location.state?.modalidade || null;

  const [turma, setTurma] = useState(initialTurma);
  const [loading, setLoading] = useState(!initialTurma);
  const [saving, setSaving] = useState(false);
  const [jaInscrito, setJaInscrito] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const alunoId = useMemo(() => getAlunoIdFromStorage(), []);
  const numericTurmaId = Number(turmaId);

  useEffect(() => {
    loadCourse();
    logCourseDetailEvent({
      action: 'course_detail_view',
      statusCode: 200,
      httpMethod: 'GET',
      metadata: {
        turmaId: numericTurmaId || null,
      },
    });
  }, [turmaId]);

  async function loadCourse() {
    try {
      setLoading(true);
      setError('');

      const turmas = await request('/api/turmas');
      const found = Array.isArray(turmas)
        ? turmas.find((item) => Number(item.id) === numericTurmaId)
        : null;

      if (!found) {
        setError('Curso não encontrado.');
        setTurma(null);
        return;
      }

      setTurma(found);

      if (alunoId) {
        try {
          const inscricoes = await request(`/api/inscricoes/aluno/${alunoId}`);
          setJaInscrito(
            Array.isArray(inscricoes) && inscricoes.some((item) => Number(item?.turmaId) === numericTurmaId)
          );
        } catch {
          setJaInscrito(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar detalhes do curso.');
    } finally {
      setLoading(false);
    }
  }

  async function handleInscricao() {
    if (!turma) return;

    if (!alunoId) {
      setError('Faça login para realizar a inscrição.');
      await logCourseDetailEvent({
        action: 'course_enrollment_failed',
        statusCode: 401,
        httpMethod: 'POST',
        metadata: {
          turmaId: numericTurmaId,
          turmaNome: turma.nomeTurma,
          reason: 'missing_login',
        },
      });
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data = await request('/api/inscricoes', {
        method: 'POST',
        body: JSON.stringify({ alunoId, turmaId: numericTurmaId }),
      });

      setJaInscrito(true);
      setSuccess(data?.mensagem || `Inscrição realizada em ${turma.nomeTurma}.`);
      await logCourseDetailEvent({
        action: 'course_enrollment_success',
        statusCode: 201,
        httpMethod: 'POST',
        metadata: {
          turmaId: numericTurmaId,
          turmaNome: turma.nomeTurma,
          modalidadeId: turma.modalidadeId,
          modalidadeNome: turma.modalidadeNome,
          inscricaoId: data?.inscricao?.id || null,
        },
      });
    } catch (err) {
      if (err?.status === 409) {
        setJaInscrito(true);
        setSuccess(`Você já está inscrito em ${turma.nomeTurma}.`);
      } else {
        setError(err.message || 'Não foi possível concluir a inscrição.');
      }

      await logCourseDetailEvent({
        action: err?.status === 409 ? 'course_enrollment_existing' : 'course_enrollment_failed',
        statusCode: err?.status || 500,
        httpMethod: 'POST',
        metadata: {
          turmaId: numericTurmaId,
          turmaNome: turma.nomeTurma,
          modalidadeId: turma.modalidadeId,
          modalidadeNome: turma.modalidadeNome,
          reason: err.message || 'enrollment_error',
        },
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="course-detail-page"><p>Carregando detalhes do curso...</p></main>;
  }

  if (!turma) {
    return (
      <main className="course-detail-page">
        <p className="error">Erro: {error || 'Curso não encontrado.'}</p>
        <Link to="/page17" className="course-secondary-action">Voltar aos cursos</Link>
      </main>
    );
  }

  return (
    <main className="course-detail-page">
      <button type="button" className="course-back-button" onClick={() => navigate('/page17')}>
        Voltar aos cursos
      </button>

      <section className="course-detail-hero">
        <div className="course-detail-copy">
          <span>{turma.modalidadeNome || initialModalidade?.courseName || 'Curso'}</span>
          <h1>{turma.nomeTurma}</h1>
          <p>{turma.descricao || 'Este curso ainda não possui uma descrição cadastrada.'}</p>
        </div>

        {turma.imgCurso ? (
          <img src={turma.imgCurso} alt={turma.nomeTurma} />
        ) : (
          <div className="course-image-placeholder">Curso</div>
        )}
      </section>

      {error && <p className="error">Erro: {error}</p>}
      {success && <p className="success">{success}</p>}

      <section className="course-detail-grid">
        <article>
          <span>Inscrições</span>
          <strong>{formatDate(turma.inicioInscricao)} até {formatDate(turma.fimInscricao)}</strong>
        </article>
        <article>
          <span>Período do curso</span>
          <strong>{formatDate(turma.dataInicio)} até {formatDate(turma.dataFim)}</strong>
        </article>
        <article>
          <span>Investimento</span>
          <strong>{formatPrice(turma.preco)}</strong>
        </article>
        <article>
          <span>Status</span>
          <strong>{turma.active ? 'Ativo' : 'Inativo'}</strong>
        </article>
      </section>

      <section className="course-detail-panel">
        <h2>Sobre o curso</h2>
        <p>{turma.descricao || 'A descrição detalhada poderá ser adicionada pela equipe administrativa.'}</p>

        <div className="course-detail-actions">
          {jaInscrito ? (
            <Link to={`/acesso-turma/${numericTurmaId}`} className="course-primary-action">
              Acessar sala
            </Link>
          ) : (
            <button type="button" className="course-primary-action" onClick={handleInscricao} disabled={saving || !turma.active}>
              {saving ? 'Inscrevendo...' : 'Confirmar inscrição'}
            </button>
          )}
          <Link to="/page17" className="course-secondary-action">Ver outros cursos</Link>
        </div>
      </section>
    </main>
  );
}

export default CursoDetalhe;
