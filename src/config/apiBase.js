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

export const API_BASE = isDev
  ? LOCAL_API_BASE
  : normalizeApiBase(envApiBase || PROD_API_BASE)
