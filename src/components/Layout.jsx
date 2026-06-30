import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import SidebarMenu from './SidebarMenu';
import { API_BASE } from '../config/apiBase';

function toInputDate(value) {
  if (!value) return '';
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function getUserValue(user, ...keys) {
  for (const key of keys) {
    if (user?.[key] !== undefined && user?.[key] !== null) {
      return user[key];
    }
  }
  return '';
}

const SEX_OPTIONS = ['Feminino', 'Masculino', 'Outro', 'Não informado'];

function normalizeSexOption(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const options = {
    f: 'Feminino',
    feminino: 'Feminino',
    female: 'Feminino',
    m: 'Masculino',
    masculino: 'Masculino',
    male: 'Masculino',
    outro: 'Outro',
    other: 'Outro',
    'não informado': 'Não informado',
    'nao informado': 'Não informado',
  };

  return options[normalized] || '';
}

const SEX_SELECT_OPTIONS = [
  { value: 'F', label: 'Feminino' },
  { value: 'M', label: 'Masculino' },
  { value: 'O', label: 'Outro' },
  { value: 'N', label: 'Nao informado' },
];

function normalizeSexCode(value) {
  const normalized = String(value || '').trim().toLowerCase();
  const directCodes = {
    f: 'F',
    feminino: 'F',
    female: 'F',
    m: 'M',
    masculino: 'M',
    male: 'M',
    o: 'O',
    outro: 'O',
    other: 'O',
    n: 'N',
    'não informado': 'N',
    'nao informado': 'N',
  };
  const legacyLabel = normalizeSexOption(value);
  const labelMatch = SEX_SELECT_OPTIONS.find((option) => option.label.toLowerCase() === String(legacyLabel).toLowerCase());
  const legacyOption = SEX_OPTIONS.find((option) => String(option).trim().toLowerCase() === normalized);

  return directCodes[normalized] || labelMatch?.value || directCodes[String(legacyOption || '').trim().toLowerCase()] || '';
}

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = body?.mensagem || body?.detail || body?.message || response.statusText;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  return body;
}

function getUserType(user) {
  return String(
    user?.tipo ||
    user?.tipoUsuario ||
    user?.tipo_usuario ||
    user?.userType ||
    user?.user_type ||
    user?.perfil ||
    user?.role ||
    ''
  ).trim().toLowerCase();
}

function isAlunoUser(userType) {
  return ['aluno', 'student', 'estudante'].includes(userType);
}

function getStoredUser() {
  try {
    const userData = localStorage.getItem('user');
    if (!userData) return null;
    return JSON.parse(userData);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
}

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

async function logLogoutEvent(user, pagePath) {
  try {
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
        pagePath,
        pageTitle: 'Logout',
        action: 'logout',
        httpMethod: 'POST',
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode: 200,
        metadata: {
          source: 'Layout',
          route: pagePath,
          clientPlatform,
        },
      }),
    });
  } catch (error) {
    console.warn('Falha ao registrar log de logout:', error);
  }
}

async function logProfileEvent({ user, action, statusCode = 200, metadata = {} }) {
  try {
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
        pageTitle: 'Editar cadastro',
        action,
        httpMethod: 'PUT',
        referrer: document.referrer || null,
        userAgent: clientUserAgent,
        statusCode,
        metadata: {
          source: 'Layout',
          route: window.location.pathname,
          clientPlatform,
          ...metadata,
        },
      }),
    });
  } catch (error) {
    console.warn('Falha ao registrar log de cadastro:', error);
  }
}

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => getStoredUser());
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    birthDate: '',
    sex: '',
    email: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const isAuthenticated = Boolean(user);
  const userName = user?.full_name || 'Usuário';
  const userEmail = user?.email || '';
  const userType = getUserType(user);

  useEffect(() => {
    if (!user) {
      navigate('/page15', { replace: true });
    }
  }, [navigate, user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (isAlunoUser(userType) && location.pathname.startsWith('/modalidade')) {
      navigate('/page17', { replace: true });
    }
  }, [isAuthenticated, location.pathname, navigate, userType]);

  // Função de logout que será compartilhada via Context.
  async function handleLogout() {
    const shouldLogout = window.confirm('Deseja realmente deslogar da plataforma?');
    if (!shouldLogout) {
      return;
    }

    await logLogoutEvent(user, location.pathname);
    localStorage.removeItem('user');
    setUser(null);
    navigate('/page15');
  }

  function handleOpenProfileModal() {
    setProfileForm({
      fullName: getUserValue(user, 'full_name', 'fullName', 'name'),
      birthDate: toInputDate(getUserValue(user, 'birth_date', 'birthDate')),
      sex: normalizeSexCode(getUserValue(user, 'sex', 'sexo')),
      email: getUserValue(user, 'email'),
    });
    setProfileError('');
    setProfileSuccess('');
    setIsProfileModalOpen(true);
    setSidebarOpen(false);
  }

  function handleCloseProfileModal() {
    if (profileSaving) return;
    setIsProfileModalOpen(false);
    setProfileError('');
    setProfileSuccess('');
  }

  function handleProfileInputChange(event) {
    const { name, value } = event.target;
    setProfileForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();
    const userId = Number(user?.id);

    if (!userId) {
      setProfileError('Usuário inválido para atualização.');
      return;
    }

    try {
      setProfileSaving(true);
      setProfileError('');
      setProfileSuccess('');

      const payload = {
        fullName: profileForm.fullName.trim(),
        birthDate: profileForm.birthDate,
        sex: profileForm.sex.trim(),
        email: getUserValue(user, 'email'),
      };

      const response = await request(`/api/alunos/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const updatedAluno = response?.aluno || response?.Aluno || response;
      const nextUser = {
        ...user,
        full_name: updatedAluno?.fullName || updatedAluno?.full_name || payload.fullName,
        birth_date: updatedAluno?.birthDate || updatedAluno?.birth_date || payload.birthDate,
        sex: updatedAluno?.sex || updatedAluno?.Sex || payload.sex,
        email: updatedAluno?.email || updatedAluno?.Email || payload.email,
      };

      localStorage.setItem('user', JSON.stringify(nextUser));
      setUser(nextUser);
      await logProfileEvent({
        user: nextUser,
        action: 'profile_update_success',
        statusCode: 200,
        metadata: {
          profileUserId: userId,
          updatedFields: ['fullName', 'birthDate', 'sex'],
        },
      });
      setProfileSuccess(response?.mensagem || 'Cadastro atualizado com sucesso.');
    } catch (error) {
      await logProfileEvent({
        user,
        action: 'profile_update_failed',
        statusCode: error.status || 0,
        metadata: {
          profileUserId: userId,
          updatedFields: ['fullName', 'birthDate', 'sex'],
          reason: error.message || 'profile_update_error',
        },
      });
      setProfileError(error.message || 'Falha ao atualizar cadastro.');
    } finally {
      setProfileSaving(false);
    }
  }

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 900) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ handleLogout }}>
      <div className="dashboard">
        <SidebarMenu
          userName={userName}
          userEmail={userEmail}
          userType={userType}
          isMobileOpen={sidebarOpen}
          onNavigate={() => setSidebarOpen(false)}
          onProfileClick={handleOpenProfileModal}
        />
        <button
          type="button"
          className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
          aria-label="Fechar menu lateral"
          onClick={() => setSidebarOpen(false)}
        />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="dashboard-header-left">
              <button
                type="button"
                className="mobile-menu-toggle"
                aria-label="Abrir menu"
                onClick={() => setSidebarOpen(true)}
              >
                Menu
              </button>
              <h2>Painel</h2>
            </div>
            <button onClick={handleLogout} className="logout-button">Sair</button>
          </header>
          {/* O Outlet renderiza o componente filho (ex: App17) diretamente aqui */}
          <Outlet />
        </main>
      </div>

      {isProfileModalOpen && (
        <div
          className="profile-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCloseProfileModal();
          }}
        >
          <section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
            <div className="profile-modal-header">
              <div>
                <h2 id="profile-modal-title">Editar cadastro</h2>
                <p>Atualize seus dados principais de perfil.</p>
              </div>
              <button type="button" onClick={handleCloseProfileModal} disabled={profileSaving}>
                Fechar
              </button>
            </div>

            {profileError && <p className="error profile-modal-state">Erro: {profileError}</p>}
            {profileSuccess && <p className="success profile-modal-state">{profileSuccess}</p>}

            <form className="profile-form" onSubmit={handleSaveProfile}>
              <label>
                Nome completo
                <input
                  name="fullName"
                  type="text"
                  value={profileForm.fullName}
                  onChange={handleProfileInputChange}
                  required
                />
              </label>

              <label>
                Data de nascimento
                <input
                  name="birthDate"
                  type="date"
                  value={profileForm.birthDate}
                  onChange={handleProfileInputChange}
                  required
                />
              </label>

              <label>
                Sexo
                <select
                  name="sex"
                  value={profileForm.sex}
                  onChange={handleProfileInputChange}
                  required
                >
                  <option value="">Selecione</option>
                  {SEX_SELECT_OPTIONS.map((option) => (
                    <option value={option.value} key={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label>
                E-mail
                <input
                  name="email"
                  type="email"
                  value={profileForm.email}
                  disabled
                  readOnly
                />
              </label>

              <div className="profile-modal-actions">
                <button type="submit" disabled={profileSaving}>
                  {profileSaving ? 'Salvando...' : 'Salvar alterações'}
                </button>
                <button type="button" onClick={handleCloseProfileModal} disabled={profileSaving}>
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export default Layout;
