import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

function App12() {
  const [numbers, setNumbers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNumbers = async () => {
    try {
      setLoading(true)
      setError(null)
      //const response = await fetch('https://localhost:7006/lottery')
      const apiHost = import.meta.env.PROD
        ? 'https://aspnetcore2-api.onrender.com'
        : 'https://localhost:7006'

      // Escolhe qual rota usar; altere a parte do else caso queira um endpoint diferente em desenvolvimento.
      const endpoint = import.meta.env.PROD ? 'lottery' : 'lottery'

      // Realiza a chamada HTTP e lança erro manualmente caso o status não seja 2xx.
      const response = await fetch(`${apiHost}/${endpoint}`)
      const data = await response.json()
      setNumbers(data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  //useEffect(() => {
  //  fetchNumbers()
  //}, [])

  return (
    <>
      <Menu />
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Loteria</h1>
      <div className="card">
        {/* Botão que dispara a requisição para gerar números de loteria. */}
        <button type="button" onClick={fetchNumbers} disabled={loading} className="forecast-button" >
          {loading ? 'Gerando...' : 'Gerar números da sorte'}
        </button>
        <div className="lottery-results">
          {/* Exibe uma mensagem de erro quando a chamada falha. */}
          {error && <p className="error">Falha ao carregar: {error.message}</p>}
          {/* Lista os números retornados pela API quando disponíveis. */}
          {!error && numbers.length > 0 && (
            <ul>
              {numbers.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          )}
          {/* Mensagem padrão quando não há números carregados. */}
          {!error && !loading && numbers.length === 0 && <p>Nenhum número disponível.</p>}
        </div>
      </div>
    </>
  )
}

export default App12
