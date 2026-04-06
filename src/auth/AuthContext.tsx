import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { MockAuthSession, MockAuthUser, mockAuthService } from '../services/mockAuth';

type AuthContextValue = {
  currentUser: MockAuthUser | null;
  session: MockAuthSession | null;
  demoAccounts: MockAuthUser[];
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<MockAuthSession>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  session: null,
  demoAccounts: [],
  isAuthenticated: false,
  login: async () => {
    throw new Error('AuthProvider is missing');
  },
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<MockAuthSession | null>(() => mockAuthService.getSession());
  const [demoAccounts, setDemoAccounts] = useState<MockAuthUser[]>(() => mockAuthService.getDemoAccounts());

  useEffect(() => {
    mockAuthService.ensureSeeded();
    setDemoAccounts(mockAuthService.getDemoAccounts());
    setSession(mockAuthService.getSession());
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: session?.user ?? null,
      session,
      demoAccounts,
      isAuthenticated: Boolean(session?.token),
      login: async (identifier: string, password: string) => {
        await new Promise((resolve) => window.setTimeout(resolve, 300));
        const nextSession = mockAuthService.login(identifier, password);
        setSession(nextSession);
        return nextSession;
      },
      logout: () => {
        mockAuthService.logout();
        setSession(null);
      },
    }),
    [demoAccounts, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
