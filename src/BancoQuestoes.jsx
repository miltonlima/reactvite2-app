import { useMemo, useState } from 'react';
import './BancoQuestoes.css';

const initialQuestions = [
  {
    id: 1,
    enunciado: 'Qual recurso do React permite controlar estado dentro de um componente funcional?',
    modalidade: 'React',
    dificuldade: 'Fácil',
    status: 'Ativa',
  },
  {
    id: 2,
    enunciado: 'Em uma API REST, qual método HTTP é mais indicado para atualizar um recurso existente?',
    modalidade: 'Back-end',
    dificuldade: 'Média',
    status: 'Ativa',
  },
  {
    id: 3,
    enunciado: 'O que significa responsividade em uma interface web?',
    modalidade: 'Front-end',
    dificuldade: 'Fácil',
    status: 'Rascunho',
  },
];

function BancoQuestoes() {
  const [questions, setQuestions] = useState(initialQuestions);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('Todas');
  const [form, setForm] = useState({
    enunciado: '',
    modalidade: '',
    dificuldade: 'Fácil',
    status: 'Ativa',
  });

  const filteredQuestions = useMemo(() => {
    const term = search.trim().toLowerCase();

    return questions.filter((question) => {
      const matchesTerm = !term || `${question.enunciado} ${question.modalidade}`.toLowerCase().includes(term);
      const matchesDifficulty = difficulty === 'Todas' || question.dificuldade === difficulty;
      return matchesTerm && matchesDifficulty;
    });
  }, [difficulty, questions, search]);

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleCreateQuestion(event) {
    event.preventDefault();

    if (!form.enunciado.trim() || !form.modalidade.trim()) return;

    const nextQuestion = {
      id: questions.length ? Math.max(...questions.map((item) => item.id)) + 1 : 1,
      enunciado: form.enunciado.trim(),
      modalidade: form.modalidade.trim(),
      dificuldade: form.dificuldade,
      status: form.status,
    };

    setQuestions((current) => [nextQuestion, ...current]);
    setForm({ enunciado: '', modalidade: '', dificuldade: 'Fácil', status: 'Ativa' });
  }

  return (
    <div className="question-bank-page">
      <header className="question-bank-header">
        <div>
          <span className="question-bank-eyebrow">Avaliações</span>
          <h1>Banco de questões</h1>
          <p>Organize questões por curso, dificuldade e status para montar avaliações com mais agilidade.</p>
        </div>
        <div className="question-bank-summary">
          <span>Total</span>
          <strong>{questions.length}</strong>
        </div>
      </header>

      <section className="question-bank-toolbar" aria-label="Filtros do banco de questões">
        <label>
          Buscar
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nome da questão ou curso"
          />
        </label>

        <label>
          Dificuldade
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option>Todas</option>
            <option>Fácil</option>
            <option>Média</option>
            <option>Difícil</option>
          </select>
        </label>
      </section>

      <section className="question-bank-create">
        <form onSubmit={handleCreateQuestion}>
          <label className="question-field-large">
            Nova questão
            <textarea
              name="enunciado"
              value={form.enunciado}
              onChange={handleInputChange}
              placeholder="Digite o enunciado da questão"
              rows="3"
            />
          </label>

          <label>
            Curso
            <input
              name="modalidade"
              value={form.modalidade}
              onChange={handleInputChange}
              placeholder="Ex.: Matemática"
            />
          </label>

          <label>
            Dificuldade
            <select name="dificuldade" value={form.dificuldade} onChange={handleInputChange}>
              <option>Fácil</option>
              <option>Média</option>
              <option>Difícil</option>
            </select>
          </label>

          <label>
            Status
            <select name="status" value={form.status} onChange={handleInputChange}>
              <option>Ativa</option>
              <option>Rascunho</option>
            </select>
          </label>

          <button type="submit" disabled={!form.enunciado.trim() || !form.modalidade.trim()}>
            Adicionar
          </button>
        </form>
      </section>

      <section className="question-bank-list" aria-label="Lista de questões cadastradas">
        {filteredQuestions.length === 0 ? (
          <p className="question-bank-empty">Nenhuma questão encontrada.</p>
        ) : (
          filteredQuestions.map((question) => (
            <article key={question.id} className="question-card">
              <div className="question-card-main">
                <span className="question-card-id">#{question.id}</span>
                <strong>{question.enunciado}</strong>
                <small>{question.modalidade}</small>
              </div>

              <div className="question-card-meta">
                <span>{question.dificuldade}</span>
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
