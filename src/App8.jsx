import { useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App8() {
  const [count, setCount] = useState(0)
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [email, setEmail] = useState('')
  const [response, setResponse] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Formata a data de yyyy-MM-dd para dd/MM/yyyy
    const [year, month, day] = birthDate.split('-')
    const formattedBirthDate = day && month && year ? `${day}/${month}/${year}` : birthDate

    const payload = {
      Name: name,
      BirthDate: formattedBirthDate,
      Email: email
    }

    const apiHost = import.meta.env.PROD
      ? 'https://aspnetcore2-api.onrender.com'
      : 'https://localhost:7006'
    const endpoint = 'validar-pessoa'

    try {
      const res = await fetch(`${apiHost}/${endpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      const data = await res.json()
      setResponse({ ok: res.ok, status: res.status, body: data })
      setShowModal(true)
      if (!res.ok) throw new Error(data.mensagem || 'Erro desconhecido')
    } catch (err) {
      setError(err.message || 'Erro de conexão')
      setResponse({ ok: false, status: 0, body: { mensagem: err.message || 'Erro de conexão' } })
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  function closeModal() {
    setShowModal(false)
  }

  return (
    <>
      {loading && <div className="loading">Enviando...</div>}
      {error && <div className="error">Erro: {error}</div>}
      <nav className="menu">
        <Link to="/">Page 1</Link>
        <Link to="/page2">Page 2</Link>
        <Link to="/page3">Page 3</Link>
        <Link to="/page4">Page 4</Link>
      </nav>
      <nav className="menu">       
        <Link to="/page5">Page 5</Link>
        <Link to="/page6">Page 6</Link>
        <Link to="/page7">Page 7</Link>
        <Link to="/page8">Page 8</Link>
      </nav>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Formulário</h1>
      <form className="card form-grid" onSubmit={handleSubmit}>
        <label>
          Nome completo
          <input
            type="text"
            name="name"
            placeholder="Nome completo"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          Data de nascimento
          <input
            type="date"
            name="birthDate"
            required
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
          />
        </label>
        <label>
          E-mail
          <input
            type="email"
            name="email"
            placeholder="seuemail@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit">Enviar</button>
      </form>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Resposta da API</h3>
            {response ? (
              <div className="modal-body">
                <p><strong>Mensagem:</strong> {response.body?.mensagem}</p>
                {response.ok && (
                  <>
                    <p><strong>Nome:</strong> {response.body?.nome}</p>
                    <p><strong>Idade:</strong> {response.body?.idade}</p>
                    <p><strong>Maior de idade:</strong> {response.body?.maiorDeIdade ? 'Sim' : 'Não'}</p>
                    <p><strong>Email existente:</strong> {response.body?.emailExistente ? 'Sim' : 'Não'}</p>
                  </>
                )}
              </div>
            ) : (
              <p>Sem resposta.</p>
            )}
            <div className="modal-actions">
              <button onClick={closeModal}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default App8
