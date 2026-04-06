export interface MockAuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export interface MockAuthSession {
  user: MockAuthUser;
  token: string;
  loginAt: string;
}

interface StoredMockAccount extends MockAuthUser {
  password: string;
}

const STORAGE_KEYS = {
  accounts: 'petraq.mock-auth.accounts',
  session: 'petraq.mock-auth.session',
};

const DEMO_ACCOUNTS: StoredMockAccount[] = [
  {
    id: 'mock-admin-1',
    name: 'PetraQ Admin',
    email: 'admin@petraq.mock',
    phone: '13800138000',
    role: '超级管理员',
    password: 'PetraQ123',
  },
  {
    id: 'mock-ops-1',
    name: 'Subscription Ops',
    email: 'ops@petraq.mock',
    phone: '13900139000',
    role: '运营经理',
    password: 'PetraQ123',
  },
];

function isBrowser() {
  return typeof window !== 'undefined';
}

function readAccounts(): StoredMockAccount[] {
  if (!isBrowser()) {
    return DEMO_ACCOUNTS;
  }

  const stored = window.localStorage.getItem(STORAGE_KEYS.accounts);
  if (!stored) {
    window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(DEMO_ACCOUNTS));
    return DEMO_ACCOUNTS;
  }

  try {
    const accounts = JSON.parse(stored) as StoredMockAccount[];
    if (!Array.isArray(accounts) || accounts.length === 0) {
      window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(DEMO_ACCOUNTS));
      return DEMO_ACCOUNTS;
    }
    return accounts;
  } catch {
    window.localStorage.setItem(STORAGE_KEYS.accounts, JSON.stringify(DEMO_ACCOUNTS));
    return DEMO_ACCOUNTS;
  }
}

function toSessionUser(account: StoredMockAccount): MockAuthUser {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    phone: account.phone,
    role: account.role,
  };
}

export const mockAuthService = {
  ensureSeeded() {
    readAccounts();
  },

  getDemoAccounts() {
    return readAccounts().map(toSessionUser);
  },

  getSession(): MockAuthSession | null {
    if (!isBrowser()) {
      return null;
    }

    const stored = window.localStorage.getItem(STORAGE_KEYS.session);
    if (!stored) {
      return null;
    }

    try {
      return JSON.parse(stored) as MockAuthSession;
    } catch {
      window.localStorage.removeItem(STORAGE_KEYS.session);
      return null;
    }
  },

  login(identifier: string, password: string): MockAuthSession {
    const normalizedIdentifier = identifier.trim().toLowerCase();
    const normalizedPassword = password.trim();

    if (!normalizedIdentifier || !normalizedPassword) {
      throw new Error('请输入账号和密码');
    }

    const account = readAccounts().find((item) => {
      return (
        item.email.toLowerCase() === normalizedIdentifier ||
        item.phone === identifier.trim()
      );
    });

    if (!account || account.password !== normalizedPassword) {
      throw new Error('账号或密码错误');
    }

    const session: MockAuthSession = {
      user: toSessionUser(account),
      token: `mock-token-${account.id}-${Date.now()}`,
      loginAt: new Date().toISOString(),
    };

    if (isBrowser()) {
      window.localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
    }

    return session;
  },

  logout() {
    if (isBrowser()) {
      window.localStorage.removeItem(STORAGE_KEYS.session);
    }
  },
};
