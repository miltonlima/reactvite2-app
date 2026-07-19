import { useEffect, useState } from 'react'
import './App.css'
import Menu from './components/Menu.jsx'
import { Link, useNavigate } from 'react-router-dom'
import { API_BASE } from './config/apiBase'

let page16LastPageViewAt = 0

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

async function getClientUserAgent() {
  if (typeof navigator === 'undefined') return null

  const baseUserAgent = navigator.userAgent || ''

  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const hints = await navigator.userAgentData.getHighEntropyValues([
        'platform',
        'platformVersion',
        'model',
        'uaFullVersion',
        'fullVersionList',
      ])
      const browserVersion = hints.fullVersionList?.map((item) => `${item.brand} ${item.version}`).join(', ') || hints.uaFullVersion
      const details = [
        baseUserAgent,
        hints.platform ? `platform=${hints.platform}` : '',
        hints.platformVersion ? `platformVersion=${hints.platformVersion}` : '',
        hints.model ? `model=${hints.model}` : '',
        browserVersion ? `browser=${browserVersion}` : '',
      ].filter(Boolean)

      return details.join(' | ')
    }
  } catch {
    return baseUserAgent || null
  }

  return baseUserAgent || null
}

function getClientPlatform() {
  return typeof navigator === 'undefined' ? null : navigator.userAgentData?.platform || navigator.platform || null
}

async function logPage16Event({ action, statusCode = 200, httpMethod = 'POST', metadata = {} }) {
  try {
    const user = getStoredUser()
    const clientUserAgent = await getClientUserAgent()
    const clientPlatform = getClientPlatform()

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
        pageTitle: 'Cadastro',
        action,
        httpMethod,
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'App16',
          route: '/page16',
          clientPlatform,
          ...metadata,
        },
      }),
    })
  } catch (err) {
    console.warn('Falha ao registrar log da página de cadastro:', err)
  }
}

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

  useEffect(() => {
    const now = Date.now()
    if (now - page16LastPageViewAt < 1000) return
    page16LastPageViewAt = now

    logPage16Event({
      action: 'page_view',
      statusCode: 200,
      httpMethod: 'GET',
    })
  }, [])

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

          <button type="submit" className="create-account-button" disabled={loading}>
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
