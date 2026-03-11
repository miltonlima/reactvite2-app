import { useState } from 'react'
import './App.css'
import Menu from './components/Menu.jsx'
import { Link, useNavigate } from 'react-router-dom'

// Em produção, use o endpoint público da API; ajuste VITE_API_BASE no deploy.
const API_BASE = import.meta.env.VITE_API_BASE || 'https://aspnetcore2-api.onrender.com'

function App16() {
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [sex, setSex] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
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

    setLoading(true)

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fullName: fullName.trim(),
          birthDate,
          sex,
          email: email.trim(),
          password,
          confirmPassword
        }),
      })

      const data = await response.json().catch(() => null)

      if (response.ok) {
        setMessage(data?.mensagem ?? 'Cadastro realizado com sucesso.')
        setTimeout(() => navigate('/page15'), 2000)
        return
      }

      if (response.status === 400) {
        setError(data?.mensagem ?? 'Dados inválidos.')
        return
      }

      setError(data?.mensagem ?? 'Falha ao criar conta. Tente novamente.')
    } catch (err) {
      console.error('Erro ao cadastrar:', err)
      setError('Erro ao conectar à API de cadastro.')
    } finally {
      setLoading(false)
    }
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

          <button type="submit" disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
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
