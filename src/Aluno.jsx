import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './Aluno.css';
import { API_BASE } from './config/apiBase';

function toInputDate(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function getValue(item, ...keys) {
  for (const key of keys) {
    if (item?.[key] !== undefined && item?.[key] !== null) {
      return item[key];
    }
  }
  return undefined;
}

function normalizeAluno(item) {
  if (!item) return null;

  return {
    id: getValue(item, 'id', 'Id'),
    fullName: getValue(item, 'fullName', 'FullName', 'full_name') || '',
    birthDate: getValue(item, 'birthDate', 'BirthDate', 'birth_date') || '',
    sex: getValue(item, 'sex', 'Sex') || '',
    email: getValue(item, 'email', 'Email') || '',
    isActive: getValue(item, 'isActive', 'IsActive', 'is_active') !== false,
    inactiveAt: getValue(item, 'inactiveAt', 'InactiveAt', 'inactive_at') || null,
  };
}

function normalizeAlunosResponse(data) {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.alunos)
      ? data.alunos
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];

  return items.map(normalizeAluno).filter((item) => item?.id !== undefined && item?.id !== null);
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 404 && path.startsWith('/api/alunos')) {
      throw new Error(
        `Endpoint ${path} não encontrado na API (${API_BASE}). ` +
          'Publique o backend com os endpoints de alunos ou aponte VITE_API_BASE para sua API local atualizada.'
      );
    }
    const message = body?.mensagem || body?.detail || body?.message || response.statusText;
    throw new Error(message);
  }

  return body;
}

function Aluno() {
  const [alunos, setAlunos] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);

  const [selectedId, setSelectedId] = useState(null);
  const [selectedAluno, setSelectedAluno] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInactivating, setIsInactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    birthDate: '',
    sex: '',
    email: '',
  });

  const selectedAlunoNome = useMemo(() => {
    return alunos.find((item) => item.id === selectedId)?.fullName || 'Aluno';
  }, [alunos, selectedId]);

  useEffect(() => {
    loadAlunos(includeInactive);
  }, [includeInactive]);

  async function loadAlunos(showInactive) {
    try {
      setLoadingList(true);
      setListError('');
      const query = showInactive ? '?includeInactive=true' : '';
      const data = await request(`/api/alunos${query}`);
      const normalizedAlunos = normalizeAlunosResponse(data);
      setAlunos(normalizedAlunos);

      if (selectedId && !normalizedAlunos.some((item) => item.id === selectedId)) {
        setSelectedId(null);
        setSelectedAluno(null);
        setIsEditing(false);
      }
    } catch (error) {
      setListError(error.message || 'Falha ao carregar alunos.');
    } finally {
      setLoadingList(false);
    }
  }

  async function handleViewAluno(id) {
    try {
      setSelectedId(id);
      setLoadingDetail(true);
      setDetailError('');
      setSuccessMessage('');
      setIsEditing(false);

      const data = await request(`/api/alunos/${id}`);
      const aluno = normalizeAluno(data);
      setSelectedAluno(aluno);
      setForm({
        fullName: aluno?.fullName || '',
        birthDate: toInputDate(aluno?.birthDate),
        sex: aluno?.sex || '',
        email: aluno?.email || '',
      });
    } catch (error) {
      setSelectedAluno(null);
      setDetailError(error.message || 'Falha ao carregar detalhes do aluno.');
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleCloseModal() {
    if (isSaving || isInactivating || isReactivating) return;
    setSelectedId(null);
    setSelectedAluno(null);
    setDetailError('');
    setSuccessMessage('');
    setIsEditing(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    if (!selectedId) return;

    try {
      setIsSaving(true);
      setDetailError('');
      setSuccessMessage('');

      const payload = {
        fullName: form.fullName.trim(),
        birthDate: form.birthDate,
        sex: form.sex.trim(),
        email: form.email.trim(),
      };

      const response = await request(`/api/alunos/${selectedId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const alunoAtualizado = normalizeAluno(response?.aluno || response?.Aluno || response);
      if (alunoAtualizado) {
        setSelectedAluno(alunoAtualizado);
      }

      setSuccessMessage(response?.mensagem || 'Aluno atualizado com sucesso.');
      setIsEditing(false);
      await loadAlunos(includeInactive);
    } catch (error) {
      setDetailError(error.message || 'Falha ao atualizar aluno.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleInactivate() {
    if (!selectedId) return;

    const ok = window.confirm(`Deseja inativar o aluno "${selectedAlunoNome}"?`);
    if (!ok) return;

    try {
      setIsInactivating(true);
      setDetailError('');
      setSuccessMessage('');

      const response = await request(`/api/alunos/${selectedId}/inativar`, {
        method: 'DELETE',
      });

      setSuccessMessage(response?.mensagem || 'Aluno inativado com sucesso.');
      setSelectedAluno((current) => {
        if (!current) return current;
        return {
          ...current,
          isActive: false,
          inactiveAt: new Date().toISOString(),
        };
      });

      await loadAlunos(includeInactive);
    } catch (error) {
      setDetailError(error.message || 'Falha ao inativar aluno.');
    } finally {
      setIsInactivating(false);
    }
  }

  async function handleReactivate() {
    if (!selectedId) return;

    const ok = window.confirm(`Deseja reativar o aluno "${selectedAlunoNome}"?`);
    if (!ok) return;

    try {
      setIsReactivating(true);
      setDetailError('');
      setSuccessMessage('');

      const response = await request(`/api/alunos/${selectedId}/reativar`, {
        method: 'POST',
      });

      setSuccessMessage(response?.mensagem || 'Aluno reativado com sucesso.');
      setSelectedAluno((current) => {
        if (!current) return current;
        return {
          ...current,
          isActive: true,
          inactiveAt: null,
        };
      });

      await loadAlunos(includeInactive);
    } catch (error) {
      setDetailError(error.message || 'Falha ao reativar aluno.');
    } finally {
      setIsReactivating(false);
    }
  }

  return (
    <div className="alunos-page">
      <div className="alunos-header">
        <div>
          <h1>Gestão de Alunos</h1>
          <p>Liste, visualize, edite e inative alunos cadastrados.</p>
        </div>
        <Link to="/page17" className="secondary-link">Voltar ao Dashboard</Link>
      </div>

      <div className="alunos-layout">
        <section className="alunos-list-card">
          <div className="alunos-list-header">
            <h2>Alunos</h2>
            <label className="toggle-inativos">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(event) => setIncludeInactive(event.target.checked)}
              />
              Mostrar inativos
            </label>
          </div>

          {loadingList && <p>Carregando alunos...</p>}
          {listError && <p className="error">Erro: {listError}</p>}

          {!loadingList && !listError && alunos.length === 0 && (
            <p>Nenhum aluno encontrado.</p>
          )}

          {!loadingList && !listError && alunos.length > 0 && (
            <div className="alunos-table-wrap">
              <table className="alunos-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nome</th>
                    <th>E-mail</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.map((aluno) => (
                    <tr key={aluno.id} className={selectedId === aluno.id ? 'selected' : ''}>
                      <td>{aluno.id}</td>
                      <td>{aluno.fullName}</td>
                      <td>{aluno.email}</td>
                      <td>
                        <span className={aluno.isActive ? 'status-active' : 'status-inactive'}>
                          {aluno.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleViewAluno(aluno.id)}
                          disabled={loadingDetail && selectedId === aluno.id}
                        >
                          Visualizar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>

      {selectedId && (
        <div
          className="aluno-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCloseModal();
          }}
        >
          <section className="aluno-modal" role="dialog" aria-modal="true" aria-labelledby="aluno-modal-title">
            <div className="aluno-modal-header">
              <div>
                <h2 id="aluno-modal-title">Cadastro detalhado</h2>
                <p>{selectedAluno?.fullName || 'Carregando dados do aluno'}</p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={handleCloseModal}
                disabled={isSaving || isInactivating || isReactivating}
              >
                Fechar
              </button>
            </div>

            {loadingDetail && <p className="modal-state">Carregando detalhes...</p>}
            {detailError && <p className="error modal-state">Erro: {detailError}</p>}
            {successMessage && <p className="success modal-state">{successMessage}</p>}

            {selectedAluno && !loadingDetail && (
              <>
                {!isEditing ? (
                  <div className="detail-grid">
                    <div><strong>ID:</strong> {selectedAluno.id}</div>
                    <div><strong>Nome:</strong> {selectedAluno.fullName}</div>
                    <div><strong>E-mail:</strong> {selectedAluno.email}</div>
                    <div><strong>Sexo:</strong> {selectedAluno.sex}</div>
                    <div><strong>Nascimento:</strong> {toInputDate(selectedAluno.birthDate)}</div>
                    <div>
                      <strong>Status:</strong>{' '}
                      <span className={selectedAluno.isActive ? 'status-active' : 'status-inactive'}>
                        {selectedAluno.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {selectedAluno.inactiveAt && (
                      <div><strong>Inativado em:</strong> {new Date(selectedAluno.inactiveAt).toLocaleString('pt-BR')}</div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSave} className="form-grid alunos-form">
                    <label>
                      Nome completo
                      <input
                        name="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={handleInputChange}
                        required
                      />
                    </label>

                    <label>
                      Data de nascimento
                      <input
                        name="birthDate"
                        type="date"
                        value={form.birthDate}
                        onChange={handleInputChange}
                        required
                      />
                    </label>

                    <label>
                      Sexo
                      <input
                        name="sex"
                        type="text"
                        maxLength={20}
                        value={form.sex}
                        onChange={handleInputChange}
                        required
                      />
                    </label>

                    <label>
                      E-mail
                      <input
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleInputChange}
                        required
                      />
                    </label>

                    <div className="detail-actions">
                      <button type="submit" disabled={isSaving}>
                        {isSaving ? 'Salvando...' : 'Salvar alterações'}
                      </button>
                      <button type="button" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}

                <div className="detail-actions">
                  {!isEditing && (
                    <button type="button" onClick={() => setIsEditing(true)} disabled={isInactivating || isReactivating}>
                      Editar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleInactivate}
                    disabled={isInactivating || isReactivating || !selectedAluno.isActive}
                  >
                    {isInactivating ? 'Inativando...' : 'Inativar aluno'}
                  </button>
                  <button
                    type="button"
                    onClick={handleReactivate}
                    disabled={isReactivating || isInactivating || selectedAluno.isActive}
                  >
                    {isReactivating ? 'Reativando...' : 'Reativar aluno'}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default Aluno;
