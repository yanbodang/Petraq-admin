export interface AdminAuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'super_admin' | 'family_admin';
  familyId?: string;
}

export interface AdminAuthSession {
  user: AdminAuthUser;
  token: string;
  loginAt: string;
}

export interface AdminLoginChallenge {
  id: string;
  qrPayload: string;
  expiresAt: string;
}

const SESSION_KEY = 'petraq.admin.auth.session';

function isBrowser() {
  return typeof window !== 'undefined';
}

function apiUrl(path: string) {
  const baseUrl = import.meta.env.VITE_PETRAQ_ADMIN_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error('管理端认证服务尚未配置');
  }
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
}

export const adminAuthService = {
  getSession(): AdminAuthSession | null {
    if (!isBrowser()) return null;

    const stored = window.localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    try {
      return JSON.parse(stored) as AdminAuthSession;
    } catch {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }
  },

  async login(identifier: string, password: string): Promise<AdminAuthSession> {
    if (!identifier.trim() || !password.trim()) {
      throw new Error('请输入账号和密码');
    }

    const response = await fetch(apiUrl('api/mobile/admin-auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });

    if (!response.ok) {
      throw new Error(response.status === 401 ? '账号或密码错误' : '登录服务暂时不可用');
    }

    const payload = await response.json() as { token: string; user: AdminAuthUser };
    const session: AdminAuthSession = {
      token: payload.token,
      user: payload.user,
      loginAt: new Date().toISOString(),
    };
    if (isBrowser()) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async exchangeAppCode(code: string): Promise<AdminAuthSession> {
    const response = await fetch(apiUrl('api/mobile/admin-sso/exchange'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!response.ok) throw new Error('一键登录链接无效或已过期');
    const payload = await response.json() as { token: string; user: AdminAuthUser };
    const session: AdminAuthSession = { token: payload.token, user: payload.user, loginAt: new Date().toISOString() };
    if (isBrowser()) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async createLoginChallenge(signal?: AbortSignal): Promise<AdminLoginChallenge> {
    const response = await fetch(apiUrl('api/admin-sso/challenges'), { method: 'POST', signal });
    if (!response.ok) throw new Error('二维码登录服务暂时不可用');
    return response.json() as Promise<AdminLoginChallenge>;
  },

  async checkLoginChallenge(id: string, signal?: AbortSignal): Promise<AdminAuthSession | null> {
    const response = await fetch(apiUrl(`api/admin-sso/challenges/${encodeURIComponent(id)}`), { signal });
    if (response.status === 410) throw new Error('二维码已过期');
    if (!response.ok) throw new Error('二维码登录服务暂时不可用');
    const payload = await response.json() as { status: string; token?: string; user?: AdminAuthUser };
    if (payload.status !== 'approved' || !payload.token || !payload.user) return null;
    const session: AdminAuthSession = { token: payload.token, user: payload.user, loginAt: new Date().toISOString() };
    if (isBrowser()) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  logout() {
    if (isBrowser()) window.localStorage.removeItem(SESSION_KEY);
  },
};
