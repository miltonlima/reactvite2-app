import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from './config/apiBase';

function normalizeCollection(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.mensagem || body?.message || body?.detail || response.statusText;
    throw new Error(message);
  }

  return body;
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
}

function ChartPlaceholder({ values }) {
  const bars = values.length > 0 ? values : [0];
  const max = Math.max(...bars, 1);

  return (
    <div className="chart-placeholder">
      <svg
        viewBox={`0 0 ${bars.length * 28} ${max}`}
        width="100%"
        height={160}
        preserveAspectRatio="none"
      >
        {bars.map((value, index) => (
          <rect
            key={index}
            x={index * 28 + 8}
            y={max - value}
            width={12}
            height={value || 1}
            fill="#4f46e5"
            rx={3}
          />
        ))}
      </svg>
    </div>
  );
}

function Home2() {
  const [summary, setSummary] = useState({
    alunos: 0,
    modalidades: 0,
    cursos: 0,
    avaliacoes: 0,
  });
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError('');

        const [alunosData, modalidadesData, turmasData, avaliacoesData] = await Promise.all([
          request('/api/alunos?includeInactive=true'),
          request('/api/modalidades'),
          request('/api/turmas'),
          request('/api/avaliacoes/respostas'),
        ]);

        if (!active) return;

        const alunos = normalizeCollection(alunosData, 'alunos');
        const modalidades = normalizeCollection(modalidadesData, 'modalidades');
        const turmas = normalizeCollection(turmasData, 'turmas');
        const avaliacoes = normalizeCollection(avaliacoesData, 'avaliacoes');

        setSummary({
          alunos: alunos.length,
          modalidades: modalidades.length,
          cursos: turmas.length,
          avaliacoes: avaliacoes.length,
        });
        setRecentEvaluations(avaliacoes.slice(0, 5));
      } catch (err) {
        if (!active) return;
        setError(err.message || 'Falha ao carregar dados do dashboard.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const chartValues = useMemo(
    () => [summary.alunos, summary.modalidades, summary.cursos, summary.avaliacoes],
    [summary]
  );

  return (
    <div style={{ padding: '20px' }}>
      <div className="dashboard-stats">
        <div className="card primary">
          <div>Alunos</div>
          <div className="card-value">{loading ? '...' : formatNumber(summary.alunos)}</div>
        </div>
        <div className="card-metric">
          <div>Modalidades</div>
          <div className="card-value">{loading ? '...' : formatNumber(summary.modalidades)}</div>
        </div>
        <div className="card-metric">
          <div>Cursos</div>
          <div className="card-value">{loading ? '...' : formatNumber(summary.cursos)}</div>
        </div>
        <div className="card-metric">
          <div>Avaliações</div>
          <div className="card-value">{loading ? '...' : formatNumber(summary.avaliacoes)}</div>
        </div>
      </div>

      {error && (
        <p className="error" style={{ marginTop: 16 }}>
          Erro: {error}
        </p>
      )}

      <div className="dashboard-graphs">
        <div className="graph">
          <h3>Resumo geral</h3>
          <ChartPlaceholder values={chartValues} />
        </div>
      </div>

      <div className="dashboard-activity-full">
        <h3>Avaliações recentes</h3>
        {loading && <p style={{ padding: '0 12px 12px', margin: 0 }}>Carregando dados...</p>}
        {!loading && recentEvaluations.length === 0 && (
          <p style={{ padding: '0 12px 12px', margin: 0 }}>Nenhuma avaliação registrada.</p>
        )}
        {!loading && recentEvaluations.length > 0 && (
          <ul>
            {recentEvaluations.map((item) => (
              <li key={item.id}>
                <div className="user-name">{item.alunoNome || item.aluno_nome || 'Aluno não informado'}</div>
                <div className="user-action">
                  {formatNumber(item.totalCorretas ?? item.total_corretas ?? 0)} de{' '}
                  {formatNumber(item.totalPerguntas ?? item.total_perguntas ?? 0)} acertos
                  {' · '}
                  {Number(item.percentual ?? 0).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Home2;
