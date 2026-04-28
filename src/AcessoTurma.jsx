import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

      const inscricoes = await request(`/api/inscricoes/aluno/${alunoId}`);
      const lista = Array.isArray(inscricoes) ? inscricoes : [];
      const encontrada = lista.find((item) => Number(item?.turmaId) === turmaIdNumero);

      if (!encontrada) {
        setError('Você não está inscrito nesta turma.');
        return;
      }

      setInscricao(encontrada);
    } catch (err) {
      setError(err.message || 'Não foi possível validar o acesso da turma.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, maxWidth: 820, margin: '0 auto', textAlign: 'left' }}>
      <header style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Acesso da Turma</h1>
        <p style={{ margin: '8px 0 0' }}>
          Esta página valida sua inscrição e libera o acesso à turma selecionada.
        </p>
      </header>

      {loading && <p>Validando acesso...</p>}
      {!loading && error && <p className="error">Erro: {error}</p>}

      {!loading && !error && inscricao && (
        <section
          style={{
            border: '1px solid #d1d5db',
            borderRadius: 10,
            background: '#fff',
            padding: 16,
            display: 'grid',
            gap: 8,
          }}
        >
          <strong style={{ fontSize: 18 }}>{inscricao.turmaNome || `Turma #${inscricao.turmaId}`}</strong>
          <span>Modalidade: {inscricao.modalidadeNome || 'Não informada'}</span>
          <span>Status da inscrição: {inscricao.status || 'ATIVA'}</span>
          <span>Inscrição realizada em: {formatDateTime(inscricao.createdAt)}</span>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
            <Link
              to="/page17"
              style={{
                textDecoration: 'none',
                background: '#2563eb',
                color: '#fff',
                borderRadius: 6,
                padding: '8px 12px',
                fontWeight: 600,
              }}
            >
              Voltar para inscrições
            </Link>
            <button
              type="button"
              style={{
                background: '#0f766e',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 12px',
                fontWeight: 600,
                cursor: 'default',
              }}
            >
              Acesso liberado
            </button>
          </div>
        </section>
      )}
    </div>
  );
}

export default AcessoTurma;
