import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Turma.css';
import { API_BASE } from './config/apiBase';

let turmaLastPageViewAt = 0;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.mensagem || body?.detail || body?.message || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return body;
}

function getAccessSessionId() {
  const storageKey = 'access_session_id';
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const nextId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storageKey, nextId);
  return nextId;
}

function getStoredUser() {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

async function getClientUserAgent() {
  if (typeof navigator === 'undefined') return null;

  const baseUserAgent = navigator.userAgent || '';

  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const hints = await navigator.userAgentData.getHighEntropyValues([
        'platform',
        'platformVersion',
        'model',
        'uaFullVersion',
        'fullVersionList',
      ]);
      const browserVersion = hints.fullVersionList?.map((item) => `${item.brand} ${item.version}`).join(', ') || hints.uaFullVersion;
      const details = [
        baseUserAgent,
        hints.platform ? `platform=${hints.platform}` : '',
        hints.platformVersion ? `platformVersion=${hints.platformVersion}` : '',
        hints.model ? `model=${hints.model}` : '',
        browserVersion ? `browser=${browserVersion}` : '',
      ].filter(Boolean);

      return details.join(' | ');
    }
  } catch {
    return baseUserAgent || null;
  }

  return baseUserAgent || null;
}

function getClientPlatform() {
  return typeof navigator === 'undefined' ? null : navigator.userAgentData?.platform || navigator.platform || null;
}

async function logTurmaEvent({
  action,
  statusCode = 200,
  httpMethod = 'POST',
  metadata = {},
}) {
  try {
    const user = getStoredUser();
    const clientUserAgent = await getClientUserAgent();
    const clientPlatform = getClientPlatform();

    await fetch(`${API_BASE}/api/access-logs`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: Number(user?.id) || null,
        userEmail: user?.email || null,
        userName: user?.full_name || user?.fullName || user?.name || null,
        userType: user?.tipo || user?.tipoUsuario || user?.userType || user?.perfil || user?.role || null,
        sessionId: getAccessSessionId(),
        pagePath: window.location.pathname,
        pageTitle: 'Cursos',
        action,
        httpMethod,
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'Turma',
          route: '/turma',
          clientPlatform,
          ...metadata,
        },
      }),
    });
  } catch (error) {
    console.warn('Falha ao registrar log de cursos:', error);
  }
}

function toInputDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('pt-BR');
}

function createEmptyTurmaForm() {
  return {
    nomeTurma: '',
    modalidadeId: '',
    dataInicio: '',
    dataFim: '',
    inicioInscricao: '',
    fimInscricao: '',
    imgCurso: '',
    descricao: '',
    preco: '',
    active: true,
  };
}

function formatPriceInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return '';

  const amount = Number(digits) / 100;
  return amount.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parsePriceInput(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 0;
  return Number(digits) / 100;
}

function buildTurmaPayload(values) {
  return {
    nomeTurma: values.nomeTurma.trim(),
    modalidadeId: Number(values.modalidadeId),
    dataInicio: values.dataInicio || null,
    dataFim: values.dataFim || null,
    inicioInscricao: values.inicioInscricao || null,
    fimInscricao: values.fimInscricao || null,
    imgCurso: values.imgCurso.trim() || null,
    descricao: values.descricao.trim() || null,
    preco: parsePriceInput(values.preco),
    active: values.active,
  };
}

function sortModalidadesByName(items) {
  return [...items].sort((a, b) => (
    String(a.courseName || '').localeCompare(String(b.courseName || ''), 'pt-BR')
  ));
}

function Turma() {
  const [turmas, setTurmas] = useState([]);
  const [modalidades, setModalidades] = useState([]);

  const [form, setForm] = useState(() => createEmptyTurmaForm());

  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(() => createEmptyTurmaForm());

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingTurma, setViewingTurma] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (now - turmaLastPageViewAt < 1000) return;
    turmaLastPageViewAt = now;

    logTurmaEvent({
      action: 'page_view',
      statusCode: 200,
      httpMethod: 'GET',
    });
  }, []);

  async function loadInitialData() {
    try {
      setError('');
      const [turmasData, modalidadesData] = await Promise.all([
        request('/api/turmas'),
        request('/api/modalidades'),
      ]);
      setTurmas(Array.isArray(turmasData) ? turmasData : []);
      setModalidades(sortModalidadesByName(Array.isArray(modalidadesData) ? modalidadesData : []));
    } catch (err) {
      setError(err.message || 'Falha ao carregar cursos.');
    }
  }

  function getSortValue(item, key) {
    if (key === 'id') return Number(item.id) || 0;
    if (key === 'nomeTurma') return String(item.nomeTurma || '').toLowerCase();
    if (key === 'modalidadeNome') return String(item.modalidadeNome || '').toLowerCase();
    if (key === 'dataInicio') return item.dataInicio ? new Date(item.dataInicio).getTime() : 0;
    if (key === 'dataFim') return item.dataFim ? new Date(item.dataFim).getTime() : 0;
    if (key === 'preco') return Number(item.preco) || 0;
    if (key === 'active') return item.active ? 1 : 0;
    return '';
  }

  function handleSort(key) {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  }

  function getSortIndicator(key) {
    if (sortConfig.key !== key) return '';
    return sortConfig.direction === 'asc' ? ' ▲' : ' ▼';
  }

  const sortedTurmas = useMemo(() => {
    return [...turmas].sort((a, b) => {
      const aValue = getSortValue(a, sortConfig.key);
      const bValue = getSortValue(b, sortConfig.key);

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [sortConfig, turmas]);

  const activeCoursesCount = useMemo(
    () => turmas.filter((item) => item.active).length,
    [turmas]
  );

  const inactiveCoursesCount = turmas.length - activeCoursesCount;

  function handleCreateInputChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: name === 'preco' ? formatPriceInput(value) : type === 'checkbox' ? checked : value,
    }));
  }

  function handleEditInputChange(event) {
    const { name, type, checked, value } = event.target;
    setEditingForm((current) => ({
      ...current,
      [name]: name === 'preco' ? formatPriceInput(value) : type === 'checkbox' ? checked : value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.nomeTurma.trim() || !form.modalidadeId) {
      setError('Nome do curso e modalidade são obrigatórios.');
      logTurmaEvent({
        action: 'course_create_failed',
        statusCode: 400,
        httpMethod: 'POST',
        metadata: {
          reason: 'validation',
          nomeTurma: form.nomeTurma,
          modalidadeId: form.modalidadeId || null,
        },
      });
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const created = await request('/api/turmas', {
        method: 'POST',
        body: JSON.stringify(buildTurmaPayload(form)),
      });

      setTurmas((current) => [...current, created]);
      setForm(createEmptyTurmaForm());
      setIsCreateModalOpen(false);
      setSuccess('Curso cadastrado com sucesso.');
      await logTurmaEvent({
        action: 'course_create_success',
        statusCode: 201,
        httpMethod: 'POST',
        metadata: {
          turmaId: created.id,
          nomeTurma: created.nomeTurma,
          modalidadeId: created.modalidadeId,
          modalidadeNome: created.modalidadeNome,
        },
      });
    } catch (err) {
      setError(err.message || 'Falha ao cadastrar curso.');
      await logTurmaEvent({
        action: 'course_create_failed',
        statusCode: err.status || 500,
        httpMethod: 'POST',
        metadata: {
          reason: err.message || 'Falha ao cadastrar curso.',
          nomeTurma: form.nomeTurma,
          modalidadeId: form.modalidadeId || null,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setViewingTurma(null);
    setEditingId(item.id);
    setEditingForm({
      nomeTurma: item.nomeTurma || '',
      modalidadeId: String(item.modalidadeId || ''),
      dataInicio: toInputDate(item.dataInicio),
      dataFim: toInputDate(item.dataFim),
      inicioInscricao: toInputDate(item.inicioInscricao),
      fimInscricao: toInputDate(item.fimInscricao),
      imgCurso: item.imgCurso || '',
      descricao: item.descricao || '',
      preco: item.preco === null || item.preco === undefined ? '' : formatPriceInput(Math.round(Number(item.preco || 0) * 100)),
      active: item.active,
    });
    setError('');
    setSuccess('');
    logTurmaEvent({
      action: 'course_edit_modal_open',
      statusCode: 200,
      httpMethod: 'GET',
      metadata: {
        turmaId: item.id,
        nomeTurma: item.nomeTurma,
        modalidadeId: item.modalidadeId,
        modalidadeNome: item.modalidadeNome,
      },
    });
  }

  function cancelEdit() {
    if (saving) return;
    setEditingId(null);
    setEditingForm(createEmptyTurmaForm());
  }

  function openCreateModal() {
    setViewingTurma(null);
    setForm(createEmptyTurmaForm());
    setError('');
    setSuccess('');
    setIsCreateModalOpen(true);
    logTurmaEvent({
      action: 'course_create_modal_open',
      statusCode: 200,
      httpMethod: 'GET',
    });
  }

  function closeCreateModal() {
    if (saving) return;
    setIsCreateModalOpen(false);
    setForm(createEmptyTurmaForm());
  }

  async function handleUpdate() {
    if (!editingId) return;

    if (!editingForm.nomeTurma.trim() || !editingForm.modalidadeId) {
      setError('Nome do curso e modalidade são obrigatórios.');
      logTurmaEvent({
        action: 'course_update_failed',
        statusCode: 400,
        httpMethod: 'PUT',
        metadata: {
          reason: 'validation',
          turmaId: editingId,
          nomeTurma: editingForm.nomeTurma,
          modalidadeId: editingForm.modalidadeId || null,
        },
      });
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updated = await request(`/api/turmas/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(buildTurmaPayload(editingForm)),
      });

      setTurmas((current) => current.map((item) => (item.id === editingId ? updated : item)));
      cancelEdit();
      setSuccess('Curso atualizado com sucesso.');
      await logTurmaEvent({
        action: 'course_update_success',
        statusCode: 200,
        httpMethod: 'PUT',
        metadata: {
          turmaId: updated.id,
          nomeTurma: updated.nomeTurma,
          modalidadeId: updated.modalidadeId,
          modalidadeNome: updated.modalidadeNome,
        },
      });
    } catch (err) {
      setError(err.message || 'Falha ao atualizar curso.');
      await logTurmaEvent({
        action: 'course_update_failed',
        statusCode: err.status || 500,
        httpMethod: 'PUT',
        metadata: {
          reason: err.message || 'Falha ao atualizar curso.',
          turmaId: editingId,
          nomeTurma: editingForm.nomeTurma,
          modalidadeId: editingForm.modalidadeId || null,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, nomeTurma) {
    const ok = window.confirm(`Excluir curso "${nomeTurma}"?`);
    if (!ok) return;

    try {
      setDeletingId(id);
      setError('');
      setSuccess('');

      await request(`/api/turmas/${id}`, { method: 'DELETE' });
      setTurmas((current) => current.filter((item) => item.id !== id));
      if (editingId === id) {
        cancelEdit();
      }
      setSuccess('Curso excluído com sucesso.');
      await logTurmaEvent({
        action: 'course_delete_success',
        statusCode: 204,
        httpMethod: 'DELETE',
        metadata: {
          turmaId: id,
          nomeTurma,
        },
      });
    } catch (err) {
      setError(err.message || 'Falha ao excluir curso.');
      await logTurmaEvent({
        action: 'course_delete_failed',
        statusCode: err.status || 500,
        httpMethod: 'DELETE',
        metadata: {
          reason: err.message || 'Falha ao excluir curso.',
          turmaId: id,
          nomeTurma,
        },
      });
    } finally {
      setDeletingId(null);
    }
  }

  function openViewModal(item) {
    if (saving || deletingId === item.id) return;
    setViewingTurma(item);
    setError('');
    setSuccess('');
    logTurmaEvent({
      action: 'course_view_modal_open',
      statusCode: 200,
      httpMethod: 'GET',
      metadata: {
        turmaId: item.id,
        nomeTurma: item.nomeTurma,
        modalidadeId: item.modalidadeId,
        modalidadeNome: item.modalidadeNome,
      },
    });
  }

  function closeViewModal() {
    setViewingTurma(null);
  }

  return (
    <div className="turma-report-page">
      <header className="turma-report-header">
        <div>
          <span className="turma-report-kicker">Gestão acadêmica</span>
          <h1>Cursos</h1>
          <p>Cadastre, edite e acompanhe os cursos disponíveis na plataforma.</p>
        </div>
        <div className="turma-report-header-right">
          <button type="button" className="turma-primary-action" onClick={openCreateModal}>
            Novo curso
          </button>
          <Link to="/page17" className="secondary-link">Voltar ao Dashboard</Link>
        </div>
      </header>

      <section className="turma-summary-grid" aria-label="Resumo de cursos">
        <article className="turma-summary-card is-total">
          <span>Total de cursos</span>
          <strong>{turmas.length}</strong>
        </article>
        <article className="turma-summary-card">
          <span>Cursos ativos</span>
          <strong>{activeCoursesCount}</strong>
        </article>
        <article className="turma-summary-card">
          <span>Cursos inativos</span>
          <strong>{inactiveCoursesCount}</strong>
        </article>
        <article className="turma-summary-card">
          <span>Modalidades</span>
          <strong>{modalidades.length}</strong>
        </article>
      </section>

      {error && <p className="error">Erro: {error}</p>}
      {success && <p className="success">{success}</p>}

      <section className="turma-report-table-card">
        <table className="turma-report-table">
          <thead>
            <tr>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('id')}>ID{getSortIndicator('id')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('nomeTurma')}>Curso{getSortIndicator('nomeTurma')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('modalidadeNome')}>Modalidade{getSortIndicator('modalidadeNome')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('dataInicio')}>Início{getSortIndicator('dataInicio')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('dataFim')}>Fim{getSortIndicator('dataFim')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('preco')}>Preço{getSortIndicator('preco')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('active')}>Status{getSortIndicator('active')}</button></th>
              <th className="th-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedTurmas.length === 0 ? (
              <tr>
                <td colSpan={8} className="td-empty">Nenhum curso cadastrado.</td>
              </tr>
            ) : (
              sortedTurmas.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr
                    key={item.id}
                    className="turma-clickable-row"
                    onClick={() => openViewModal(item)}
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openViewModal(item);
                      }
                    }}
                  >
                    <td data-label="ID">{item.id}</td>
                    <td data-label="Curso">{item.nomeTurma}</td>
                    <td data-label="Modalidade">{item.modalidadeNome}</td>
                    <td data-label="Início">{formatDate(item.dataInicio)}</td>
                    <td data-label="Fim">{formatDate(item.dataFim)}</td>
                    <td data-label="Preço">{Number(item.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td data-label="Status">
                      <span className={item.active ? 'status-active' : 'status-inactive'}>
                        {item.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td data-label="Ações">
                      <div className="compact-actions">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            startEdit(item);
                          }}
                          disabled={deletingId === item.id || saving}
                        >
                          {isEditing ? 'Editando...' : 'Editar'}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(item.id, item.nomeTurma);
                          }}
                          disabled={deletingId === item.id || saving}
                        >
                          {deletingId === item.id ? 'Excluindo...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>

      {isCreateModalOpen && (
        <div
          className="turma-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeCreateModal();
          }}
        >
          <section className="turma-edit-modal" role="dialog" aria-modal="true" aria-labelledby="turma-create-title">
            <header className="turma-edit-modal-header">
              <div>
                <h2 id="turma-create-title">Cadastrar curso</h2>
                <p>Informe os dados principais para criar um novo curso.</p>
              </div>
              <button type="button" onClick={closeCreateModal} disabled={saving}>
                Fechar
              </button>
            </header>

            <form className="turma-edit-form" onSubmit={handleCreate}>
              <label>
                Nome do curso
                <input
                  name="nomeTurma"
                  type="text"
                  value={form.nomeTurma}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Modalidade
                <select
                  name="modalidadeId"
                  value={form.modalidadeId}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                >
                  <option value="">Selecione</option>
                  {modalidades.map((modalidade) => (
                    <option key={modalidade.id} value={modalidade.id}>{modalidade.courseName}</option>
                  ))}
                </select>
              </label>

              <label>
                Início da inscrição
                <input
                  name="inicioInscricao"
                  type="date"
                  value={form.inicioInscricao}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Fim da inscrição
                <input
                  name="fimInscricao"
                  type="date"
                  value={form.fimInscricao}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Data de início
                <input
                  name="dataInicio"
                  type="date"
                  value={form.dataInicio}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Data de fim
                <input
                  name="dataFim"
                  type="date"
                  value={form.dataFim}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Imagem do curso
                <input
                  name="imgCurso"
                  type="url"
                  value={form.imgCurso}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                  placeholder="https://..."
                />
              </label>

              <label>
                Preço
                <input
                  name="preco"
                  type="text"
                  inputMode="numeric"
                  value={form.preco}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                  placeholder="0,00"
                />
              </label>

              <label className="turma-description-field">
                Descrição
                <textarea
                  name="descricao"
                  value={form.descricao}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                  rows={3}
                />
              </label>

              <label className="active-flag turma-edit-active">
                <input
                  name="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                />
                Curso ativo
              </label>

              <div className="turma-edit-actions">
                <button type="submit" disabled={saving || !form.nomeTurma.trim() || !form.modalidadeId}>
                  {saving ? 'Salvando...' : 'Cadastrar curso'}
                </button>
                <button type="button" onClick={closeCreateModal} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {viewingTurma && (
        <div
          className="turma-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeViewModal();
          }}
        >
          <section className="turma-edit-modal" role="dialog" aria-modal="true" aria-labelledby="turma-view-title">
            <header className="turma-edit-modal-header">
              <div>
                <h2 id="turma-view-title">Dados do curso</h2>
                <p>{viewingTurma.nomeTurma}</p>
              </div>
              <button type="button" onClick={closeViewModal}>
                Fechar
              </button>
            </header>

            <div className="turma-view-grid">
              <div>
                <span>ID</span>
                <strong>{viewingTurma.id}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{viewingTurma.active ? 'Ativa' : 'Inativa'}</strong>
              </div>
              <div>
                <span>Curso</span>
                <strong>{viewingTurma.nomeTurma}</strong>
              </div>
              <div>
                <span>Modalidade</span>
                <strong>{viewingTurma.modalidadeNome}</strong>
              </div>
              <div>
                <span>Início da inscrição</span>
                <strong>{formatDate(viewingTurma.inicioInscricao)}</strong>
              </div>
              <div>
                <span>Fim da inscrição</span>
                <strong>{formatDate(viewingTurma.fimInscricao)}</strong>
              </div>
              <div>
                <span>Data de início</span>
                <strong>{formatDate(viewingTurma.dataInicio)}</strong>
              </div>
              <div>
                <span>Data de fim</span>
                <strong>{formatDate(viewingTurma.dataFim)}</strong>
              </div>
              <div>
                <span>Preço</span>
                <strong>{Number(viewingTurma.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</strong>
              </div>
              <div>
                <span>Imagem do curso</span>
                <strong>{viewingTurma.imgCurso || '-'}</strong>
              </div>
              <div className="turma-view-full">
                <span>Descrição</span>
                <strong>{viewingTurma.descricao || '-'}</strong>
              </div>
            </div>
          </section>
        </div>
      )}

      {editingId && (
        <div
          className="turma-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) cancelEdit();
          }}
        >
          <section className="turma-edit-modal" role="dialog" aria-modal="true" aria-labelledby="turma-edit-title">
            <header className="turma-edit-modal-header">
              <div>
                <h2 id="turma-edit-title">Editar curso</h2>
                <p>Atualize os dados principais do curso selecionado.</p>
              </div>
              <button type="button" onClick={cancelEdit} disabled={saving}>
                Fechar
              </button>
            </header>

            <form
              className="turma-edit-form"
              onSubmit={(event) => {
                event.preventDefault();
                handleUpdate();
              }}
            >
              <label>
                Nome do curso
                <input
                  name="nomeTurma"
                  type="text"
                  value={editingForm.nomeTurma}
                  onChange={handleEditInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Modalidade
                <select
                  name="modalidadeId"
                  value={editingForm.modalidadeId}
                  onChange={handleEditInputChange}
                  disabled={saving}
                >
                  <option value="">Selecione</option>
                  {modalidades.map((modalidade) => (
                    <option key={modalidade.id} value={modalidade.id}>{modalidade.courseName}</option>
                  ))}
                </select>
              </label>

              <label>
                Início da inscrição
                <input
                  name="inicioInscricao"
                  type="date"
                  value={editingForm.inicioInscricao}
                  onChange={handleEditInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Fim da inscrição
                <input
                  name="fimInscricao"
                  type="date"
                  value={editingForm.fimInscricao}
                  onChange={handleEditInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Data de início
                <input
                  name="dataInicio"
                  type="date"
                  value={editingForm.dataInicio}
                  onChange={handleEditInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Data de fim
                <input
                  name="dataFim"
                  type="date"
                  value={editingForm.dataFim}
                  onChange={handleEditInputChange}
                  disabled={saving}
                />
              </label>

              <label>
                Imagem do curso
                <input
                  name="imgCurso"
                  type="url"
                  value={editingForm.imgCurso}
                  onChange={handleEditInputChange}
                  disabled={saving}
                  placeholder="https://..."
                />
              </label>

              <label>
                Preço
                <input
                  name="preco"
                  type="text"
                  inputMode="numeric"
                  value={editingForm.preco}
                  onChange={handleEditInputChange}
                  disabled={saving}
                  placeholder="0,00"
                />
              </label>

              <label className="turma-description-field">
                Descrição
                <textarea
                  name="descricao"
                  value={editingForm.descricao}
                  onChange={handleEditInputChange}
                  disabled={saving}
                  rows={3}
                />
              </label>

              <label className="active-flag turma-edit-active">
                <input
                  name="active"
                  type="checkbox"
                  checked={editingForm.active}
                  onChange={handleEditInputChange}
                  disabled={saving}
                />
                Curso ativo
              </label>

              <div className="turma-edit-actions">
                <button
                  type="submit"
                  disabled={saving || !editingForm.nomeTurma.trim() || !editingForm.modalidadeId}
                >
                  {saving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button type="button" onClick={cancelEdit} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default Turma;

