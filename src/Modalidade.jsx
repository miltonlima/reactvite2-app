import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './App.css';

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

function Modalidade() {
  const [modalidades, setModalidades] = useState([]);
  const [courseName, setCourseName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadModalidades();
  }, []);

  async function loadModalidades() {
    try {
      const data = await request('/api/modalidades');
      setModalidades(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Falha ao carregar modalidades.');
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    const name = courseName.trim();
    if (!name) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const created = await request('/api/modalidades', {
        method: 'POST',
        body: JSON.stringify({ courseName: name }),
      });

      setModalidades((current) => [...current, created]);
      setCourseName('');
      setSuccess('Modalidade cadastrada com sucesso.');
    } catch (err) {
      setError(err.message || 'Falha ao cadastrar modalidade.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(item) {
    setEditingId(item.id);
    setEditingName(item.courseName || '');
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  async function handleUpdate(event) {
    event.preventDefault();
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updated = await request(`/api/modalidades/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ courseName: name }),
      });

      setModalidades((current) => current.map((item) => (item.id === editingId ? updated : item)));
      cancelEdit();
      setSuccess('Modalidade atualizada com sucesso.');
    } catch (err) {
      setError(err.message || 'Falha ao atualizar modalidade.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    const ok = window.confirm(`Excluir modalidade "${name}"?`);
    if (!ok) return;

    try {
      setDeletingId(id);
      setError('');
      setSuccess('');

      await request(`/api/modalidades/${id}`, { method: 'DELETE' });
      setModalidades((current) => current.filter((item) => item.id !== id));
      setSuccess('Modalidade excluída com sucesso.');
      if (editingId === id) {
        cancelEdit();
      }
    } catch (err) {
      setError(err.message || 'Falha ao excluir modalidade.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Página de Modalidades</h1>
      <p>Cadastre, edite e exclua modalidades.</p>

      <section className="crud-container">
        <form onSubmit={handleCreate} className="form-grid">
          <label>
            Nome da modalidade
            <input
              type="text"
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              placeholder="Ex.: Desenvolvimento Web"
              disabled={saving}
            />
          </label>
          <div>
            <button type="submit" disabled={saving || !courseName.trim()}>
              {saving ? 'Salvando...' : 'Cadastrar'}
            </button>
          </div>
        </form>
      </section>

      {error && <p className="error">Erro: {error}</p>}
      {success && <p className="success">{success}</p>}

      <h2>Modalidades cadastradas</h2>

      {modalidades.length === 0 && <p>Nenhuma modalidade cadastrada.</p>}

      {modalidades.map((item) => {
        const isEditing = editingId === item.id;
        return (
          <div key={item.id} className="crud-container" style={{ marginTop: '12px' }}>
            {isEditing ? (
              <form onSubmit={handleUpdate} className="form-grid">
                <label>
                  Nome da modalidade
                  <input
                    type="text"
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    disabled={saving}
                  />
                </label>
                <div className="actions">
                  <button type="submit" disabled={saving || !editingName.trim()}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </button>
                  <button type="button" onClick={cancelEdit} disabled={saving}>
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p><strong>ID:</strong> {item.id}</p>
                <p><strong>Nome:</strong> {item.courseName}</p>
                <div className="actions">
                  <button type="button" onClick={() => startEdit(item)} disabled={deletingId === item.id || saving}>
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id, item.courseName)}
                    disabled={deletingId === item.id || saving}
                  >
                    {deletingId === item.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <br />
      <Link to="/page17">Voltar ao Dashboard</Link>
    </div>
  );
}

export default Modalidade;
