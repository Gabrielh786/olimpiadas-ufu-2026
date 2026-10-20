import { useCallback, useState } from 'react';

export type UserRole = 'admin' | 'user' | null;

const AUTH_STORAGE_KEY = 'olimpiada_ufu_2026_auth_role';

export function useAuth() {
  const [role, setRole] = useState<UserRole>(() => {
    try {
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved === 'admin' || saved === 'user') return saved;
      return null;
    } catch {
      return null;
    }
  });

  const login = useCallback((usernameInput: string, passwordInput: string): { ok: boolean; error?: string } => {
    const u = usernameInput.trim();
    const p = passwordInput.trim();

    // Login de ADMIN: usuario 'admin' e senha 'money'
    if (u.toLowerCase() === 'admin' && p === 'money') {
      setRole('admin');
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, 'admin');
      } catch {
        // ignore storage errors
      }
      return { ok: true };
    }

    // Login de USUARIO: usuario 'USER' e senha 'USER'
    if (u.toUpperCase() === 'USER' && p.toUpperCase() === 'USER') {
      setRole('user');
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, 'user');
      } catch {
        // ignore storage errors
      }
      return { ok: true };
    }

    return {
      ok: false,
      error: 'Usuário ou senha inválidos. Verifique as credenciais e tente novamente.',
    };
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return {
    role,
    isAdmin: role === 'admin',
    isReadOnly: role !== 'admin',
    login,
    logout,
  };
}
