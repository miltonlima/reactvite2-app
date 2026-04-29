import { useEffect, useMemo, useState } from 'react';
import { API_BASE } from './config/apiBase';
import './styles/professor-conteudo.css';

async function request(path, options = {}) {
  let actorUserId = '';
  try {
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      const parsedUser = JSON.parse(rawUser);
      const parsedId = Number(parsedUser?.id);
      if (parsedId > 0) {
        actorUserId = String(parsedId);
      }
    }
  } catch {
    actorUserId = '';
  }

  const hasBody = typeof options.body !== 'undefined';
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(actorUserId ? { 'x-user-id': actorUserId } : {}),
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

function ProfessorConteudo() {
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState('');
  const [modulos, setModulos] = useState([]);
  const [aulas, setAulas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [novoModulo, setNovoModulo] = useState({ titulo: '', descricao: '', ordem: 1, active: true });
  const [novaAula, setNovaAula] = useState({
    moduloId: '',
    titulo: '',
    descricao: '',
    duracaoMinutos: 10,
    ordem: 1,
    videoUrl: '',
    active: true,
  });

  useEffect(() => {
    loadTurmas();
  }, []);

  useEffect(() => {
    if (!turmaId) {
      setModulos([]);
      setAulas([]);
      return;
    }
    loadConteudoTurma(Number(turmaId));
  }, [turmaId]);

  async function loadTurmas() {
    try {
      setLoading(true);
      setError('');
      const turmasData = await request('/api/professor/turmas');
      const lista = Array.isArray(turmasData) ? turmasData : [];
      setTurmas(lista);
      if (lista[0]?.id) {
        setTurmaId(String(lista[0].id));
      }
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as turmas.');
    } finally {
      setLoading(false);
    }
  }

  async function loadConteudoTurma(id) {
    try {
      setLoading(true);
      setError('');
      const [modulosData, aulasData] = await Promise.all([
        request(`/api/professor/turmas/${id}/modulos`),
        request(`/api/professor/turmas/${id}/aulas`),
      ]);
      setModulos(Array.isArray(modulosData) ? modulosData : []);
      setAulas(Array.isArray(aulasData) ? aulasData : []);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar conteúdo da turma.');
    } finally {
      setLoading(false);
    }
  }

  async function createModulo() {
    if (!turmaId) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await request(`/api/professor/turmas/${turmaId}/modulos`, {
        method: 'POST',
        body: JSON.stringify({
          titulo: novoModulo.titulo,
          descricao: novoModulo.descricao,
          ordem: Number(novoModulo.ordem),
          active: Boolean(novoModulo.active),
        }),
      });

      setSuccess('Módulo criado com sucesso.');
      setNovoModulo({ titulo: '', descricao: '', ordem: modulos.length + 1, active: true });
      await loadConteudoTurma(Number(turmaId));
    } catch (err) {
      setError(err.message || 'Não foi possível criar módulo.');
    } finally {
      setSaving(false);
    }
  }

  async function updateModulo(modulo) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await request(`/api/professor/modulos/${modulo.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          titulo: modulo.titulo,
          descricao: modulo.descricao,
          ordem: Number(modulo.ordem),
          active: Boolean(modulo.active),
        }),
      });

      setSuccess('Módulo atualizado.');
      await loadConteudoTurma(Number(turmaId));
    } catch (err) {
      setError(err.message || 'Não foi possível atualizar módulo.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteModulo(id) {
    const shouldDelete = window.confirm('Deseja realmente excluir este módulo?');
    if (!shouldDelete) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await request(`/api/professor/modulos/${id}`, { method: 'DELETE' });
      setSuccess('Módulo removido.');
      await loadConteudoTurma(Number(turmaId));
    } catch (err) {
      setError(err.message || 'Não foi possível remover módulo.');
    } finally {
      setSaving(false);
    }
  }

  async function createAula() {
    if (!turmaId) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await request(`/api/professor/turmas/${turmaId}/aulas`, {
        method: 'POST',
        body: JSON.stringify({
          moduloId: novaAula.moduloId ? Number(novaAula.moduloId) : null,
          titulo: novaAula.titulo,
          descricao: novaAula.descricao,
          duracaoMinutos: Number(novaAula.duracaoMinutos),
          ordem: Number(novaAula.ordem),
          videoUrl: novaAula.videoUrl,
          active: Boolean(novaAula.active),
        }),
      });

      setSuccess('Aula criada com sucesso.');
      setNovaAula({
        moduloId: '',
        titulo: '',
        descricao: '',
        duracaoMinutos: 10,
        ordem: aulas.length + 1,
        videoUrl: '',
        active: true,
      });
      await loadConteudoTurma(Number(turmaId));
    } catch (err) {
      setError(err.message || 'Não foi possível criar aula.');
    } finally {
      setSaving(false);
    }
  }

  async function updateAula(aula) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await request(`/api/professor/aulas/${aula.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          moduloId: aula.moduloId ? Number(aula.moduloId) : null,
          titulo: aula.titulo,
          descricao: aula.descricao,
          duracaoMinutos: Number(aula.duracaoMinutos),
          ordem: Number(aula.ordem),
          videoUrl: aula.videoUrl,
          active: Boolean(aula.active),
        }),
      });

      setSuccess('Aula atualizada.');
      await loadConteudoTurma(Number(turmaId));
    } catch (err) {
      setError(err.message || 'Não foi possível atualizar aula.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteAula(id) {
    const shouldDelete = window.confirm('Deseja realmente excluir esta aula?');
    if (!shouldDelete) {
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await request(`/api/professor/aulas/${id}`, { method: 'DELETE' });
      setSuccess('Aula removida.');
      await loadConteudoTurma(Number(turmaId));
    } catch (err) {
      setError(err.message || 'Não foi possível remover aula.');
    } finally {
      setSaving(false);
    }
  }

  const turmaAtual = useMemo(
    () => turmas.find((item) => String(item.id) === turmaId) || null,
    [turmas, turmaId]
  );

  function formatDate(value) {
    if (!value) return 'N/I';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('pt-BR');
  }

  const statusMessage = error
    ? { type: 'error', text: `Erro: ${error}` }
    : success
      ? { type: 'success', text: success }
      : null;

  return (
    <div className="professor-page">
      <header className="professor-hero">
        <span className="professor-kicker">Painel do Professor</span>
        <h1>Conteúdo da Turma</h1>
        <p>
          Crie e organize módulos e aulas pela interface, sem precisar editar SQL.
        </p>
      </header>

      {statusMessage && (
        <p className={`professor-alert ${statusMessage.type}`}>
          {statusMessage.text}
        </p>
      )}

      <section className="professor-toolbar">
        <label className="professor-field">
          <span>Turma</span>
          <select value={turmaId} onChange={(event) => setTurmaId(event.target.value)} disabled={loading || saving}>
            {!turmas.length && <option value="">Nenhuma turma disponível</option>}
            {turmas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nomeTurma} - {item.modalidadeNome}
              </option>
            ))}
          </select>
        </label>

        <div className="professor-stats">
          <article>
            <span>Módulos</span>
            <strong>{modulos.length}</strong>
          </article>
          <article>
            <span>Aulas</span>
            <strong>{aulas.length}</strong>
          </article>
        </div>

        {turmaAtual && (
          <small className="professor-active-turma">
            Turma ativa: <strong>{turmaAtual.nomeTurma}</strong> | Período: {formatDate(turmaAtual.dataInicio)} até {formatDate(turmaAtual.dataFim)}
          </small>
        )}
      </section>

      {loading && <p className="professor-loading">Carregando conteúdo da turma...</p>}

      {!loading && (
        <div className="professor-content-grid">
          <section className="professor-column">
            <h2>Módulos</h2>

            <div className="professor-card create-card">
              <strong>Novo módulo</strong>
              <input
                placeholder="Título"
                value={novoModulo.titulo}
                onChange={(event) => setNovoModulo((prev) => ({ ...prev, titulo: event.target.value }))}
              />
              <textarea
                placeholder="Descrição"
                value={novoModulo.descricao}
                onChange={(event) => setNovoModulo((prev) => ({ ...prev, descricao: event.target.value }))}
                rows={3}
              />
              <div className="professor-row">
                <input
                  type="number"
                  min={1}
                  value={novoModulo.ordem}
                  onChange={(event) => setNovoModulo((prev) => ({ ...prev, ordem: Number(event.target.value) || 1 }))}
                  className="small-input"
                />
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={novoModulo.active}
                    onChange={(event) => setNovoModulo((prev) => ({ ...prev, active: event.target.checked }))}
                  />
                  Ativo
                </label>
              </div>
              <button type="button" onClick={createModulo} disabled={saving} className="btn btn-primary">
                Criar módulo
              </button>
            </div>

            {!modulos.length && <p className="professor-empty">Nenhum módulo criado ainda para esta turma.</p>}

            {modulos.map((modulo) => (
              <article key={modulo.id} className="professor-card">
                <input
                  value={modulo.titulo}
                  onChange={(event) => setModulos((prev) => prev.map((item) => (
                    item.id === modulo.id ? { ...item, titulo: event.target.value } : item
                  )))}
                />
                <textarea
                  rows={2}
                  value={modulo.descricao || ''}
                  onChange={(event) => setModulos((prev) => prev.map((item) => (
                    item.id === modulo.id ? { ...item, descricao: event.target.value } : item
                  )))}
                />
                <div className="professor-row">
                  <input
                    type="number"
                    min={1}
                    value={modulo.ordem}
                    onChange={(event) => setModulos((prev) => prev.map((item) => (
                      item.id === modulo.id ? { ...item, ordem: Number(event.target.value) || 1 } : item
                    )))}
                    className="small-input"
                  />
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={Boolean(modulo.active)}
                      onChange={(event) => setModulos((prev) => prev.map((item) => (
                        item.id === modulo.id ? { ...item, active: event.target.checked } : item
                      )))}
                    />
                    Ativo
                  </label>
                </div>
                <div className="professor-actions">
                  <button type="button" onClick={() => updateModulo(modulo)} disabled={saving} className="btn btn-primary">Salvar</button>
                  <button type="button" onClick={() => deleteModulo(modulo.id)} disabled={saving} className="btn btn-danger">Excluir</button>
                </div>
              </article>
            ))}
          </section>

          <section className="professor-column">
            <h2>Aulas</h2>

            <div className="professor-card create-card">
              <strong>Nova aula</strong>
              <input
                placeholder="Título da aula"
                value={novaAula.titulo}
                onChange={(event) => setNovaAula((prev) => ({ ...prev, titulo: event.target.value }))}
              />
              <textarea
                placeholder="Descrição"
                rows={3}
                value={novaAula.descricao}
                onChange={(event) => setNovaAula((prev) => ({ ...prev, descricao: event.target.value }))}
              />
              <select
                value={novaAula.moduloId}
                onChange={(event) => setNovaAula((prev) => ({ ...prev, moduloId: event.target.value }))}
              >
                <option value="">Sem módulo (geral)</option>
                {modulos.map((item) => (
                  <option key={item.id} value={item.id}>{item.titulo}</option>
                ))}
              </select>
              <div className="professor-row wrap-row">
                <input
                  type="number"
                  min={0}
                  value={novaAula.duracaoMinutos}
                  onChange={(event) => setNovaAula((prev) => ({ ...prev, duracaoMinutos: Number(event.target.value) || 0 }))}
                  placeholder="Duração (min)"
                  className="small-input"
                />
                <input
                  type="number"
                  min={1}
                  value={novaAula.ordem}
                  onChange={(event) => setNovaAula((prev) => ({ ...prev, ordem: Number(event.target.value) || 1 }))}
                  placeholder="Ordem"
                  className="small-input"
                />
              </div>
              <input
                placeholder="URL do vídeo (opcional)"
                value={novaAula.videoUrl}
                onChange={(event) => setNovaAula((prev) => ({ ...prev, videoUrl: event.target.value }))}
              />
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={novaAula.active}
                  onChange={(event) => setNovaAula((prev) => ({ ...prev, active: event.target.checked }))}
                />
                Ativa
              </label>
              <button type="button" onClick={createAula} disabled={saving} className="btn btn-primary">Criar aula</button>
            </div>

            {!aulas.length && <p className="professor-empty">Nenhuma aula criada ainda para esta turma.</p>}

            {aulas.map((aula) => (
              <article key={aula.id} className="professor-card">
                <input
                  value={aula.titulo}
                  onChange={(event) => setAulas((prev) => prev.map((item) => (
                    item.id === aula.id ? { ...item, titulo: event.target.value } : item
                  )))}
                />
                <textarea
                  rows={2}
                  value={aula.descricao || ''}
                  onChange={(event) => setAulas((prev) => prev.map((item) => (
                    item.id === aula.id ? { ...item, descricao: event.target.value } : item
                  )))}
                />
                <select
                  value={aula.moduloId || ''}
                  onChange={(event) => setAulas((prev) => prev.map((item) => (
                    item.id === aula.id ? { ...item, moduloId: event.target.value ? Number(event.target.value) : null } : item
                  )))}
                >
                  <option value="">Sem módulo (geral)</option>
                  {modulos.map((item) => (
                    <option key={item.id} value={item.id}>{item.titulo}</option>
                  ))}
                </select>
                <div className="professor-row wrap-row">
                  <input
                    type="number"
                    min={0}
                    value={aula.duracaoMinutos}
                    onChange={(event) => setAulas((prev) => prev.map((item) => (
                      item.id === aula.id ? { ...item, duracaoMinutos: Number(event.target.value) || 0 } : item
                    )))}
                    className="small-input"
                  />
                  <input
                    type="number"
                    min={1}
                    value={aula.ordem}
                    onChange={(event) => setAulas((prev) => prev.map((item) => (
                      item.id === aula.id ? { ...item, ordem: Number(event.target.value) || 1 } : item
                    )))}
                    className="small-input"
                  />
                </div>
                <input
                  value={aula.videoUrl || ''}
                  onChange={(event) => setAulas((prev) => prev.map((item) => (
                    item.id === aula.id ? { ...item, videoUrl: event.target.value } : item
                  )))}
                />
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={Boolean(aula.active)}
                    onChange={(event) => setAulas((prev) => prev.map((item) => (
                      item.id === aula.id ? { ...item, active: event.target.checked } : item
                    )))}
                  />
                  Ativa
                </label>
                <div className="professor-actions">
                  <button type="button" onClick={() => updateAula(aula)} disabled={saving} className="btn btn-primary">Salvar</button>
                  <button type="button" onClick={() => deleteAula(aula.id)} disabled={saving} className="btn btn-danger">Excluir</button>
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

export default ProfessorConteudo;
