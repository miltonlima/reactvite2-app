import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

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
      </nav>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Painel de Previsão do Tempo</h1>      
      <section className="forecast">
        {loading && <p>Loading forecast...</p>}
        {error && <p className="error">Failed to load: {error.message}</p>}
        {!loading && !error && (
          <ul className="forecast-list">
            {forecast.map((item) => (
              <li key={item.date}>
                <strong>{item.date}</strong>
                <span>{item.temperatureC} °C / {item.temperatureF} °F</span>
                <span>{item.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default App6
