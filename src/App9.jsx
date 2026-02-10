import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Menu from './components/Menu.jsx'

function App9() {
  const [count, setCount] = useState(0)
  const [forecast, setForecast] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({ nome: '', email: '', nascimento: '', cpf: '' })

  useEffect(() => {
    // Endpoint desativado para evitar erro; apenas finaliza carregamento.
    setForecast([])
    setLoading(false)
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

export default App9
