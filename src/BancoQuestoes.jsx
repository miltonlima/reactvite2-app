import { useEffect, useMemo, useState } from 'react';
import './BancoQuestoes.css';
import { API_BASE } from './config/apiBase';

const emptyAlternative = (id, correta = false) => ({
  id,
  texto: '',
  correta,
});

function getInitialForm() {
  return {
    enunciado: '',
    dificuldade: 'Facil',
    status: 'Ativa',
    alternativas: [emptyAlternative(1, true), emptyAlternative(2)],
  };
}

function formatDifficulty(value) {
  const labels = {
    Facil: 'Fácil',
    Media: 'Média',
    Dificil: 'Difícil',
  };

  return labels[value] || value;
}

async function request(path, options = {}) {
  const hasBody = typeof options.body !== 'undefined';
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(data?.mensagem || data?.detail || data?.message || response.statusText);
  }

  return data;
}

function BancoQuestoes() {
  const [questions, setQuestions] = useState([]);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('Todas');
  const [form, setForm] = useState(getInitialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      setLoading(true);
      setError('');
      const data = await request('/api/perguntas');
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as perguntas.');
    } finally {
      setLoading(false);
    }
  }

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return questions.filter((question) => {
      const alternativesText = (question.alternativas || []).map((item) => item.texto).join(' ');
      const matchesTerm = !term
        || `${question.enunciado} ${alternativesText}`.toLowerCase().includes(term);
      const matchesDifficulty = difficulty === 'Todas' || question.dificuldade === difficulty;
      return matchesTerm && matchesDifficulty;
    });
  }, [difficulty, questions, search]);

  const filledAlternatives = form.alternativas.filter((alternativa) => alternativa.texto.trim());
  const canCreateQuestion = form.enunciado.trim() && filledAlternatives.length >= 2;

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleAlternativeChange(id, value) {
    setForm((current) => ({
      ...current,
      alternativas: current.alternativas.map((alternativa) => (
        alternativa.id === id ? { ...alternativa, texto: value } : alternativa
      )),
    }));
  }

  function handleCorrectAlternative(id) {
    setForm((current) => ({
      ...current,
      alternativas: current.alternativas.map((alternativa) => ({
        ...alternativa,
        correta: alternativa.id === id,
      })),
    }));
  }

  function addAlternative() {
    setForm((current) => {
      const nextId = current.alternativas.length
        ? Math.max(...current.alternativas.map((alternativa) => Number(alternativa.id) || 0)) + 1
        : 1;

      return {
        ...current,
        alternativas: [...current.alternativas, emptyAlternative(nextId, current.alternativas.length === 0)],
      };
    });
  }

  function removeAlternative(indexToRemove) {
    setForm((current) => {
      if (current.alternativas.length <= 1) return current;

      const removedAlternative = current.alternativas[indexToRemove];
      const nextAlternatives = current.alternativas.filter((_, index) => index !== indexToRemove);

      if (removedAlternative?.correta && nextAlternatives.length) {
        return {
          ...current,
          alternativas: nextAlternatives.map((alternativa, index) => ({
            ...alternativa,
            correta: index === 0,
          })),
        };
      }

      return { ...current, alternativas: nextAlternatives };
    });
  }

  async function handleCreateQuestion(event) {
    event.preventDefault();

    const alternativas = form.alternativas
      .map((alternativa) => ({ ...alternativa, texto: alternativa.texto.trim() }))
      .filter((alternativa) => alternativa.texto);

    if (!form.enunciado.trim() || alternativas.length < 2) return;

    const hasCorrectAlternative = alternativas.some((alternativa) => alternativa.correta);
    const normalizedAlternatives = hasCorrectAlternative
      ? alternativas
      : alternativas.map((alternativa, index) => ({ ...alternativa, correta: index === 0 }));

    const payload = {
      enunciado: form.enunciado.trim(),
      dificuldade: form.dificuldade,
      status: form.status,
      alternativas: normalizedAlternatives.map((alternativa, index) => ({
        id: Number(alternativa.id) > 0 ? Number(alternativa.id) : null,
        texto: alternativa.texto,
        correta: Boolean(alternativa.correta),
        ordem: index + 1,
      })),
    };

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const saved = editingId
        ? await request(`/api/perguntas/${editingId}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await request('/api/perguntas', { method: 'POST', body: JSON.stringify(payload) });

      setQuestions((current) => (
        editingId
          ? current.map((item) => (Number(item.id) === Number(editingId) ? saved : item))
          : [saved, ...current]
      ));
      setEditingId(null);
      setForm(getInitialForm());
      setSuccess(editingId ? 'Pergunta atualizada com sucesso.' : 'Pergunta cadastrada com sucesso.');
    } catch (err) {
      setError(err.message || 'Não foi possível salvar a pergunta.');
    } finally {
      setSaving(false);
    }
  }

  function startEdit(question) {
    setEditingId(question.id);
    setForm({
      enunciado: question.enunciado || '',
      dificuldade: question.dificuldade || 'Facil',
      status: question.status || 'Ativa',
      alternativas: (question.alternativas?.length ? question.alternativas : [emptyAlternative(1, true), emptyAlternative(2)])
        .map((alternativa, index) => ({
          id: alternativa.id || index + 1,
          texto: alternativa.texto || '',
          correta: Boolean(alternativa.correta),
        })),
    });
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(getInitialForm());
  }

  async function handleDeleteQuestion(question) {
    const ok = window.confirm(`Excluir pergunta #${question.id}?`);
    if (!ok) return;

    try {
      setDeletingId(question.id);
      setError('');
      setSuccess('');
      await request(`/api/perguntas/${question.id}`, { method: 'DELETE' });
      setQuestions((current) => current.filter((item) => Number(item.id) !== Number(question.id)));
      if (Number(editingId) === Number(question.id)) {
        cancelEdit();
      }
      setSuccess('Pergunta excluída com sucesso.');
    } catch (err) {
      setError(err.message || 'Não foi possível excluir a pergunta.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="question-bank-page">
      <header className="question-bank-header">
        <div>
          <span className="question-bank-eyebrow">Avaliações</span>
          <h1>Banco de questões</h1>
          <p>Organize enunciados, alternativas, dificuldade e status para montar avaliações com mais agilidade.</p>
        </div>
        <div className="question-bank-summary">
          <span>Total</span>
          <strong>{questions.length}</strong>
        </div>
      </header>

      <section className="question-bank-create">
        <form onSubmit={handleCreateQuestion}>
          <div className="question-create-heading">
            <div>
              <strong>Nova questão</strong>
              <span>{editingId ? `Editando pergunta #${editingId}` : 'Monte o enunciado e adicione quantas alternativas precisar.'}</span>
            </div>
            {editingId && (
              <button type="button" className="secondary-create-button" onClick={cancelEdit} disabled={saving}>
                Cancelar edição
              </button>
            )}
          </div>

          <div className="question-form-section">
            <label className="question-field-large">
              Enunciado
              <textarea
                name="enunciado"
                value={form.enunciado}
                onChange={handleInputChange}
                placeholder="Digite o enunciado da questão"
                rows="4"
              />
            </label>
          </div>

          <div className="question-form-section question-alternatives">
            <div className="question-alternatives-header">
              <div>
                <strong>Alternativas</strong>
                <span>Marque uma alternativa como correta.</span>
              </div>
              <button type="button" className="secondary-create-button" onClick={addAlternative} disabled={saving}>
                Adicionar alternativa
              </button>
            </div>

            <div className="question-alternatives-list">
              {form.alternativas.map((alternativa, index) => (
                <div
                  key={`${alternativa.id}-${index}`}
                  className={`question-alternative-row ${alternativa.correta ? 'is-correct' : ''}`}
                >
                  <label className="alternative-correct-control">
                    <input
                      type="radio"
                      name="alternativaCorreta"
                      checked={alternativa.correta}
                      onChange={() => handleCorrectAlternative(alternativa.id)}
                      disabled={saving}
                    />
                    Correta
                  </label>

                  <label className="alternative-text-field">
                    Alternativa {index + 1}
                    <input
                      value={alternativa.texto}
                      onChange={(event) => handleAlternativeChange(alternativa.id, event.target.value)}
                      placeholder={`Texto da alternativa ${index + 1}`}
                      disabled={saving}
                    />
                  </label>

                  <button
                    type="button"
                    className="remove-alternative-button"
                    onClick={() => removeAlternative(index)}
                    disabled={saving || form.alternativas.length <= 1}
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="question-form-section question-form-footer">
            <div className="question-create-grid">
              <label>
                Dificuldade
                <select name="dificuldade" value={form.dificuldade} onChange={handleInputChange} disabled={saving}>
                  <option value="Facil">Fácil</option>
                  <option value="Media">Média</option>
                  <option value="Dificil">Difícil</option>
                </select>
              </label>

              <label>
                Status
                <select name="status" value={form.status} onChange={handleInputChange} disabled={saving}>
                  <option>Ativa</option>
                  <option>Rascunho</option>
                </select>
              </label>
            </div>

            <button type="submit" className="question-submit-button" disabled={!canCreateQuestion || saving}>
              {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Adicionar questão'}
            </button>
          </div>
        </form>
      </section>

      <section className="question-bank-toolbar" aria-label="Filtros do banco de questões">
        <label>
          Buscar
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome da questão ou alternativa"
          />
        </label>

        <label>
          Dificuldade
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option>Todas</option>
            <option value="Facil">Fácil</option>
            <option value="Media">Média</option>
            <option value="Dificil">Difícil</option>
          </select>
        </label>
      </section>

      <section className="question-bank-list" aria-label="Lista de questões cadastradas">
        {loading && <p className="question-bank-empty">Carregando perguntas...</p>}
        {error && <p className="question-bank-message error">Erro: {error}</p>}
        {success && <p className="question-bank-message success">{success}</p>}

        {!loading && filteredQuestions.length === 0 ? (
          <p className="question-bank-empty">Nenhuma questão encontrada.</p>
        ) : (
          !loading && filteredQuestions.map((question) => (
            <article key={question.id} className="question-card">
              <div className="question-card-main">
                <span className="question-card-id">#{question.id}</span>
                <strong>{question.enunciado}</strong>
                {question.alternativas?.length > 0 && (
                  <ul className="question-card-alternatives">
                    {question.alternativas.map((alternativa, index) => (
                      <li key={alternativa.id} className={alternativa.correta ? 'is-correct' : ''}>
                        <span>{String.fromCharCode(65 + index)}</span>
                        {alternativa.texto}
                        {alternativa.correta && <strong>Correta</strong>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="question-card-meta">
                <span>{formatDifficulty(question.dificuldade)}</span>
                <span>{question.alternativas?.length || 0} alternativas</span>
                <span className={question.status === 'Ativa' ? 'is-active' : 'is-draft'}>{question.status}</span>
              </div>

              <div className="question-card-actions">
                <button type="button" onClick={() => startEdit(question)} disabled={saving || deletingId === question.id}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDeleteQuestion(question)} disabled={saving || deletingId === question.id}>
                  {deletingId === question.id ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default BancoQuestoes;
