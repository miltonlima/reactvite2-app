
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
  const [dashboard, setDashboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inscricaoMensagem, setInscricaoMensagem] = useState('');
  const [inscrevendoTurmaId, setInscrevendoTurmaId] = useState(null);
  const [alunoId, setAlunoId] = useState(null);
  const [turmasInscritas, setTurmasInscritas] = useState(() => new Set());
  const [busca, setBusca] = useState('');

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
        const [inscricoesData, dashboardData] = await Promise.all([
          request(`/api/inscricoes/aluno/${currentAlunoId}`),
          request(`/api/alunos/${currentAlunoId}/dashboard`).catch(() => null),
        ]);

        const turmaIds = new Set(
          (Array.isArray(inscricoesData) ? inscricoesData : [])
            .map((item) => Number(item?.turmaId))
            .filter((id) => id > 0)
        );
        setTurmasInscritas(turmaIds);
        setDashboard(Array.isArray(dashboardData?.turmas) ? dashboardData.turmas : []);
      } else {
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

  const continuarAprendendo = useMemo(
    () => dashboard.filter((item) => Number(item.percentualProgresso || 0) < 100).slice(0, 4),
    [dashboard]
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
      await loadCatalog();
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
    <div style={{ padding: 20, background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 42%, #ffffff 100%)' }}>
      <header
        style={{
          marginBottom: 16,
          background: '#0f172a',
          color: '#fff',
          borderRadius: 14,
          padding: 18,
          textAlign: 'left',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 30 }}>Minha Escola Online</h1>
        <p style={{ margin: '8px 0 12px', opacity: 0.92 }}>
          Uma experiência intuitiva para estudar no seu ritmo, como uma plataforma moderna de cursos.
        </p>
        <input
          type="search"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nome da turma ou modalidade"
          style={{
            width: '100%',
            maxWidth: 420,
            border: '1px solid #334155',
            borderRadius: 10,
            padding: '10px 12px',
            background: '#111827',
            color: '#fff',
            outline: 'none',
          }}
        />
      </header>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          marginBottom: 16,
        }}
      >
        <div className="card-metric" style={{ textAlign: 'left' }}>
          <div>Minhas turmas</div>
          <div className="card-value">{turmasInscritas.size}</div>
        </div>
        <div className="card-metric" style={{ textAlign: 'left' }}>
          <div>Continuar estudando</div>
          <div className="card-value">{continuarAprendendo.length}</div>
        </div>
        <div className="card-metric" style={{ textAlign: 'left' }}>
          <div>Turmas abertas</div>
          <div className="card-value">{turmasAtivas.length}</div>
        </div>
        <div className="card-metric" style={{ textAlign: 'left' }}>
          <div>Modalidades</div>
          <div className="card-value">{modalidades.length}</div>
        </div>
      </div>

      {loading && <p>Carregando modalidades e turmas...</p>}
      {error && <p className="error">Erro: {error}</p>}
      {inscricaoMensagem && <p className="success">{inscricaoMensagem}</p>}

      {!loading && continuarAprendendo.length > 0 && (
        <section
          style={{
            marginBottom: 20,
            border: '1px solid #dbeafe',
            borderRadius: 12,
            background: '#f8fbff',
            padding: 14,
            textAlign: 'left',
          }}
        >
          <h2 style={{ margin: '0 0 10px', fontSize: 20 }}>Continuar estudando</h2>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {continuarAprendendo.map((item) => (
              <article
                key={item.turmaId}
                style={{
                  border: '1px solid #bfdbfe',
                  borderRadius: 10,
                  background: '#fff',
                  padding: 12,
                  display: 'grid',
                  gap: 7,
                }}
              >
                <strong>{item.turmaNome}</strong>
                <span style={{ fontSize: 13, color: '#475569' }}>{item.modalidadeNome}</span>
                <div
                  style={{
                    height: 8,
                    borderRadius: 999,
                    background: '#e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${Number(item.percentualProgresso || 0)}%`,
                      background: '#2563eb',
                      height: '100%',
                    }}
                  />
                </div>
                <span style={{ fontSize: 13 }}>{Number(item.percentualProgresso || 0)}% concluído</span>
                <Link
                  to={`/acesso-turma/${item.turmaId}`}
                  style={{
                    textDecoration: 'none',
                    background: '#2563eb',
                    color: '#fff',
                    borderRadius: 8,
                    padding: '8px 10px',
                    textAlign: 'center',
                    fontWeight: 600,
                  }}
                >
                  Continuar curso
                </Link>
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
                background: '#1e293b',
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
                        <span style={{ fontSize: 13, color: '#334155' }}>{modalidade.courseName}</span>
                        <span>Inicio: {formatDate(turma.dataInicio)}</span>
                        <span>Fim: {formatDate(turma.dataFim)}</span>

                        {jaInscrito && progressoMap.has(turmaId) && (
                          <span style={{ fontSize: 13, color: '#1e40af' }}>
                            Progresso: {Number(progressoMap.get(turmaId)?.percentualProgresso || 0)}%
                          </span>
                        )}

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
                            Acessar sala
                          </Link>
                        ) : (
                          <Link
                            to="#"
                            onClick={(event) => {
                              event.preventDefault();
                              if (inscrevendoTurmaId === turma.id) return;
                              handleInscricao(modalidade, turma);
                            }}
                            style={{
                              textDecoration: 'none',
                              background: '#2563eb',
                              color: '#fff',
                              borderRadius: 6,
                              padding: '8px 10px',
                              textAlign: 'center',
                              fontWeight: 600,
                              cursor: inscrevendoTurmaId === turma.id ? 'default' : 'pointer',
                              opacity: inscrevendoTurmaId === turma.id ? 0.75 : 1,
                            }}
                          >
                            {inscrevendoTurmaId === turma.id ? 'Inscrevendo...' : 'Inscrever-se'}
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
