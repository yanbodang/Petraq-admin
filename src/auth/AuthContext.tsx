import { createContext, useContext, useMemo, useState } from 'react';
import { AdminAuthSession, AdminAuthUser, adminAuthService } from '../services/adminAuth';

type AuthContextValue = {
  currentUser: AdminAuthUser | null;
  session: AdminAuthSession | null;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<AdminAuthSession>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue>({
  currentUser: null,
  session: null,
  isAuthenticated: false,
  login: async () => {
    throw new Error('AuthProvider is missing');
  },
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AdminAuthSession | null>(() => adminAuthService.getSession());

  const value = useMemo<AuthContextValue>(
    () => ({
      currentUser: session?.user ?? null,
      session,
      isAuthenticated: Boolean(session?.token),
      login: async (identifier: string, password: string) => {
        const nextSession = await adminAuthService.login(identifier, password);
        setSession(nextSession);
        return nextSession;
      },
      logout: () => {
        adminAuthService.logout();
        setSession(null);
      },
    }),
    [session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
