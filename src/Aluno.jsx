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

function normalizeInscricao(item) {
  if (!item) return null;

  return {
    id: getValue(item, 'id', 'Id'),
    turmaId: getValue(item, 'turmaId', 'TurmaId', 'turma_id'),
    turmaNome: getValue(item, 'turmaNome', 'TurmaNome', 'nome_turma') || 'Turma sem nome',
    modalidadeId: getValue(item, 'modalidadeId', 'ModalidadeId', 'modalidade_id'),
    modalidadeNome: getValue(item, 'modalidadeNome', 'ModalidadeNome', 'modalidade_nome') || 'Curso sem nome',
    status: getValue(item, 'status', 'Status') || 'ATIVA',
    createdAt: getValue(item, 'createdAt', 'CreatedAt', 'created_at') || null,
  };
}

function normalizeInscricoesResponse(data) {
  const items = Array.isArray(data)
    ? data
    : Array.isArray(data?.inscricoes)
      ? data.inscricoes
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data)
          ? data.data
          : [];

  return items.map(normalizeInscricao).filter((item) => item?.id !== undefined && item?.id !== null);
}

function formatDateTime(value) {
  if (!value) return 'Data não informada';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Data não informada';
  return parsed.toLocaleString('pt-BR');
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
    const error = new Error(message);
    error.status = response.status;
    throw error;
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
  const [alunoInscricoes, setAlunoInscricoes] = useState([]);
  const [loadingInscricoes, setLoadingInscricoes] = useState(false);
  const [inscricoesError, setInscricoesError] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isInactivating, setIsInactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    birthDate: '',
    sex: '',
    email: '',
  });
  const [createForm, setCreateForm] = useState({
    fullName: '',
    birthDate: '',
    sex: '',
    email: '',
    password: '',
    confirmPassword: '',
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
      setAlunoInscricoes([]);
      setInscricoesError('');
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

    try {
      setLoadingInscricoes(true);
      const inscricoesData = await request(`/api/inscricoes/aluno/${id}`);
      setAlunoInscricoes(normalizeInscricoesResponse(inscricoesData));
    } catch (error) {
      setAlunoInscricoes([]);
      setInscricoesError(error.message || 'Falha ao carregar cursos do aluno.');
    } finally {
      setLoadingInscricoes(false);
    }
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleCreateInputChange(event) {
    const { name, value } = event.target;
    setCreateForm((current) => ({ ...current, [name]: value }));
  }

  function resetCreateForm() {
    setCreateForm({
      fullName: '',
      birthDate: '',
      sex: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setCreateError('');
    setCreateSuccess('');
  }

  function handleOpenCreateModal() {
    resetCreateForm();
    setIsCreateModalOpen(true);
  }

  function handleCloseCreateModal() {
    if (isCreating) return;
    setIsCreateModalOpen(false);
    resetCreateForm();
  }

  function handleCloseModal() {
    if (isSaving || isInactivating || isReactivating) return;
    setSelectedId(null);
    setSelectedAluno(null);
    setDetailError('');
    setAlunoInscricoes([]);
    setInscricoesError('');
    setSuccessMessage('');
    setIsEditing(false);
  }

  async function handleCreateAluno(event) {
    event.preventDefault();

    try {
      setIsCreating(true);
      setCreateError('');
      setCreateSuccess('');

      const payload = {
        fullName: createForm.fullName.trim(),
        birthDate: createForm.birthDate,
        sex: createForm.sex.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        confirmPassword: createForm.confirmPassword,
      };

      const response = await request('/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setCreateSuccess(response?.mensagem || 'Aluno inscrito com sucesso.');
      await loadAlunos(includeInactive);

      const createdAluno = normalizeAluno(response?.usuario || response?.user || response?.aluno);
      if (createdAluno?.id) {
        setIsCreateModalOpen(false);
        resetCreateForm();
        await handleViewAluno(createdAluno.id);
      } else {
        resetCreateForm();
      }
    } catch (error) {
      setCreateError(error.message || 'Falha ao inscrever aluno.');
    } finally {
      setIsCreating(false);
    }
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
          <p>Liste, inscreva, visualize, edite e inative alunos cadastrados.</p>
        </div>
        <div className="alunos-header-actions">
          <button type="button" className="primary-action" onClick={handleOpenCreateModal}>
            Novo aluno
          </button>
          <Link to="/page17" className="secondary-link">Voltar ao Dashboard</Link>
        </div>
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

      {isCreateModalOpen && (
        <div
          className="aluno-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCloseCreateModal();
          }}
        >
          <section className="aluno-modal" role="dialog" aria-modal="true" aria-labelledby="aluno-create-modal-title">
            <div className="aluno-modal-header">
              <div>
                <h2 id="aluno-create-modal-title">Inscrever novo aluno</h2>
                <p>Preencha os dados iniciais de acesso e cadastro.</p>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={handleCloseCreateModal}
                disabled={isCreating}
              >
                Fechar
              </button>
            </div>

            {createError && <p className="error modal-state">Erro: {createError}</p>}
            {createSuccess && <p className="success modal-state">{createSuccess}</p>}

            <form onSubmit={handleCreateAluno} className="form-grid alunos-form">
              <label>
                Nome completo
                <input
                  name="fullName"
                  type="text"
                  value={createForm.fullName}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label>
                Data de nascimento
                <input
                  name="birthDate"
                  type="date"
                  value={createForm.birthDate}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label>
                Sexo
                <input
                  name="sex"
                  type="text"
                  maxLength={20}
                  value={createForm.sex}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  value={createForm.email}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label>
                Senha inicial
                <input
                  name="password"
                  type="password"
                  value={createForm.password}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <label>
                Confirmar senha
                <input
                  name="confirmPassword"
                  type="password"
                  value={createForm.confirmPassword}
                  onChange={handleCreateInputChange}
                  required
                />
              </label>

              <div className="detail-actions">
                <button type="submit" disabled={isCreating}>
                  {isCreating ? 'Inscrevendo...' : 'Inscrever aluno'}
                </button>
                <button type="button" onClick={handleCloseCreateModal} disabled={isCreating}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

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

                {!isEditing && (
                  <section className="aluno-cursos-section" aria-label="Cursos do aluno">
                    <div className="aluno-cursos-header">
                      <h3>Cursos inscritos</h3>
                      <span>{alunoInscricoes.length} curso(s)</span>
                    </div>

                    {loadingInscricoes && <p className="modal-state">Carregando cursos...</p>}
                    {inscricoesError && <p className="error modal-state">Erro: {inscricoesError}</p>}
                    {!loadingInscricoes && !inscricoesError && alunoInscricoes.length === 0 && (
                      <p className="aluno-cursos-empty">Este aluno ainda não está inscrito em cursos.</p>
                    )}

                    {!loadingInscricoes && !inscricoesError && alunoInscricoes.length > 0 && (
                      <div className="aluno-cursos-list">
                        {alunoInscricoes.map((inscricao) => (
                          <article className="aluno-curso-item" key={inscricao.id}>
                            <div>
                              <strong>{inscricao.modalidadeNome}</strong>
                              <span>{inscricao.turmaNome}</span>
                            </div>
                            <div className="aluno-curso-meta">
                              <span className="status-active">{inscricao.status}</span>
                              <small>{formatDateTime(inscricao.createdAt)}</small>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </section>
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
