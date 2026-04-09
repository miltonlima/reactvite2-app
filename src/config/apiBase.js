const PROD_API_BASE = 'https://aspnetcore2-api.onrender.com'
const LOCAL_API_BASE = 'http://localhost:5151'

const envApiBase = (import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || '').trim()

const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1'
const envPointsToLocal = /localhost|127\.0\.0\.1|\[::1\]|::1/.test(envApiBase)

export const API_BASE = envApiBase
  ? isLocalHost
    ? envApiBase
    : envPointsToLocal
      ? PROD_API_BASE
      : envApiBase
  : isLocalHost
    ? LOCAL_API_BASE
    : PROD_API_BASE
