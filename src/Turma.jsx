import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Turma.css';

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? 'http://localhost:5151' : 'https://aspnetcore2-api.onrender.com');

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
    setEditingId(null);
    setEditingForm({ nomeTurma: '', modalidadeId: '', dataInicio: '', dataFim: '', active: true });
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
          <Link to="/page17" className="secondary-link">Voltar ao Dashboard</Link>
        </div>
      </header>

      <section className="turma-report-create">
        <form onSubmit={handleCreate} className="turma-create-inline-form">
          <input
            name="nomeTurma"
            type="text"
            value={form.nomeTurma}
            onChange={handleCreateInputChange}
            placeholder="Nome da turma"
            disabled={saving}
          />

          <select
            name="modalidadeId"
            value={form.modalidadeId}
            onChange={handleCreateInputChange}
            disabled={saving}
          >
            <option value="">Selecione a modalidade</option>
            {modalidades.map((modalidade) => (
              <option key={modalidade.id} value={modalidade.id}>{modalidade.courseName}</option>
            ))}
          </select>

          <input
            name="dataInicio"
            type="date"
            value={form.dataInicio}
            onChange={handleCreateInputChange}
            disabled={saving}
          />

          <input
            name="dataFim"
            type="date"
            value={form.dataFim}
            onChange={handleCreateInputChange}
            disabled={saving}
          />

          <label className="active-flag">
            <input
              name="active"
              type="checkbox"
              checked={form.active}
              onChange={handleCreateInputChange}
              disabled={saving}
            />
            Ativa
          </label>

          <button type="submit" disabled={saving || !form.nomeTurma.trim() || !form.modalidadeId}>
            {saving ? 'Salvando...' : 'Cadastrar'}
          </button>
        </form>
      </section>

      {error && <p className="error">Erro: {error}</p>}
      {success && <p className="success">{success}</p>}

      <section className="turma-report-table-card">
        <table className="turma-report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Turma</th>
              <th>Modalidade</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Status</th>
              <th className="th-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {turmas.length === 0 ? (
              <tr>
                <td colSpan={7} className="td-empty">Nenhuma turma cadastrada.</td>
              </tr>
            ) : (
              turmas.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      {isEditing ? (
                        <input
                          className="inline-edit-input"
                          name="nomeTurma"
                          type="text"
                          value={editingForm.nomeTurma}
                          onChange={handleEditInputChange}
                          disabled={saving}
                        />
                      ) : (
                        item.nomeTurma
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          className="inline-edit-input"
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
                      ) : (
                        item.modalidadeNome
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="inline-edit-input"
                          name="dataInicio"
                          type="date"
                          value={editingForm.dataInicio}
                          onChange={handleEditInputChange}
                          disabled={saving}
                        />
                      ) : (
                        formatDate(item.dataInicio)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          className="inline-edit-input"
                          name="dataFim"
                          type="date"
                          value={editingForm.dataFim}
                          onChange={handleEditInputChange}
                          disabled={saving}
                        />
                      ) : (
                        formatDate(item.dataFim)
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <label className="active-flag">
                          <input
                            name="active"
                            type="checkbox"
                            checked={editingForm.active}
                            onChange={handleEditInputChange}
                            disabled={saving}
                          />
                          Ativa
                        </label>
                      ) : (
                        <span className={item.active ? 'status-active' : 'status-inactive'}>
                          {item.active ? 'Ativa' : 'Inativa'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="compact-actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleUpdate}
                              disabled={saving || !editingForm.nomeTurma.trim() || !editingForm.modalidadeId}
                            >
                              {saving ? 'Salvando...' : 'Salvar'}
                            </button>
                            <button type="button" onClick={cancelEdit} disabled={saving}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              disabled={deletingId === item.id || saving}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id, item.nomeTurma)}
                              disabled={deletingId === item.id || saving}
                            >
                              {deletingId === item.id ? 'Excluindo...' : 'Excluir'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default Turma;
