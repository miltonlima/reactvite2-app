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
            border: '1px solid #cbd5e1',
            borderRadius: 14,
            background: '#fff',
            padding: 16,
            display: 'grid',
            gap: 14,
          }}
        >
          <div style={{ display: 'grid', gap: 6 }}>
            <strong style={{ fontSize: 22 }}>{inscricao.turmaNome || `Turma #${inscricao.turmaId}`}</strong>
            <span>Modalidade: {inscricao.modalidadeNome || 'Não informada'}</span>
            <span>Status da inscrição: {inscricao.status || 'ATIVA'}</span>
            <span>Inscrição realizada em: {formatDateTime(inscricao.createdAt)}</span>

            <div
              style={{
                marginTop: 6,
                height: 10,
                borderRadius: 999,
                background: '#e2e8f0',
                overflow: 'hidden',
                maxWidth: 460,
              }}
            >
              <div style={{ width: `${resumoProgresso.percentual}%`, background: '#2563eb', height: '100%' }} />
            </div>
            <span style={{ fontSize: 13 }}>
              Progresso geral: {resumoProgresso.percentual}% ({resumoProgresso.concluidas}/{resumoProgresso.total} aulas)
            </span>
          </div>

          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'minmax(250px, 330px) 1fr' }}>
            <aside
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 10,
                display: 'grid',
                gap: 8,
                maxHeight: 480,
                overflow: 'auto',
              }}
            >
              <strong>Conteúdo da turma</strong>
              {aulas.length === 0 && <span>Esta turma ainda não possui aulas cadastradas.</span>}
              {aulas.map((aula, index) => {
                const ativa = Number(aulaAtualId) === Number(aula.id);
                return (
                  <button
                    key={aula.id}
                    type="button"
                    onClick={() => setAulaAtualId(aula.id)}
                    style={{
                      border: ativa ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '8px 10px',
                      background: ativa ? '#eff6ff' : '#fff',
                      textAlign: 'left',
                      color: '#0f172a',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>Aula {index + 1}: {aula.titulo}</div>
                    <div style={{ fontSize: 12, opacity: 0.8 }}>
                      {aula.moduloTitulo} • {aula.duracaoMinutos} min • {aula.concluida ? 'Concluída' : 'Pendente'}
                    </div>
                  </button>
                );
              })}
            </aside>

            <article
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: 14,
                textAlign: 'left',
                display: 'grid',
                gap: 10,
                alignContent: 'start',
                minHeight: 220,
              }}
            >
              {!aulaAtual ? (
                <span>Selecione uma aula para iniciar.</span>
              ) : (
                <>
                  <strong style={{ fontSize: 20 }}>{aulaAtual.titulo}</strong>
                  <span style={{ color: '#334155', fontSize: 13 }}>
                    {aulaAtual.moduloTitulo} • {aulaAtual.duracaoMinutos} minutos
                  </span>
                  <p style={{ margin: 0 }}>{aulaAtual.descricao || 'Sem descrição cadastrada para esta aula.'}</p>

                  {aulaAtual.videoUrl ? (
                    <a href={aulaAtual.videoUrl} target="_blank" rel="noreferrer">
                      Abrir aula em vídeo
                    </a>
                  ) : (
                    <span style={{ fontSize: 13, color: '#64748b' }}>Nenhum vídeo vinculado.</span>
                  )}

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => atualizarConclusao(!aulaAtual.concluida)}
                      disabled={salvandoProgresso}
                      style={{
                        border: 'none',
                        borderRadius: 8,
                        background: aulaAtual.concluida ? '#cbd5e1' : '#2563eb',
                        color: aulaAtual.concluida ? '#0f172a' : '#fff',
                        padding: '8px 12px',
                        fontWeight: 700,
                        opacity: salvandoProgresso ? 0.7 : 1,
                      }}
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
                        const atualIndex = aulas.findIndex((item) => Number(item.id) === Number(aulaAtual.id));
                        const proxima = aulas[atualIndex + 1];
                        if (proxima) setAulaAtualId(proxima.id);
                      }}
                      disabled={!aulas.some((item) => Number(item.id) === Number(aulaAtual.id))}
                      style={{
                        border: '1px solid #2563eb',
                        borderRadius: 8,
                        background: '#fff',
                        color: '#2563eb',
                        padding: '8px 12px',
                        fontWeight: 700,
                      }}
                    >
                      Próxima aula
                    </button>
                  </div>
                </>
              )}
            </article>
          </div>

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
          </div>
        </section>
      )}
    </div>
  );
}

export default AcessoTurma;
