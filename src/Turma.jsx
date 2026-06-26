import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Turma.css';
import { API_BASE } from './config/apiBase';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.mensagem || body?.detail || body?.message || response.statusText;
    throw new Error(message);
  }

  return body;
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

function Turma() {
  const [turmas, setTurmas] = useState([]);
  const [modalidades, setModalidades] = useState([]);

  const [form, setForm] = useState({
    nomeTurma: '',
    modalidadeId: '',
    dataInicio: '',
    dataFim: '',
    active: true,
  });

  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({
    nomeTurma: '',
    modalidadeId: '',
    dataInicio: '',
    dataFim: '',
    active: true,
  });

  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'asc' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setError('');
      const [turmasData, modalidadesData] = await Promise.all([
        request('/api/turmas'),
        request('/api/modalidades'),
      ]);
      setTurmas(Array.isArray(turmasData) ? turmasData : []);
      setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar turmas.');
    }
  }

  function getSortValue(item, key) {
    if (key === 'id') return Number(item.id) || 0;
    if (key === 'nomeTurma') return String(item.nomeTurma || '').toLowerCase();
    if (key === 'modalidadeNome') return String(item.modalidadeNome || '').toLowerCase();
    if (key === 'dataInicio') return item.dataInicio ? new Date(item.dataInicio).getTime() : 0;
    if (key === 'dataFim') return item.dataFim ? new Date(item.dataFim).getTime() : 0;
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

  function handleCreateInputChange(event) {
    const { name, type, checked, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleEditInputChange(event) {
    const { name, type, checked, value } = event.target;
    setEditingForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleCreate(event) {
    event.preventDefault();

    if (!form.nomeTurma.trim() || !form.modalidadeId) {
      setError('Nome da turma e modalidade são obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const created = await request('/api/turmas', {
        method: 'POST',
        body: JSON.stringify({
          nomeTurma: form.nomeTurma.trim(),
          modalidadeId: Number(form.modalidadeId),
          dataInicio: form.dataInicio || null,
          dataFim: form.dataFim || null,
          active: form.active,
        }),
      });

      setTurmas((current) => [...current, created]);
      setForm({ nomeTurma: '', modalidadeId: '', dataInicio: '', dataFim: '', active: true });
      setIsCreateModalOpen(false);
      setSuccess('Turma cadastrada com sucesso.');
    } catch (err) {
      setError(err.message || 'Falha ao cadastrar turma.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditingForm({
      nomeTurma: item.nomeTurma || '',
      modalidadeId: String(item.modalidadeId || ''),
      dataInicio: toInputDate(item.dataInicio),
      dataFim: toInputDate(item.dataFim),
      active: item.active,
    });
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
    if (saving) return;
    setEditingId(null);
    setEditingForm({ nomeTurma: '', modalidadeId: '', dataInicio: '', dataFim: '', active: true });
  }

  function openCreateModal() {
    setForm({ nomeTurma: '', modalidadeId: '', dataInicio: '', dataFim: '', active: true });
    setError('');
    setSuccess('');
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (saving) return;
    setIsCreateModalOpen(false);
    setForm({ nomeTurma: '', modalidadeId: '', dataInicio: '', dataFim: '', active: true });
  }

  async function handleUpdate() {
    if (!editingId) return;

    if (!editingForm.nomeTurma.trim() || !editingForm.modalidadeId) {
      setError('Nome da turma e modalidade são obrigatórios.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updated = await request(`/api/turmas/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({
          nomeTurma: editingForm.nomeTurma.trim(),
          modalidadeId: Number(editingForm.modalidadeId),
          dataInicio: editingForm.dataInicio || null,
          dataFim: editingForm.dataFim || null,
          active: editingForm.active,
        }),
      });

      setTurmas((current) => current.map((item) => (item.id === editingId ? updated : item)));
      cancelEdit();
      setSuccess('Turma atualizada com sucesso.');
    } catch (err) {
      setError(err.message || 'Falha ao atualizar turma.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, nomeTurma) {
    const ok = window.confirm(`Excluir turma "${nomeTurma}"?`);
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
      setSuccess('Turma excluída com sucesso.');
    } catch (err) {
      setError(err.message || 'Falha ao excluir turma.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="turma-report-page">
      <header className="turma-report-header">
        <div>
          <h1>Relatório de Turmas</h1>
          <p>Cadastro, manutenção e exclusão de turmas.</p>
        </div>
        <div className="turma-report-header-right">
          <span className="turma-report-badge">Total: {turmas.length}</span>
          <button type="button" className="turma-primary-action" onClick={openCreateModal}>
            Nova turma
          </button>
          <Link to="/page17" className="secondary-link">Voltar ao Dashboard</Link>
        </div>
      </header>

      {error && <p className="error">Erro: {error}</p>}
      {success && <p className="success">{success}</p>}

      <section className="turma-report-table-card">
        <table className="turma-report-table">
          <thead>
            <tr>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('id')}>ID{getSortIndicator('id')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('nomeTurma')}>Turma{getSortIndicator('nomeTurma')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('modalidadeNome')}>Modalidade{getSortIndicator('modalidadeNome')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('dataInicio')}>Início{getSortIndicator('dataInicio')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('dataFim')}>Fim{getSortIndicator('dataFim')}</button></th>
              <th><button type="button" className="sort-header-button" onClick={() => handleSort('active')}>Status{getSortIndicator('active')}</button></th>
              <th className="th-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedTurmas.length === 0 ? (
              <tr>
                <td colSpan={7} className="td-empty">Nenhuma turma cadastrada.</td>
              </tr>
            ) : (
              sortedTurmas.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id}>
                    <td data-label="ID">{item.id}</td>
                    <td data-label="Turma">{item.nomeTurma}</td>
                    <td data-label="Modalidade">{item.modalidadeNome}</td>
                    <td data-label="Início">{formatDate(item.dataInicio)}</td>
                    <td data-label="Fim">{formatDate(item.dataFim)}</td>
                    <td data-label="Status">
                      <span className={item.active ? 'status-active' : 'status-inactive'}>
                        {item.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td data-label="Ações">
                      <div className="compact-actions">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          disabled={deletingId === item.id || saving}
                        >
                          {isEditing ? 'Editando...' : 'Editar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id, item.nomeTurma)}
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
                <h2 id="turma-create-title">Cadastrar turma</h2>
                <p>Informe os dados principais para criar uma nova turma.</p>
              </div>
              <button type="button" onClick={closeCreateModal} disabled={saving}>
                Fechar
              </button>
            </header>

            <form className="turma-edit-form" onSubmit={handleCreate}>
              <label>
                Nome da turma
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

              <label className="active-flag turma-edit-active">
                <input
                  name="active"
                  type="checkbox"
                  checked={form.active}
                  onChange={handleCreateInputChange}
                  disabled={saving}
                />
                Turma ativa
              </label>

              <div className="turma-edit-actions">
                <button type="submit" disabled={saving || !form.nomeTurma.trim() || !form.modalidadeId}>
                  {saving ? 'Salvando...' : 'Cadastrar turma'}
                </button>
                <button type="button" onClick={closeCreateModal} disabled={saving}>
                  Cancelar
                </button>
              </div>
            </form>
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
                <h2 id="turma-edit-title">Editar turma</h2>
                <p>Atualize os dados principais da turma selecionada.</p>
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
                Nome da turma
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

              <label className="active-flag turma-edit-active">
                <input
                  name="active"
                  type="checkbox"
                  checked={editingForm.active}
                  onChange={handleEditInputChange}
                  disabled={saving}
                />
                Turma ativa
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

