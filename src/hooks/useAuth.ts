import { useCallback, useState } from 'react';

export type UserRole = 'admin' | 'user' | null;

const AUTH_STORAGE_KEY = 'olimpiada_ufu_2026_auth_role';

// Salt único para proteção contra ataques de dicionário e rainbow tables
const AUTH_SALT = 'ufu_2026_sec_salt_v1';

// Hash SHA-256 com salt da credencial administrativa padrão
// Não expõe a senha em texto puro em nenhum local do código ou repositório
const DEFAULT_ADMIN_HASH = 'd6e9e20debf645d7ed717e7375bb020cd27ff684d16ae996c90794e3d3e806ce';

async function computeSha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

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

  const login = useCallback(
    async (usernameInput: string, passwordInput: string): Promise<{ ok: boolean; error?: string }> => {
      const u = usernameInput.trim();
      const p = passwordInput.trim();

      if (!u || !p) {
        return { ok: false, error: 'Preencha o usuário e a senha.' };
      }

      // 1. Verificação de Visitante (leitura apenas)
      if (u.toUpperCase() === 'USER' && p.toUpperCase() === 'USER') {
        setRole('user');
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, 'user');
        } catch {
          // ignore storage error
        }
        return { ok: true };
      }

      // 2. Verificação de Administrador (segurança via hash ou variável de ambiente da Vercel)
      if (u.toLowerCase() === 'admin') {
        // Suporte a senha personalizada via variável de ambiente (Vercel / .env)
        const envAdminPass = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined)?.trim();
        if (envAdminPass && p === envAdminPass) {
          setRole('admin');
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, 'admin');
          } catch {
            // ignore
          }
          return { ok: true };
        }

        // Validação criptográfica via SHA-256 salgado
        const inputHash = await computeSha256(AUTH_SALT + p);
        const targetHash = (import.meta.env.VITE_ADMIN_HASH as string | undefined)?.trim() || DEFAULT_ADMIN_HASH;

        if (inputHash === targetHash) {
          setRole('admin');
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, 'admin');
          } catch {
            // ignore
          }
          return { ok: true };
        }
      }

      return {
        ok: false,
        error: 'Usuário ou senha incorretos. Verifique suas credenciais.',
      };
    },
    [],
  );

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
