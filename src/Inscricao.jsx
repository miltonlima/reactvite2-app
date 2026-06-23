import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE } from './config/apiBase';

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
    <div style={{ padding: 20, textAlign: 'left' }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Cursos Disponíveis para Inscrição</h1>
        <p style={{ margin: '8px 0 0' }}>
          Selecione uma turma ativa para concluir a inscrição.
        </p>
        <div style={{ marginTop: 10 }}>
          <Link to="/page17" className="secondary-link">Voltar para catálogo</Link>
        </div>
      </header>

      {loading && <p>Carregando cursos disponíveis...</p>}
      {error && <p className="error">Erro: {error}</p>}
      {success && <p className="success">{success}</p>}

      {!loading && !error && modalidadesExibidas.length === 0 && (
        <p>Nenhuma modalidade encontrada para inscrição.</p>
      )}

      {!loading && !error && modalidadesExibidas.map((modalidade) => {
        const cursos = turmasPorModalidade.get(Number(modalidade.id)) || [];

        return (
          <section
            key={modalidade.id}
            style={{
              marginBottom: 18,
              border: '1px solid #d1d5db',
              borderRadius: 10,
              overflow: 'hidden',
              background: '#fff',
            }}
          >
            <header
              style={{
                background: '#0f766e',
                color: '#fff',
                padding: '12px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <strong>{modalidade.courseName}</strong>
              <span style={{ fontSize: 13, opacity: 0.95 }}>
                {cursos.length} {cursos.length === 1 ? 'curso' : 'cursos'} disponíveis
              </span>
            </header>

            <div style={{ padding: 14 }}>
              {cursos.length === 0 ? (
                <p style={{ margin: 0 }}>Ainda não há turmas ativas vinculadas a esta modalidade.</p>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gap: 10,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  }}
                >
                  {cursos.map((turma) => {
                    const destacado = selectedTurmaId === turma.id;
                    const jaInscrito = turmasInscritas.has(Number(turma.id));
                    return (
                      <article
                        key={turma.id}
                        style={{
                          border: destacado ? '2px solid #2563eb' : '1px solid #e5e7eb',
                          borderRadius: 8,
                          padding: 12,
                          display: 'grid',
                          gap: 8,
                          background: '#f8fafc',
                        }}
                      >
                        <strong>{turma.nomeTurma}</strong>
                        <span>Inicio: {formatDate(turma.dataInicio)}</span>
                        <span>Fim: {formatDate(turma.dataFim)}</span>
                        <button
                          type="button"
                          onClick={() => handleInscricao(turma)}
                          disabled={jaInscrito || inscrevendoTurmaId === turma.id}
                          style={{
                            background: jaInscrito ? '#dcfce7' : '#2563eb',
                            color: jaInscrito ? '#166534' : '#fff',
                            border: jaInscrito ? '1px solid #bbf7d0' : 'none',
                            borderRadius: 6,
                            padding: '8px 10px',
                            textAlign: 'center',
                            fontWeight: 600,
                            cursor: jaInscrito || inscrevendoTurmaId === turma.id ? 'default' : 'pointer',
                            opacity: inscrevendoTurmaId === turma.id ? 0.75 : 1,
                          }}
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
  );
}

export default Inscricao;
