import { useEffect, useMemo, useState } from 'react';
import './ProvaBanco.css';
import { API_BASE } from './config/apiBase';

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new Error(body?.mensagem || body?.detail || body?.message || response.statusText);
  }

  return body;
}

function formatDifficulty(value) {
  const labels = {
    Facil: 'Fácil',
    Media: 'Média',
    Dificil: 'Difícil',
  };

  return labels[value] || value || '-';
}

function ProvaBanco() {
  const [modalidades, setModalidades] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [questoes, setQuestoes] = useState([]);
  const [modalidadeId, setModalidadeId] = useState('');
  const [cursoId, setCursoId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError('');

      const [modalidadesData, cursosData, questoesData] = await Promise.all([
        request('/api/modalidades'),
        request('/api/turmas'),
        request('/api/perguntas'),
      ]);

      setModalidades(Array.isArray(modalidadesData) ? modalidadesData : []);
      setCursos(Array.isArray(cursosData) ? cursosData : []);
      setQuestoes(Array.isArray(questoesData) ? questoesData : []);
    } catch (err) {
      setError(err.message || 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }

  const sortedModalidades = useMemo(() => (
    [...modalidades].sort((a, b) => String(a.courseName || '').localeCompare(String(b.courseName || ''), 'pt-BR'))
  ), [modalidades]);

  const cursosDaModalidade = useMemo(() => (
    cursos
      .filter((curso) => Number(curso.modalidadeId) === Number(modalidadeId))
      .sort((a, b) => String(a.nomeTurma || '').localeCompare(String(b.nomeTurma || ''), 'pt-BR'))
  ), [cursos, modalidadeId]);

  const selectedCurso = useMemo(() => (
    cursos.find((curso) => Number(curso.id) === Number(cursoId)) || null
  ), [cursos, cursoId]);

  const activeQuestions = useMemo(() => (
    questoes
      .filter((questao) => String(questao.status || '').toLowerCase() !== 'inativa')
      .sort((a, b) => Number(b.id) - Number(a.id))
  ), [questoes]);

  function handleModalidadeChange(event) {
    setModalidadeId(event.target.value);
    setCursoId('');
  }

  return (
    <main className="prova-banco-page">
      <section className="prova-banco-header">
        <span>Prova / Banco</span>
        <h1>Selecionar questões por curso</h1>
        <p>
          Escolha uma modalidade e depois um curso para visualizar as questões disponíveis no banco.
        </p>
      </section>

      <section className="prova-banco-filters" aria-label="Filtros de seleção">
        <label>
          Modalidade
          <select value={modalidadeId} onChange={handleModalidadeChange} disabled={loading}>
            <option value="">Selecione uma modalidade</option>
            {sortedModalidades.map((modalidade) => (
              <option key={modalidade.id} value={modalidade.id}>
                {modalidade.courseName}
              </option>
            ))}
          </select>
        </label>

        <label>
          Curso
          <select value={cursoId} onChange={(event) => setCursoId(event.target.value)} disabled={loading || !modalidadeId}>
            <option value="">Selecione um curso</option>
            {cursosDaModalidade.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {curso.nomeTurma}
              </option>
            ))}
          </select>
        </label>
      </section>

      {error && <p className="prova-banco-message error">Erro: {error}</p>}

      {loading ? (
        <p className="prova-banco-empty">Carregando informações...</p>
      ) : !modalidadeId ? (
        <p className="prova-banco-empty">Selecione uma modalidade para começar.</p>
      ) : cursosDaModalidade.length === 0 ? (
        <p className="prova-banco-empty">Nenhum curso encontrado para esta modalidade.</p>
      ) : !cursoId ? (
        <p className="prova-banco-empty">Agora selecione um curso para listar as questões.</p>
      ) : (
        <section className="prova-banco-questions">
          <div className="prova-banco-list-header">
            <div>
              <span>Curso selecionado</span>
              <h2>{selectedCurso?.nomeTurma || 'Curso'}</h2>
            </div>
            <strong>{activeQuestions.length} questão(ões)</strong>
          </div>

          {activeQuestions.length === 0 ? (
            <p className="prova-banco-empty">Nenhuma questão ativa cadastrada no banco.</p>
          ) : (
            <div className="prova-banco-question-list">
              {activeQuestions.map((questao, index) => (
                <article className="prova-banco-question-card" key={questao.id}>
                  <div className="prova-banco-question-top">
                    <span>Questão #{index + 1}</span>
                    <small>{formatDifficulty(questao.dificuldade)}</small>
                  </div>
                  <h3>{questao.enunciado}</h3>
                  <ul>
                    {(questao.alternativas || []).map((alternativa) => (
                      <li key={alternativa.id} className={alternativa.correta ? 'correct' : ''}>
                        <span>{alternativa.ordem}</span>
                        {alternativa.texto}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default ProvaBanco;
