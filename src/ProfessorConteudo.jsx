import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE } from './config/apiBase';
import './styles/professor-conteudo.css';

function getActorUserId() {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) return '';
    const parsedUser = JSON.parse(rawUser);
    const parsedId = Number(
      parsedUser?.id
      || parsedUser?.userId
      || parsedUser?.usuario?.id
      || parsedUser?.usuarioId
    );
    return parsedId > 0 ? String(parsedId) : '';
  } catch {
    return '';
  }
}

async function request(path, options = {}) {
  const actorUserId = getActorUserId();

  const url = new URL(`${API_BASE}${path}`);
  if (actorUserId) {
    url.searchParams.set('userId', actorUserId);
  }

  const hasBody = typeof options.body !== 'undefined';
  const response = await fetch(url.toString(), {
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
    error.payload = data;
    throw error;
  }

  return data;
}

async function tryBootstrapAdmin() {
  const actorUserId = getActorUserId();
  if (!actorUserId) return false;

  // Bootstrap automatico apenas em ambiente local.
  if (!API_BASE.includes('localhost')) {
    return false;
  }

  try {
    await request('/api/admin/bootstrap-admin', { method: 'POST' });
    return true;
  } catch {
    return false;
  }
}

function toNumberOrZero(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortTurmasByModalidadeCurso(lista) {
  return [...lista].sort((a, b) => {
    const modalidadeCompare = String(a.modalidadeNome || '').localeCompare(String(b.modalidadeNome || ''), 'pt-BR');
    if (modalidadeCompare !== 0) return modalidadeCompare;
    return String(a.nomeTurma || '').localeCompare(String(b.nomeTurma || ''), 'pt-BR');
  });
}

function prepareAulasForDisplay(lista) {
  return lista.map((aula) => ({
    ...aula,
    displayModuloId: aula.moduloId ?? null,
  }));
}

function ProfessorConteudo() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryTurmaId = searchParams.get('turmaId') || '';
  const [turmas, setTurmas] = useState([]);
  const [turmaId, setTurmaId] = useState(queryTurmaId);
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
    duracaoMinutos: '',
    ordem: 1,
    videoUrl: '',
    active: true,
  });

  useEffect(() => {
    loadTurmas();
  }, []);

  useEffect(() => {
    const nextTurmaId = searchParams.get('turmaId') || '';
    setTurmaId((current) => (current === nextTurmaId ? current : nextTurmaId));
  }, [searchParams]);

  useEffect(() => {
    if (!turmaId) {
      setModulos([]);
      setAulas([]);
      return;
    }
    loadConteudoTurma(Number(turmaId));
  }, [turmaId]);

  function handleTurmaChange(value) {
    setError('');
    setSuccess('');
    setTurmaId(value);

    const nextParams = new URLSearchParams(searchParams);
    if (value) {
      nextParams.set('turmaId', value);
    } else {
      nextParams.delete('turmaId');
    }
    setSearchParams(nextParams);
  }

  function withTurmaQuery(path) {
    if (!turmaId) return path;
    const separator = path.includes('?') ? '&' : '?';
    return `${path}${separator}turmaId=${encodeURIComponent(turmaId)}`;
  }

  async function loadTurmas() {
    try {
      setLoading(true);
      setError('');
      const turmasData = await request('/api/professor/turmas');
      const lista = sortTurmasByModalidadeCurso(Array.isArray(turmasData) ? turmasData : []);
      setTurmas(lista);
    } catch (err) {
      if (err?.status === 403) {
        const bootstrapped = await tryBootstrapAdmin();
        if (bootstrapped) {
          try {
            const turmasData = await request('/api/professor/turmas');
            const lista = sortTurmasByModalidadeCurso(Array.isArray(turmasData) ? turmasData : []);
            setTurmas(lista);
            return;
          } catch {
            // Mantem a mensagem amigavel abaixo se o retry falhar.
          }
        }
      }

      setError(err.message || 'Não foi possível carregar os cursos.');
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
      setAulas(prepareAulasForDisplay(Array.isArray(aulasData) ? aulasData : []));
    } catch (err) {
      setError(err.message || 'Não foi possível carregar conteúdo do curso.');
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

      await request(withTurmaQuery(`/api/professor/turmas/${turmaId}/modulos`), {
        method: 'POST',
        body: JSON.stringify({
          titulo: novoModulo.titulo,
          descricao: novoModulo.descricao,
          ordem: toNumberOrZero(novoModulo.ordem),
          active: Boolean(novoModulo.active),
        }),
      });

      setSuccess('Módulo criado com sucesso.');
      setNovoModulo({ titulo: '', descricao: '', ordem: '', active: true });
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

      await request(withTurmaQuery(`/api/professor/modulos/${modulo.id}`), {
        method: 'PUT',
        body: JSON.stringify({
          titulo: modulo.titulo,
          descricao: modulo.descricao,
          ordem: toNumberOrZero(modulo.ordem),
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
      await request(withTurmaQuery(`/api/professor/modulos/${id}`), { method: 'DELETE' });
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

      await request(withTurmaQuery(`/api/professor/turmas/${turmaId}/aulas`), {
        method: 'POST',
        body: JSON.stringify({
          moduloId: novaAula.moduloId ? Number(novaAula.moduloId) : null,
          titulo: novaAula.titulo,
          descricao: novaAula.descricao,
          duracaoMinutos: toNumberOrZero(novaAula.duracaoMinutos),
          ordem: toNumberOrZero(novaAula.ordem),
          videoUrl: novaAula.videoUrl,
          active: Boolean(novaAula.active),
        }),
      });

      setSuccess('Aula criada com sucesso.');
      setNovaAula({
        moduloId: '',
        titulo: '',
        descricao: '',
        duracaoMinutos: '',
        ordem: '',
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

      await request(withTurmaQuery(`/api/professor/aulas/${aula.id}`), {
        method: 'PUT',
        body: JSON.stringify({
          moduloId: aula.moduloId ? Number(aula.moduloId) : null,
          titulo: aula.titulo,
          descricao: aula.descricao,
          duracaoMinutos: toNumberOrZero(aula.duracaoMinutos),
          ordem: toNumberOrZero(aula.ordem),
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
      await request(withTurmaQuery(`/api/professor/aulas/${id}`), { method: 'DELETE' });
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

  const aulasPorModulo = useMemo(() => {
    const aulasOrdenadas = aulas;

    let aulaIndex = 0;
    const grupos = modulos
      .map((modulo, index) => {
        const aulasDoModulo = aulasOrdenadas
          .filter((aula) => {
            const displayModuloId = Object.prototype.hasOwnProperty.call(aula, 'displayModuloId')
              ? aula.displayModuloId
              : aula.moduloId;
            return String(displayModuloId || '') === String(modulo.id);
          })
          .map((aula) => ({ ...aula, displayIndex: ++aulaIndex }));

        return {
          key: `modulo-${modulo.id}`,
          titulo: `Módulo ${index + 1}# - ${modulo.titulo || 'Sem título'}`,
          aulas: aulasDoModulo,
        };
      })
      .filter((grupo) => grupo.aulas.length > 0);

    const aulasSemModulo = aulasOrdenadas
      .filter((aula) => {
        const displayModuloId = Object.prototype.hasOwnProperty.call(aula, 'displayModuloId')
          ? aula.displayModuloId
          : aula.moduloId;
        return !displayModuloId;
      })
      .map((aula) => ({ ...aula, displayIndex: ++aulaIndex }));

    if (aulasSemModulo.length) {
      grupos.push({
        key: 'sem-modulo',
        titulo: 'Sem módulo',
        aulas: aulasSemModulo,
      });
    }

    return grupos;
  }, [aulas, modulos]);

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
        <h1>Conteúdo do Curso</h1>
        <p>
          Crie e organize módulo(s) e aula(s) pela interface, sem precisar editar SQL.
        </p>
      </header>

      {statusMessage && (
        <p className={`professor-alert ${statusMessage.type}`}>
          {statusMessage.text}
        </p>
      )}

      <section className="professor-toolbar">
        <label className="professor-field">
          <span>Curso</span>
          <select value={turmaId} onChange={(event) => handleTurmaChange(event.target.value)} disabled={loading || saving}>
            <option value="">{turmas.length ? 'Selecione um curso' : 'Nenhum curso disponível'}</option>
            {turmas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.modalidadeNome} - {item.nomeTurma}
              </option>
            ))}
          </select>
        </label>

        <div className="professor-stats">
          <article>
            <span>Módulo(s)</span>
            <strong>{modulos.length}</strong>
          </article>
          <article>
            <span>Aula(s)</span>
            <strong>{aulas.length}</strong>
          </article>
        </div>

        {turmaAtual && (
          <small className="professor-active-turma">
            Curso ativo: <strong>{turmaAtual.nomeTurma}</strong> | Período: {formatDate(turmaAtual.dataInicio)} até {formatDate(turmaAtual.dataFim)}
          </small>
        )}
      </section>

      {loading && <p className="professor-loading">Carregando conteúdo do curso...</p>}

      {!loading && !turmaId && (
        <section className="professor-empty-state">
          <strong>Selecione um curso para organizar o conteúdo.</strong>
          <span>Depois da seleção, você poderá criar módulo(s), cadastrar aula(s) e ajustar a ordem de exibição.</span>
        </section>
      )}

      {!loading && turmaId && (
        <div className="professor-content-grid">
          <section className="professor-column">
            <h2>Módulo(s)</h2>

            <div className="professor-card create-card">
              <div className="create-title-row">
                <strong>Novo módulo</strong>
                <span>#{modulos.length + 1}</span>
              </div>
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
                  onChange={(event) => setNovoModulo((prev) => ({ ...prev, ordem: event.target.value }))}
                  placeholder="Ordem"
                  aria-label="Ordem do módulo"
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

            {!modulos.length && <p className="professor-empty">Nenhum módulo criado ainda para este curso.</p>}

            {modulos.map((modulo, index) => (
              <article key={modulo.id} className="professor-card content-card module-card">
                <span className="module-index-label">Módulo {index + 1}#</span>
                <label className="saved-field">
                  <span>Título</span>
                  <input
                    value={modulo.titulo}
                    onChange={(event) => setModulos((prev) => prev.map((item) => (
                      item.id === modulo.id ? { ...item, titulo: event.target.value } : item
                    )))}
                  />
                </label>
                <label className="saved-field">
                  <span>Descrição</span>
                  <textarea
                    rows={2}
                    value={modulo.descricao || ''}
                    onChange={(event) => setModulos((prev) => prev.map((item) => (
                      item.id === modulo.id ? { ...item, descricao: event.target.value } : item
                    )))}
                  />
                </label>
                <div className="professor-row">
                  <label className="professor-mini-field">
                    <span>Ordem</span>
                    <input
                      type="number"
                      min={1}
                      value={modulo.ordem}
                      onChange={(event) => setModulos((prev) => prev.map((item) => (
                        item.id === modulo.id ? { ...item, ordem: event.target.value } : item
                      )))}
                      className="small-input"
                    />
                  </label>
                  <div className="saved-check-field">
                    <span>Status</span>
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
                </div>
                <div className="professor-actions">
                  <button type="button" onClick={() => updateModulo(modulo)} disabled={saving} className="btn btn-primary">Salvar</button>
                  <button type="button" onClick={() => deleteModulo(modulo.id)} disabled={saving} className="btn btn-danger">Excluir</button>
                </div>
              </article>
            ))}
          </section>

          <section className="professor-column">
            <h2>Aula(s)</h2>

            <div className="professor-card create-card">
              <div className="create-title-row">
                <strong>Nova aula</strong>
                <span>#{aulas.length + 1}</span>
              </div>
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
              <div className="professor-two-field-grid">
                <label className="professor-mini-field">
                  <input
                    type="number"
                    min={0}
                    value={novaAula.duracaoMinutos}
                    onChange={(event) => setNovaAula((prev) => ({ ...prev, duracaoMinutos: event.target.value }))}
                    placeholder="Duração (min)"
                    aria-label="Duração em minutos"
                    className="small-input"
                  />
                </label>
                <label className="professor-mini-field">
                  <input
                    type="number"
                    min={1}
                    value={novaAula.ordem}
                    onChange={(event) => setNovaAula((prev) => ({ ...prev, ordem: event.target.value }))}
                    placeholder="Ordem"
                    aria-label="Ordem"
                    className="small-input"
                  />
                </label>
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

            {!aulas.length && <p className="professor-empty">Nenhuma aula criada ainda para este curso.</p>}

            {aulasPorModulo.map((grupo) => (
              <section key={grupo.key} className="lesson-module-group">
                <div className="lesson-module-title">
                  <strong>{grupo.titulo}</strong>
                  <span>{grupo.aulas.length} aula(s)</span>
                </div>

                {grupo.aulas.map((aula) => (
                  <article key={aula.id} className="professor-card content-card lesson-card">
                <span className="lesson-index-label">Aula {aula.displayIndex}#</span>
                <label className="saved-field">
                  <span>Título</span>
                  <input
                    value={aula.titulo}
                    onChange={(event) => setAulas((prev) => prev.map((item) => (
                      item.id === aula.id ? { ...item, titulo: event.target.value } : item
                    )))}
                  />
                </label>
                <label className="saved-field">
                  <span>Descrição</span>
                  <textarea
                    rows={2}
                    value={aula.descricao || ''}
                    onChange={(event) => setAulas((prev) => prev.map((item) => (
                      item.id === aula.id ? { ...item, descricao: event.target.value } : item
                    )))}
                  />
                </label>
                <label className="saved-field">
                  <span>Módulo</span>
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
                </label>
                <div className="professor-two-field-grid">
                  <label className="professor-mini-field">
                    <span>Duração</span>
                    <input
                      type="number"
                      min={0}
                      value={aula.duracaoMinutos}
                      onChange={(event) => setAulas((prev) => prev.map((item) => (
                        item.id === aula.id ? { ...item, duracaoMinutos: event.target.value } : item
                      )))}
                      placeholder="Duração (min)"
                      aria-label="Duração em minutos"
                      className="small-input"
                    />
                  </label>
                  <label className="professor-mini-field">
                    <span>Ordem</span>
                    <input
                      type="number"
                      min={1}
                      value={aula.ordem}
                      onChange={(event) => setAulas((prev) => prev.map((item) => (
                        item.id === aula.id ? { ...item, ordem: event.target.value } : item
                      )))}
                      placeholder="Ordem"
                      aria-label="Ordem"
                      className="small-input"
                    />
                  </label>
                </div>
                <label className="saved-field">
                  <span>URL do vídeo</span>
                  <input
                    value={aula.videoUrl || ''}
                    onChange={(event) => setAulas((prev) => prev.map((item) => (
                      item.id === aula.id ? { ...item, videoUrl: event.target.value } : item
                    )))}
                  />
                </label>
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
            ))}
          </section>
        </div>
      )}
    </div>
  );
}

export default ProfessorConteudo;
