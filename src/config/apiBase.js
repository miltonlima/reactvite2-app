const LOCAL_API_BASE = 'http://localhost:5151'
const PROD_API_BASE = 'https://aspnetcore2-api.onrender.com/swagger/index.html'

function normalizeApiBase(url) {
  return (url || '')
    .trim()
    .replace(/\/swagger\/index\.html\/?$/i, '')
    .replace(/\/$/, '')
}

const envApiBase = normalizeApiBase(import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || '')
const isDev = Boolean(import.meta.env.DEV)
const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'

const devApiBase = isLocalHost
  ? LOCAL_API_BASE
  : hostname
    ? `http://${hostname}:5151`
    : LOCAL_API_BASE

export const API_BASE = isDev
  ? devApiBase
  : normalizeApiBase(envApiBase || PROD_API_BASE)
