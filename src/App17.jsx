
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from './config/apiBase';

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.mensagem || data?.detail || data?.message || response.statusText);
  }

  return data;
}

function formatDate(value) {
  if (!value) return 'Sem data definida';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Sem data definida';
  return parsed.toLocaleDateString('pt-BR');
}

function App17() {
  const [modalidades, setModalidades] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
                  {cursos.map((turma) => (
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
                      <Link
                        to={`/inscricao?modalidadeId=${modalidade.id}&turmaId=${turma.id}`}
                        style={{
                          textDecoration: 'none',
                          background: '#2563eb',
                          color: '#fff',
                          borderRadius: 6,
                          padding: '8px 10px',
                          textAlign: 'center',
                          fontWeight: 600,
                        }}
                      >
                        Inscrever-se
                      </Link>
                    </article>
                  ))}
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
