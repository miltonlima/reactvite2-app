import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

function App6() {
  const [count, setCount] = useState(0)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    const fetchForecast = async () => {
      try {
        //const response = await fetch('https://localhost:7006/weatherforecast', {
        const apiHost = import.meta.env.PROD
          ? 'https://aspnetcore2-api.onrender.com'
          : 'https://localhost:7006'

        // Escolhe qual rota usar; altere a parte do else caso queira um endpoint diferente em desenvolvimento.
        const endpoint = import.meta.env.PROD ? 'weatherforecast' : 'weatherforecast'

        // Realiza a chamada HTTP e lança erro manualmente caso o status não seja 2xx.
        const response = await fetch(`${apiHost}/${endpoint}`)
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }
        const data = await response.json()
        setForecast(data)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchForecast()

    return () => controller.abort()
  }, [])

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
      <h1>Novo Formulário</h1>
      <section className="crud-container">
        <div><p>Nome</p>
          <p>E-mail</p>
          <p>nascimento</p>
          <p>CPF</p>
        </div>
        <div>
          <button>Gravar</button>
        </div>



      </section>
    </>
  )
}

export default App6
