import { useState } from 'react'
import './App.css'
import Menu from './components/Menu.jsx'
import { Link } from 'react-router-dom'

function App14() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Informe e-mail e senha.')
      return
    }

    // Aqui você poderia chamar sua API de autenticação.
    setMessage('Login enviado (mock).')
  }

  return (
    <>
      <Menu />

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

          <button type="submit">Entrar</button>
        </form>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <p className="auth-subtitle">
          Ainda não tem conta? <Link to="/page10">Cadastre-se</Link>
        </p>
      </div>
    </>
  )
}

export default App14
