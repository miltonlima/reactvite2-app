import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'
import supabase from './lib/supabaseClient.js'

function App12() {
  const [instruments, setInstruments] = useState([]);
  const [instrumentName, setInstrumentName] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getInstruments();
  }, []);

  async function getInstruments() {
    const { data, error: fetchError } = await supabase
      .from("instruments")
      .select("id, name");
    if (fetchError) {
      setError(fetchError);
      return;
    }
    setInstruments(data ?? []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSuccess('');
    const name = instrumentName.trim();
    if (!name) return;

    try {
      setSaving(true);
      const { error: insertError } = await supabase
        .from("instruments")
        .insert({ name });
      if (insertError) throw insertError;
      setInstrumentName('');
      setSuccess('Instrumento inserido com sucesso.');
      await getInstruments();
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
      const { error: deleteError } = await supabase
        .from("instruments")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      setSuccess('Instrumento removido.');
      await getInstruments();
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

      <h2>Novo instrumento</h2>
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
      <ul>
        {instruments.map((instrument) => (
          <li
            key={instrument.id ?? instrument.name}
            className="instrument-item"
          >
            <span>{instrument.name}</span>
            &nbsp;
            <button
              type="button"
              onClick={() => confirmDelete(instrument.id, instrument.name)}
              disabled={saving || deletingId === instrument.id}
            >
              {deletingId === instrument.id ? 'Excluindo...' : 'Excluir'}
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

export default App12
