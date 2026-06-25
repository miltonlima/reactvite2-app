import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_BASE } from './config/apiBase';
import './AcessoTurma.css';

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
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return null;
    const user = JSON.parse(rawUser);
    const alunoId = Number(user?.id);
    return alunoId > 0 ? alunoId : null;
  } catch {
    return null;
  }
}

function AcessoTurma() {
  const { turmaId } = useParams();
  const turmaIdNumero = useMemo(() => Number(turmaId), [turmaId]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inscricao, setInscricao] = useState(null);
  const [aulas, setAulas] = useState([]);
  const [aulaAtualId, setAulaAtualId] = useState(null);
  const [salvandoProgresso, setSalvandoProgresso] = useState(false);

  useEffect(() => {
    loadAcesso();
  }, [turmaIdNumero]);

  async function loadAcesso() {
    try {
      setLoading(true);
      setError('');

      if (!turmaIdNumero) {
        setError('Turma inválida para acesso.');
        return;
      }

      const alunoId = getAlunoIdFromStorage();
      if (!alunoId) {
        setError('Faça login para acessar a turma.');
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
        setError('Você não está inscrito nesta turma.');
        return;
      }

      setInscricao(encontrada);

      const aulasData = await requestWithFallback(`/api/turmas/${turmaIdNumero}/aulas?alunoId=${alunoId}`, null);
      if (!aulasData) {
        setError('A API em produção ainda não possui o endpoint de aulas da turma. Publique a versão mais recente do back-end.');
        return;
      }

      const aulasLista = Array.isArray(aulasData) ? aulasData : [];
      setAulas(aulasLista);
      setAulaAtualId(aulasLista[0]?.id || null);
    } catch (err) {
      setError(err.message || 'Não foi possível validar o acesso da turma.');
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

  const proximaAula = aulaAtualIndex >= 0 ? aulas[aulaAtualIndex + 1] : null;

  const resumoProgresso = useMemo(() => {
    const total = aulas.length;
    const concluidas = aulas.filter((item) => item.concluida).length;
    const percentual = total > 0 ? Math.round((concluidas * 100) / total) : 0;
    return { total, concluidas, percentual };
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

  return (
    <div className="acesso-turma-page">
      <header className="acesso-hero">
        <div>
          <span className="acesso-kicker">Área de estudos</span>
          <h1>Acesso da Turma</h1>
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
              <strong>{inscricao.turmaNome || `Turma #${inscricao.turmaId}`}</strong>
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
                <strong>Conteúdo da turma</strong>
                <span>{aulas.length} aula(s)</span>
              </div>
              {aulas.length === 0 && <span className="acesso-empty">Esta turma ainda não possui aulas cadastradas.</span>}
              {aulas.map((aula, index) => {
                const ativa = Number(aulaAtualId) === Number(aula.id);
                return (
                  <button
                    key={aula.id}
                    type="button"
                    onClick={() => setAulaAtualId(aula.id)}
                    className={`acesso-lesson-button ${ativa ? 'active' : ''}`}
                  >
                    <span className={aula.concluida ? 'lesson-status done' : 'lesson-status pending'}>
                      {aula.concluida ? 'Concluída' : 'Pendente'}
                    </span>
                    <div className="lesson-title">Aula {index + 1}: {aula.titulo}</div>
                    <div className="lesson-meta">
                      {aula.moduloTitulo || 'Módulo'} • {aula.duracaoMinutos || 0} min
                    </div>
                  </button>
                );
              })}
            </aside>

            <article className="acesso-lesson-detail">
              {!aulaAtual ? (
                <span className="acesso-empty">Selecione uma aula para iniciar.</span>
              ) : (
                <>
                  <div className="lesson-detail-heading">
                    <span>{aulaAtual.moduloTitulo || 'Módulo da turma'}</span>
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
                        if (proximaAula) setAulaAtualId(proximaAula.id);
                      }}
                      disabled={!proximaAula}
                      className="outline-action"
                    >
                      Próxima aula
                    </button>
                  </div>
                </>
              )}
            </article>
          </div>
        </section>
      )}
    </div>
  );
}

export default AcessoTurma;
