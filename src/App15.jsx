import { useState } from 'react'
import './App.css'
import Menu from './components/Menu.jsx'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'https://localhost:7006'

function App15() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Informe e-mail e senha.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => null)

      if (response.ok) {
        setMessage(data?.mensagem ?? 'Login validado com sucesso.')
        navigate('/page17')
        return
      }

      if (response.status === 401) {
        setError(data?.mensagem ?? 'E-mail ou senha inválidos.')
        return
      }

      setError(data?.mensagem ?? 'Falha ao autenticar. Tente novamente.')
    } catch (err) {
      console.error('Erro ao autenticar:', err)
      setError('Erro ao conectar à API de login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      

      <div className="auth-card">
        <h2>Entrar</h2>
        <p className="auth-subtitle">Informe e-mail e senha para continuar.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
            />
          </label>

          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <p className="auth-subtitle">
          Ainda não tem conta? <Link to="/page16">Cadastre-se</Link>
        </p>
      </div>
    </>
  )
}

export default App15
