import { useEffect, useMemo, useState } from 'react';
import './Avaliacao.css';
import { API_BASE } from './config/apiBase';

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

function getStoredUser() {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

function getUserName(user) {
  return user?.full_name || user?.fullName || user?.name || user?.email || 'Aluno';
}

function Avaliacao() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [latestResult, setLatestResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const user = useMemo(() => getStoredUser(), []);

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    try {
      setLoading(true);
      setError('');
      const data = await request('/api/perguntas');
      const activeQuestions = Array.isArray(data)
        ? data.filter((question) => question.status === 'Ativa' && question.alternativas?.length)
        : [];
      setQuestions(activeQuestions);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar as questões.');
    } finally {
      setLoading(false);
    }
  }

  const answeredCount = Object.keys(answers).filter((questionId) => answers[questionId]).length;
  const canSubmit = questions.length > 0 && answeredCount === questions.length && !saving;

  function handleAnswer(questionId, alternativeId) {
    setAnswers((current) => ({
      ...current,
      [questionId]: alternativeId,
    }));
    setSuccess('');
    setLatestResult(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    const payload = {
      alunoId: Number(user?.id) || null,
      alunoNome: getUserName(user),
      respostas: questions.map((question) => ({
        perguntaId: Number(question.id),
        alternativaId: Number(answers[question.id]),
      })),
    };

    try {
      setSaving(true);
      setError('');
      setSuccess('');
      const result = await request('/api/avaliacoes/respostas', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setLatestResult(result);
      setSuccess('Respostas salvas com sucesso.');
    } catch (err) {
      setError(err.message || 'Não foi possível salvar as respostas.');
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setAnswers({});
    setLatestResult(null);
    setSuccess('');
    setError('');
  }

  return (
    <div className="assessment-page">
      <header className="assessment-header">
        <div>
          <span>Prova</span>
          <h1>Responder avaliação</h1>
          <p>Selecione uma alternativa para cada questão cadastrada no banco de questões.</p>
        </div>

        <div className="assessment-progress">
          <strong>{answeredCount}/{questions.length}</strong>
          <small>respondidas</small>
        </div>
      </header>

      {latestResult && (
        <section className="assessment-result" aria-label="Resultado da avaliação">
          <div>
            <span>Resultado</span>
            <strong>{latestResult.totalCorretas} de {latestResult.totalPerguntas}</strong>
          </div>
          <div>
            <span>Aproveitamento</span>
            <strong>{Number(latestResult.percentual || 0).toFixed(0)}%</strong>
          </div>
        </section>
      )}

      <form className="assessment-form" onSubmit={handleSubmit}>
        {loading && <p className="assessment-empty">Carregando questões...</p>}
        {error && <p className="assessment-message error">Erro: {error}</p>}
        {success && <p className="assessment-message success">{success}</p>}

        {!loading && questions.length === 0 && (
          <p className="assessment-empty">Nenhuma questão ativa encontrada no banco de questões.</p>
        )}

        {questions.map((question, questionIndex) => (
          <article key={question.id} className="assessment-question">
            <div className="assessment-question-heading">
              <span>Questão {questionIndex + 1}</span>
              <strong>{question.enunciado}</strong>
            </div>

            <div className="assessment-options">
              {question.alternativas.map((alternative, alternativeIndex) => {
                const isChecked = Number(answers[question.id]) === Number(alternative.id);
                return (
                  <label key={alternative.id} className={`assessment-option ${isChecked ? 'is-selected' : ''}`}>
                    <input
                      type="radio"
                      name={`pergunta-${question.id}`}
                      value={alternative.id}
                      checked={isChecked}
                      onChange={() => handleAnswer(question.id, alternative.id)}
                      disabled={saving}
                    />
                    <span>{String.fromCharCode(65 + alternativeIndex)}</span>
                    <p>{alternative.texto}</p>
                  </label>
                );
              })}
            </div>
          </article>
        ))}

        <div className="assessment-actions">
          <button type="button" className="assessment-secondary-button" onClick={handleClear} disabled={saving || answeredCount === 0}>
            Limpar respostas
          </button>
          <button type="submit" className="assessment-submit-button" disabled={!canSubmit}>
            {saving ? 'Salvando...' : 'Enviar respostas'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default Avaliacao;
