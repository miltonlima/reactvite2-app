import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

// Backend API base (ASP.NET) apontando para a API publicada.
const API_URL = 'https://aspnetcore2-api.onrender.com';


function App13() {
  const [instruments, setInstruments] = useState([]);
  const [instrumentName, setInstrumentName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getInstruments();
  }, []);

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const isJson = response.headers.get('content-type')?.includes('application/json');
    const body = isJson ? await response.json() : null;
    if (!response.ok) {
      const message = body?.mensagem || body?.message || response.statusText;
      throw new Error(message);
    }
    return body;
  }

  async function getInstruments() {
    try {
      const data = await request('/api/instruments');
      setInstruments(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess('');
    const name = instrumentName.trim();
    if (!name) return;

    try {
      setSaving(true);
      const created = await request('/api/instruments', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setInstrumentName('');
      setSuccess('Instrumento inserido com sucesso.');
      setInstruments((current) => [...current, created]);
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  function startEdit(id, name) {
    setEditingId(id);
    setEditingName(name ?? '');
    setError(null);
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
    setError(null);
    setSuccess('');
    try {
      setSaving(true);
      const updated = await request(`/api/instruments/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify({ name }),
      });
      setSuccess('Instrumento atualizado.');
      setInstruments((current) =>
        current.map((inst) =>
          inst.id === editingId ? updated : inst
        )
      );
      cancelEdit();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(id, name) {
    if (!id) return;
    const ok = window.confirm(`Excluir "${name}"?`);
    if (!ok) return;
    handleDelete(id);
  }

  async function handleDelete(id) {
    if (!id) return;
    setError(null);
    setSuccess('');
    const previous = instruments; // keep current list to restore on failure
    try {
      setDeletingId(id);
      setInstruments((current) => current.filter((inst) => inst.id !== id));
      await request(`/api/instruments/${id}`, { method: 'DELETE' });
      setSuccess('Instrumento removido.');
    } catch (err) {
      setError(err);
      setInstruments(previous);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Menu />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h2>Novo instrumento - API</h2>
      <div>
        <section className="crud-container">
          <form onSubmit={handleSubmit} className="form-grid">
            <label>
              Nome
              <input
                type="text"
                value={instrumentName}
                onChange={(e) => setInstrumentName(e.target.value)}
                placeholder="Ex.: Piano"
                disabled={saving}
              />
            </label>
            <div>
              <button type="submit" disabled={saving || !instrumentName.trim()}>
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </section>
      </div>
      {error && <p className="error">Erro: {error.message}</p>}
      {success && <p className="success">{success}</p>}

      <h2>Instrumentos</h2>

      {instruments.map((instrument) => {
        const isEditing = editingId === instrument.id;
        return (
          <div
            key={instrument.id ?? instrument.name}
            className="instrument-item"
          >
            {isEditing ? (
              <form onSubmit={handleUpdate} className="form-inline">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  disabled={saving}
                />
                <button type="submit" disabled={saving || !editingName.trim()}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
                <button type="button" onClick={cancelEdit} disabled={saving}>
                  Cancelar
                </button>
              </form>
            ) : (
              <>

                <div className="actions">
                  {instrument.name}
                  &nbsp;
                  <button
                    type="button"
                    onClick={() => startEdit(instrument.id, instrument.name)}
                    disabled={saving || deletingId === instrument.id}
                  >

                    Editar
                  </button>
                  &nbsp;
                  <button
                    type="button"
                    onClick={() => confirmDelete(instrument.id, instrument.name)}
                    disabled={saving || deletingId === instrument.id}
                  >
                    {deletingId === instrument.id ? 'Excluindo...' : 'Excluir'}
                  </button>
                </div>
              </>
            )}
          </div>
        );
      })}
    </>
  )
}

export default App13
