import { useState } from 'react'
import './App.css'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from './config/apiBase'

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
        // Armazena dados do usuário em localStorage para proteção de rotas
        localStorage.setItem('user', JSON.stringify(data.usuario))
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
    <main className="education-login-page">
      <section className="education-login-shell">
        <div className="education-login-panel">
          <div className="education-brand">
            <div className="education-brand-mark">EA</div>
            <div>
              <span>Ambiente Educacional</span>
              <strong>Atividades e Cursos</strong>
            </div>
          </div>

          <div className="education-login-copy">
            <span className="education-kicker">Portal de aprendizagem</span>
            <h1>Sistema de Atividades Educacionais</h1>
            <p>
              Acesse seus cursos, acompanhe inscrições e organize conteúdos em um espaço simples para alunos e professores.
            </p>
          </div>

          <div className="education-visual" aria-hidden="true">
            <div className="education-board">
              <span>Plano da aula</span>
              <strong>Cursos ativos</strong>
              <div></div>
              <div></div>
              <div></div>
            </div>
            <div className="education-stack">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <div className="auth-card education-auth-card">
          <h2>Entrar na plataforma</h2>
          <p className="auth-subtitle">Informe suas credenciais para continuar.</p>

          <form className="form-grid education-auth-form" onSubmit={handleSubmit}>
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
                placeholder="Digite sua senha"
              />
            </label>

            <button type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {error && <p className="error education-auth-message">Erro: {error}</p>}
          {message && <p className="success education-auth-message">{message}</p>}

          <p className="auth-subtitle education-register-link">
            Ainda não tem conta? <Link to="/page16">Cadastre-se</Link>
          </p>
        </div>
      </section>
    </main>
  )
}

export default App15
