import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

function App10() {
  const [count, setCount] = useState(0)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({ nome: '', email: '', nascimento: '', cpf: '' })

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
        <form className="form-grid" onSubmit={(e) => { e.preventDefault(); console.log(formData); }}>
          <label>
            Nome:
            <input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
          </label>
          <label>
            CPF:
            <input type="text" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} />
          </label>
          <label>
            E-mail:
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
          </label>
          <label>
            Nascimento:
            <input type="date" value={formData.nascimento} onChange={(e) => setFormData({ ...formData, nascimento: e.target.value })} />
          </label>

          <button type="submit">Gravar</button>
        </form>
      </section>
    </>
  )
}

export default App10
