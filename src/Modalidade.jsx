import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Modalidade.css';
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

function formatDate(dateValue) {
  if (!dateValue) return '-';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('pt-BR');
}

function Modalidade() {
  const [modalidades, setModalidades] = useState([]);
  const [turmas, setTurmas] = useState([]);
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

  const cursosPorModalidade = useMemo(() => {
    const grouped = new Map();

    for (const turma of turmas) {
      const modalidadeId = Number(turma.modalidadeId);
      const current = grouped.get(modalidadeId) || [];
      grouped.set(modalidadeId, [...current, turma]);
    }

    return grouped;
  }, [turmas]);

  const sortedModalidades = useMemo(() => (
    [...modalidades].sort((a, b) => String(a.courseName || '').localeCompare(String(b.courseName || ''), 'pt-BR'))
  ), [modalidades]);

  const modalidadesComCursos = useMemo(() => (
    modalidades.filter((item) => (cursosPorModalidade.get(Number(item.id)) || []).length > 0).length
  ), [cursosPorModalidade, modalidades]);

  async function loadModalidades() {
    try {
      const [modalidadesData, turmasData] = await Promise.all([
        request('/api/modalidades'),
        request('/api/turmas'),
      ]);
      setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);
      setTurmas(Array.isArray(turmasData) ? turmasData : []);
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

  async function handleUpdate() {
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
    <div className="modalidade-report-page">
      <header className="modalidade-report-header">
        <div>
          <span className="modalidade-report-kicker">Catálogo acadêmico</span>
          <h1>Modalidades</h1>
          <p>Organize as áreas de ensino e visualize os cursos associados.</p>
        </div>
        <div className="modalidade-report-header-right">
          <Link to="/page17" className="secondary-link">Voltar ao Dashboard</Link>
        </div>
      </header>

      <section className="modalidade-summary-grid" aria-label="Resumo de modalidades">
        <article className="modalidade-summary-card is-total">
          <span>Total de modalidades</span>
          <strong>{modalidades.length}</strong>
        </article>
        <article className="modalidade-summary-card">
          <span>Com cursos</span>
          <strong>{modalidadesComCursos}</strong>
        </article>
        <article className="modalidade-summary-card">
          <span>Sem cursos</span>
          <strong>{Math.max(modalidades.length - modalidadesComCursos, 0)}</strong>
        </article>
        <article className="modalidade-summary-card">
          <span>Cursos associados</span>
          <strong>{turmas.length}</strong>
        </article>
      </section>

      <section className="modalidade-report-create">
        <form onSubmit={handleCreate} className="modalidade-create-inline-form">
          <label htmlFor="courseName">Nova modalidade</label>
          <input
            id="courseName"
            type="text"
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            placeholder="Ex.: Desenvolvimento Web"
            disabled={saving}
          />
          <button type="submit" disabled={saving || !courseName.trim()}>
            {saving ? 'Salvando...' : 'Cadastrar'}
          </button>
        </form>
      </section>

      {error && <p className="error">Erro: {error}</p>}
      {success && <p className="success">{success}</p>}

      <section className="modalidade-report-table-card">
        <table className="modalidade-report-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Modalidade</th>
              <th>Criado em</th>
              <th className="th-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sortedModalidades.length === 0 ? (
              <tr>
                <td colSpan={4} className="td-empty">Nenhuma modalidade cadastrada.</td>
              </tr>
            ) : (
              sortedModalidades.map((item) => {
                const isEditing = editingId === item.id;
                const cursos = cursosPorModalidade.get(Number(item.id)) || [];

                return (
                  <tr key={item.id}>
                    <td data-label="ID">{item.id}</td>
                    <td data-label="Modalidade">
                      {isEditing ? (
                        <input
                          className="inline-edit-input"
                          type="text"
                          value={editingName}
                          onChange={(event) => setEditingName(event.target.value)}
                          disabled={saving}
                        />
                      ) : (
                        <div className="modalidade-name-cell">
                          <strong>{item.courseName}</strong>
                          <div className="modalidade-course-list">
                            {cursos.length === 0 ? (
                              <span className="modalidade-course-empty">Sem cursos associados</span>
                            ) : (
                              <>
                                <span className="modalidade-course-count">
                                  {cursos.length} {cursos.length === 1 ? 'curso' : 'cursos'}
                                </span>
                                {cursos.map((curso) => (
                                  <span key={curso.id} className="modalidade-course-chip">
                                    {curso.nomeTurma}
                                  </span>
                                ))}
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                    <td data-label="Criado">{formatDate(item.createdAt)}</td>
                    <td data-label="Ações">
                      <div className="compact-actions">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              onClick={handleUpdate}
                              disabled={saving || !editingName.trim()}
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
                              onClick={() => handleDelete(item.id, item.courseName)}
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

export default Modalidade;
