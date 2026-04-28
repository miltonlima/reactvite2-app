
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

function formatDate(value) {
  if (!value) return 'Sem data definida';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem data definida';
  return parsed.toLocaleDateString('pt-BR');
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

function App17() {
  const [modalidades, setModalidades] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inscricaoMensagem, setInscricaoMensagem] = useState('');
  const [inscrevendoTurmaId, setInscrevendoTurmaId] = useState(null);
  const [alunoId, setAlunoId] = useState(null);
  const [turmasInscritas, setTurmasInscritas] = useState(() => new Set());

  useEffect(() => {
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
        const inscricoesData = await request(`/api/inscricoes/aluno/${currentAlunoId}`);
        const turmaIds = new Set(
          (Array.isArray(inscricoesData) ? inscricoesData : [])
            .map((item) => Number(item?.turmaId))
            .filter((id) => id > 0)
        );
        setTurmasInscritas(turmaIds);
      } else {
        setTurmasInscritas(new Set());
      }
    } catch (err) {
      setError(err.message || 'Falha ao carregar catálogo de inscrições.');
    } finally {
      setLoading(false);
    }
  }

  const turmasAtivas = useMemo(
    () => turmas.filter((item) => item.active),
    [turmas]
  );

  const turmasPorModalidade = useMemo(() => {
    const grouped = new Map();
    for (const turma of turmasAtivas) {
      const key = Number(turma.modalidadeId);
      const current = grouped.get(key) || [];
      grouped.set(key, [...current, turma]);
    }
    return grouped;
  }, [turmasAtivas]);

  async function handleInscricao(modalidade, turma) {
    try {
      setInscricaoMensagem('');
      setError('');

      if (!alunoId) {
        setError('Faça login para realizar a inscrição.');
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
    } catch (err) {
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
    <div style={{ padding: 20 }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Inscrições por Modalidade</h1>
        <p style={{ margin: '8px 0 0' }}>
          Escolha uma modalidade e selecione abaixo a turma (curso) para se inscrever.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          marginBottom: 16,
        }}
      >
        <div className="card-metric">
          <div>Modalidades cadastradas</div>
          <div className="card-value">{modalidades.length}</div>
        </div>
        <div className="card-metric">
          <div>Turmas ativas</div>
          <div className="card-value">{turmasAtivas.length}</div>
        </div>
      </div>

      {loading && <p>Carregando modalidades e turmas...</p>}
      {error && <p className="error">Erro: {error}</p>}
      {inscricaoMensagem && <p className="success">{inscricaoMensagem}</p>}

      {!loading && !error && modalidades.length === 0 && (
        <p>Nenhuma modalidade cadastrada no momento.</p>
      )}

      {!loading && !error && modalidades.map((modalidade) => {
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
                    const turmaId = Number(turma.id);
                    const jaInscrito = turmasInscritas.has(turmaId);

                    return (
                      <article
                        key={turma.id}
                        style={{
                          border: '1px solid #e5e7eb',
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

                        {jaInscrito ? (
                          <Link
                            to={`/acesso-turma/${turmaId}`}
                            style={{
                              textDecoration: 'none',
                              background: '#2563eb',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '8px 10px',
                              textAlign: 'center',
                              fontWeight: 600,
                            }}
                          >
                            Acessar
                          </Link>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (inscrevendoTurmaId === turma.id) return;
                              handleInscricao(modalidade, turma);
                            }}
                            style={{
                              background: '#2563eb',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 6,
                              padding: '8px 10px',
                              textAlign: 'center',
                              fontWeight: 600,
                              cursor: inscrevendoTurmaId === turma.id ? 'default' : 'pointer',
                              opacity: inscrevendoTurmaId === turma.id ? 0.75 : 1,
                            }}
                            disabled={inscrevendoTurmaId === turma.id}
                          >
                            {inscrevendoTurmaId === turma.id ? 'Inscrevendo...' : 'Inscrever-se'}
                          </button>
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
