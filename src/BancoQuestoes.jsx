import { useMemo, useState } from 'react';
import './BancoQuestoes.css';

const emptyAlternative = (id, correta = false) => ({
  id,
  texto: '',
  correta,
});

const initialQuestions = [
  {
    id: 1,
    enunciado: 'Qual recurso do React permite controlar estado dentro de um componente funcional?',
    dificuldade: 'Facil',
    status: 'Ativa',
    alternativas: [
      { id: 1, texto: 'useState', correta: true },
      { id: 2, texto: 'useRoute', correta: false },
      { id: 3, texto: 'useStyle', correta: false },
    ],
  },
  {
    id: 2,
    enunciado: 'Em uma API REST, qual metodo HTTP e mais indicado para atualizar um recurso existente?',
    dificuldade: 'Media',
    status: 'Ativa',
    alternativas: [
      { id: 1, texto: 'GET', correta: false },
      { id: 2, texto: 'PUT', correta: true },
      { id: 3, texto: 'TRACE', correta: false },
    ],
  },
  {
    id: 3,
    enunciado: 'O que significa responsividade em uma interface web?',
    dificuldade: 'Facil',
    status: 'Rascunho',
    alternativas: [
      { id: 1, texto: 'Adaptar a interface a diferentes tamanhos de tela', correta: true },
      { id: 2, texto: 'Responder chamadas de API mais rapido', correta: false },
    ],
  },
];

function getInitialForm() {
  return {
    enunciado: '',
    dificuldade: 'Facil',
    status: 'Ativa',
    alternativas: [emptyAlternative(1, true), emptyAlternative(2)],
  };
}

function BancoQuestoes() {
  const [questions, setQuestions] = useState(initialQuestions);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('Todas');
  const [form, setForm] = useState(getInitialForm);

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
        ? Math.max(...current.alternativas.map((alternativa) => alternativa.id)) + 1
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

  function handleCreateQuestion(event) {
    event.preventDefault();

    const alternativas = form.alternativas
      .map((alternativa) => ({ ...alternativa, texto: alternativa.texto.trim() }))
      .filter((alternativa) => alternativa.texto);

    if (!form.enunciado.trim() || alternativas.length < 2) return;

    const hasCorrectAlternative = alternativas.some((alternativa) => alternativa.correta);
    const normalizedAlternatives = hasCorrectAlternative
      ? alternativas
      : alternativas.map((alternativa, index) => ({ ...alternativa, correta: index === 0 }));

    const nextQuestion = {
      id: questions.length ? Math.max(...questions.map((item) => item.id)) + 1 : 1,
      enunciado: form.enunciado.trim(),
      dificuldade: form.dificuldade,
      status: form.status,
      alternativas: normalizedAlternatives,
    };

    setQuestions((current) => [nextQuestion, ...current]);
    setForm(getInitialForm());
  }

  return (
    <div className="question-bank-page">
      <header className="question-bank-header">
        <div>
          <span className="question-bank-eyebrow">Avaliacoes</span>
          <h1>Banco de questoes</h1>
          <p>Organize enunciados, alternativas, dificuldade e status para montar avaliacoes com mais agilidade.</p>
        </div>
        <div className="question-bank-summary">
          <span>Total</span>
          <strong>{questions.length}</strong>
        </div>
      </header>

      <section className="question-bank-toolbar" aria-label="Filtros do banco de questoes">
        <label>
          Buscar
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome da questao ou alternativa"
          />
        </label>

        <label>
          Dificuldade
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option>Todas</option>
            <option>Facil</option>
            <option>Media</option>
            <option>Dificil</option>
          </select>
        </label>
      </section>

      <section className="question-bank-create">
        <form onSubmit={handleCreateQuestion}>
          <div className="question-create-heading">
            <div>
              <strong>Nova questão</strong>
              <span>Monte o enunciado e adicione quantas alternativas precisar.</span>
            </div>
          </div>

          <div className="question-form-section">
            <label className="question-field-large">
              Enunciado
              <textarea
                name="enunciado"
                value={form.enunciado}
                onChange={handleInputChange}
                placeholder="Digite o enunciado da questao"
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
              <button type="button" className="secondary-create-button" onClick={addAlternative}>
                Adicionar alternativa
              </button>
            </div>

            <div className="question-alternatives-list">
              {form.alternativas.map((alternativa, index) => (
                <div key={alternativa.id} className="question-alternative-row">
                  <label className="alternative-correct-control">
                    <input
                      type="radio"
                      name="alternativaCorreta"
                      checked={alternativa.correta}
                      onChange={() => handleCorrectAlternative(alternativa.id)}
                    />
                    Correta
                  </label>

                  <label className="alternative-text-field">
                    Alternativa {index + 1}
                    <input
                      value={alternativa.texto}
                      onChange={(event) => handleAlternativeChange(alternativa.id, event.target.value)}
                      placeholder={`Texto da alternativa ${index + 1}`}
                    />
                  </label>

                  <button
                    type="button"
                    className="remove-alternative-button"
                    onClick={() => removeAlternative(index)}
                    disabled={form.alternativas.length <= 1}
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
                <select name="dificuldade" value={form.dificuldade} onChange={handleInputChange}>
                  <option>Facil</option>
                  <option>Media</option>
                  <option>Dificil</option>
                </select>
              </label>

              <label>
                Status
                <select name="status" value={form.status} onChange={handleInputChange}>
                  <option>Ativa</option>
                  <option>Rascunho</option>
                </select>
              </label>
            </div>

            <button type="submit" disabled={!canCreateQuestion}>
              Adicionar questao
            </button>
          </div>
        </form>
      </section>

      <section className="question-bank-list" aria-label="Lista de questoes cadastradas">
        {filteredQuestions.length === 0 ? (
          <p className="question-bank-empty">Nenhuma questao encontrada.</p>
        ) : (
          filteredQuestions.map((question) => (
            <article key={question.id} className="question-card">
              <div className="question-card-main">
                <span className="question-card-id">#{question.id}</span>
                <strong>{question.enunciado}</strong>
                {question.alternativas?.length > 0 && (
                  <ul className="question-card-alternatives">
                    {question.alternativas.map((alternativa, index) => (
                      <li key={alternativa.id}>
                        <span>{String.fromCharCode(65 + index)}</span>
                        {alternativa.texto}
                        {alternativa.correta && <strong>Correta</strong>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="question-card-meta">
                <span>{question.dificuldade}</span>
                <span>{question.alternativas?.length || 0} alternativas</span>
                <span className={question.status === 'Ativa' ? 'is-active' : 'is-draft'}>{question.status}</span>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
}

export default BancoQuestoes;
