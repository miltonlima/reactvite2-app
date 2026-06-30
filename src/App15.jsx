import { useEffect, useState } from 'react'
import './App.css'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from './config/apiBase'

let page15LastPageViewAt = 0

function getAccessSessionId() {
  const storageKey = 'access_session_id'
  const existing = localStorage.getItem(storageKey)
  if (existing) return existing

  const nextId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  localStorage.setItem(storageKey, nextId)
  return nextId
}

function getStoredUser() {
  try {
    const userData = localStorage.getItem('user')
    return userData ? JSON.parse(userData) : null
  } catch {
    return null
  }
}

function getClientUserAgent() {
  return typeof navigator === 'undefined' ? null : navigator.userAgent || null
}

function getClientPlatform() {
  return typeof navigator === 'undefined' ? null : navigator.userAgentData?.platform || navigator.platform || null
}

async function logAccessEvent({
  action,
  statusCode = 200,
  user = null,
  metadata = {},
}) {
  try {
    await fetch(`${API_BASE}/api/access-logs`, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: Number(user?.id) || null,
        userEmail: user?.email || null,
        userName: user?.full_name || user?.fullName || user?.name || null,
        userType: user?.tipo || user?.tipoUsuario || user?.userType || user?.perfil || user?.role || null,
        sessionId: getAccessSessionId(),
        pagePath: window.location.pathname,
        pageTitle: 'Página 15',
        action,
        httpMethod: 'GET',
        referrer: document.referrer || null,
        userAgent: getClientUserAgent(),
        statusCode,
        metadata: {
          source: 'App15',
          route: '/page15',
          clientPlatform: getClientPlatform(),
          ...metadata,
        },
      }),
    })
  } catch (err) {
    console.warn('Falha ao registrar log de acesso:', err)
  }
}

function App15() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    async function logPageAccess() {
      const now = Date.now()
      if (now - page15LastPageViewAt < 1000) return
      page15LastPageViewAt = now

      const user = getStoredUser()
      await logAccessEvent({ action: 'page_view', statusCode: 200, user })
    }

    logPageAccess()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Informe e-mail e senha.')
      await logAccessEvent({
        action: 'login_failed',
        statusCode: 400,
        metadata: {
          attemptedEmail: email.trim() || null,
          reason: 'missing_credentials',
        },
      })
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
        await logAccessEvent({
          action: 'login_success',
          statusCode: response.status,
          user: data.usuario,
          metadata: {
            attemptedEmail: email.trim(),
            destination: '/page17',
          },
        })
        navigate('/page17')
        return
      }

      if (response.status === 401) {
        setError(data?.mensagem ?? 'E-mail ou senha inválidos.')
        await logAccessEvent({
          action: 'login_failed',
          statusCode: response.status,
          metadata: {
            attemptedEmail: email.trim(),
            reason: 'invalid_credentials',
          },
        })
        return
      }

      setError(data?.mensagem ?? 'Falha ao autenticar. Tente novamente.')
      await logAccessEvent({
        action: 'login_failed',
        statusCode: response.status,
        metadata: {
          attemptedEmail: email.trim(),
          reason: data?.mensagem || response.statusText || 'authentication_error',
        },
      })
    } catch (err) {
      console.error('Erro ao autenticar:', err)
      setError('Erro ao conectar à API de login.')
      await logAccessEvent({
        action: 'login_failed',
        statusCode: 0,
        metadata: {
          attemptedEmail: email.trim(),
          reason: 'network_error',
        },
      })
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

