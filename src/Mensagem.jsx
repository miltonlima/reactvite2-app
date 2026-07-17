import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE } from './config/apiBase';

let mensagemLastPageViewAt = 0;

function getAccessSessionId() {
  const storageKey = 'access_session_id';
  const existing = localStorage.getItem(storageKey);
  if (existing) return existing;

  const nextId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  localStorage.setItem(storageKey, nextId);
  return nextId;
}

function getStoredUser() {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
}

async function getClientUserAgent() {
  if (typeof navigator === 'undefined') return null;

  const baseUserAgent = navigator.userAgent || '';

  try {
    if (navigator.userAgentData?.getHighEntropyValues) {
      const hints = await navigator.userAgentData.getHighEntropyValues([
        'platform',
        'platformVersion',
        'model',
        'uaFullVersion',
        'fullVersionList',
      ]);
      const browserVersion = hints.fullVersionList?.map((item) => `${item.brand} ${item.version}`).join(', ') || hints.uaFullVersion;
      const details = [
        baseUserAgent,
        hints.platform ? `platform=${hints.platform}` : '',
        hints.platformVersion ? `platformVersion=${hints.platformVersion}` : '',
        hints.model ? `model=${hints.model}` : '',
        browserVersion ? `browser=${browserVersion}` : '',
      ].filter(Boolean);

      return details.join(' | ');
    }
  } catch {
    return baseUserAgent || null;
  }

  return baseUserAgent || null;
}

function getClientPlatform() {
  return typeof navigator === 'undefined' ? null : navigator.userAgentData?.platform || navigator.platform || null;
}

async function logMensagemEvent({ action, statusCode = 200, httpMethod = 'POST', metadata = {} }) {
  try {
    const user = getStoredUser();
    const clientUserAgent = await getClientUserAgent();
    const clientPlatform = getClientPlatform();

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
        pageTitle: 'Mensagens',
        action,
        httpMethod,
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'Mensagem',
          route: '/mensagem',
          clientPlatform,
          ...metadata,
        },
      }),
    });
  } catch (err) {
    console.warn('Falha ao registrar log de mensagens:', err);
  }
}

function Mensagem() {
  useEffect(() => {
    const now = Date.now();
    if (now - mensagemLastPageViewAt < 1000) return;
    mensagemLastPageViewAt = now;

    logMensagemEvent({
      action: 'page_view',
      statusCode: 200,
      httpMethod: 'GET',
    });
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h1>Página de Mensagens</h1>
      <p>Esta é a página para gerenciar mensagens.</p>
      <br />
      <Link to="/page17">Voltar ao Dashboard</Link>
    </div>
  );
}

export default Mensagem;
