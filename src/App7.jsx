import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App7() {
  const [numbers, setNumbers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchNumbers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('https://localhost:7006/lottery')
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`)
      }
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
      <h1>Loteria</h1>
      <div className="card">
        <button type="button" onClick={fetchNumbers} disabled={loading} className="forecast-button" >
          {loading ? 'Gerando...' : 'Gerar números'}
        </button>
        <div className="lottery-results">
          {error && <p className="error">Falha ao carregar: {error.message}</p>}
          {!error && numbers.length > 0 && (
            <ul>
              {numbers.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
          )}
          {!error && !loading && numbers.length === 0 && <p>Nenhum número disponível.</p>}
        </div>
      </div>
    </>
  )
}

export default App7
