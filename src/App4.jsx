import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App4() {
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNumbers = async () => {
    try {
      setLoading(true)
      setError(null)
      // Define a URL base diferente para desenvolvimento (localhost) e produção (Render).
      const apiHost = import.meta.env.PROD
        ? 'https://aspnetcore2-api.onrender.com'
        : 'https://localhost:7006'

      // Escolhe qual rota usar; altere a parte do else caso queira um endpoint diferente em desenvolvimento.
      const endpoint = import.meta.env.PROD ? 'ping' : 'ping'

      // Realiza a chamada HTTP e lança erro manualmente caso o status não seja 2xx.
      const response = await fetch(`${apiHost}/${endpoint}`)
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
      const data = await response.text()
      setMessage(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNumbers()
  }, [])

  return (
    <>
      <nav className="menu">
        <Link to="/">Home</Link>
        <Link to="/page2">Page 2</Link>
        <Link to="/page3">Page 3</Link>
        <Link to="/page4">Page 4</Link>
        <Link to="/page5">Page 5</Link>
        <Link to="/page6">Page 6</Link>
        <Link to="/page7">Page 7</Link>
      </nav>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Mensagem da API:</h1>
      <div className="card">
        <div className="lottery-results">
          {error && <p className="error">Falha ao carregar: {error.message}</p>}
          {!error && message && <p className="api-message">{message}</p>}
          {!error && !loading && !message && <p>Nenhum texto disponível.</p>}
        </div>
      </div>
    </>
  )
}

export default App4
