import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE } from './config/apiBase';
import './Inscricao.css';

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
  const [success, setSuccess] = useState('');
  const [inscrevendoTurmaId, setInscrevendoTurmaId] = useState(null);
  const [turmasInscritas, setTurmasInscritas] = useState(() => new Set());

  useEffect(() => {
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

  async function handleInscricao(turma) {
    try {
      setSuccess('');
      setError('');

      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        setError('Faça login para realizar a inscrição.');
        return;
      }

      const user = JSON.parse(rawUser);
      const alunoId = Number(user?.id);
      if (!alunoId) {
        setError('Usuário inválido para inscrição. Faça login novamente.');
        return;
      }

      setInscrevendoTurmaId(turma.id);

      const data = await request('/api/inscricoes', {
        method: 'POST',
        body: JSON.stringify({ alunoId, turmaId: turma.id }),
      });

      setSuccess(data?.mensagem || `Inscrição realizada com sucesso em ${turma.nomeTurma}.`);
      setTurmasInscritas((previous) => new Set([...previous, Number(turma.id)]));
    } catch (err) {
      if (err?.status === 409 || /já\s+está\s+inscrito/i.test(err?.message || '')) {
        setError('');
        setSuccess(`Você já está inscrito em ${turma.nomeTurma}.`);
        setTurmasInscritas((previous) => new Set([...previous, Number(turma.id)]));
      } else {
        setError(err.message || 'Não foi possível concluir a inscrição.');
      }
    } finally {
      setInscrevendoTurmaId(null);
    }
  }

  return (
    <div className="inscricao-page">
      <header className="inscricao-hero">
        <div className="inscricao-hero-copy">
          <span className="inscricao-kicker">Inscrições abertas</span>
          <h1>Cursos disponíveis para inscrição</h1>
          <p>
            Escolha uma turma ativa, confira o período do curso e conclua sua inscrição em poucos segundos.
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
        {success && <p className="inscricao-alert inscricao-alert-success">{success}</p>}
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
                        const destacado = selectedTurmaId === turma.id;
                        const jaInscrito = turmasInscritas.has(Number(turma.id));

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

                            <button
                              type="button"
                              className="inscricao-action"
                              onClick={() => handleInscricao(turma)}
                              disabled={jaInscrito || inscrevendoTurmaId === turma.id}
                            >
                              {jaInscrito
                                ? 'Inscrito'
                                : inscrevendoTurmaId === turma.id
                                  ? 'Inscrevendo...'
                                  : 'Inscrever-se'}
                            </button>
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
