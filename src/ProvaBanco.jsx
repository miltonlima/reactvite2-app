import { useEffect, useMemo, useState } from 'react';
import './ProvaBanco.css';
import { API_BASE } from './config/apiBase';

let provaBancoLastPageViewAt = 0;

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

function getAccessSessionId() {
  const storageKey = 'access_session_id';
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const nextId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storageKey, nextId);
  return nextId;
}

function getStoredUser() {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

async function getClientUserAgent() {
  if (typeof navigator === 'undefined') return null;

  const baseUserAgent = navigator.userAgent || '';

  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const hints = await navigator.userAgentData.getHighEntropyValues([
        'platform',
        'platformVersion',
        'model',
        'uaFullVersion',
        'fullVersionList',
      ]);
      const browserVersion = hints.fullVersionList?.map((item) => `${item.brand} ${item.version}`).join(', ') || hints.uaFullVersion;
      const details = [
        baseUserAgent,
        hints.platform ? `platform=${hints.platform}` : '',
        hints.platformVersion ? `platformVersion=${hints.platformVersion}` : '',
        hints.model ? `model=${hints.model}` : '',
        browserVersion ? `browser=${browserVersion}` : '',
      ].filter(Boolean);

      return details.join(' | ');
    }
  } catch {
    return baseUserAgent || null;
  }

  return baseUserAgent || null;
}

function getClientPlatform() {
  return typeof navigator === 'undefined' ? null : navigator.userAgentData?.platform || navigator.platform || null;
}

async function logProvaBancoEvent({ action, statusCode = 200, httpMethod = 'POST', metadata = {} }) {
  try {
    const user = getStoredUser();
    const clientUserAgent = await getClientUserAgent();
    const clientPlatform = getClientPlatform();

    await fetch(`${API_BASE}/api/access-logs`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: Number(user?.id) || null,
        userEmail: user?.email || null,
        userName: user?.full_name || user?.fullName || user?.name || null,
        userType: user?.tipo || user?.tipoUsuario || user?.userType || user?.perfil || user?.role || null,
        sessionId: getAccessSessionId(),
        pagePath: window.location.pathname,
        pageTitle: 'Prova / Banco',
        action,
        httpMethod,
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'ProvaBanco',
          route: '/prova-banco',
          clientPlatform,
          ...metadata,
        },
      }),
    });
  } catch (err) {
    console.warn('Falha ao registrar log de Prova / Banco:', err);
  }
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
    const now = Date.now();
    if (now - provaBancoLastPageViewAt >= 1000) {
      provaBancoLastPageViewAt = now;
      logProvaBancoEvent({
        action: 'page_view',
        statusCode: 200,
        httpMethod: 'GET',
      });
    }

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
