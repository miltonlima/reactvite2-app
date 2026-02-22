import { useState } from 'react'
import './App.css'
import Menu from './components/Menu.jsx'
import { Link } from 'react-router-dom'

function App16() {
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!fullName.trim() || !birthDate || !sex || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Preencha todos os campos.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não conferem.')
      return
    }

    // Aqui você poderia chamar sua API de cadastro.
    setMessage('Cadastro enviado (mock).')
  }

  return (
    <>

      <div className="auth-card">
        <h2>Cadastre-se</h2>
        <p className="auth-subtitle">Preencha seus dados para criar a conta.</p>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Nome completo
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome completo"
            />
          </label>

          <label>
            Data de nascimento
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </label>

          <label>
            Gênero
            <select value={sex} onChange={(e) => setSex(e.target.value)}>
              <option value="">Selecione</option>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="O">Outro</option>
            </select>
          </label>

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

          <label>
            Confirmar senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
            />
          </label>

          <button type="submit">Criar conta</button>
        </form>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <div className="auth-actions">
          <Link className="secondary-link" to="/page15">Voltar</Link>
        </div>

      </div>
    </>
  )
}

export default App16
