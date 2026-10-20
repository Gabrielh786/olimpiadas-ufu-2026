import { useState } from 'react';
import { Eye, EyeOff, Lock, LogIn, ShieldCheck, Sun, Moon, Trophy, User } from 'lucide-react';

interface Props {
  onLogin: (username: string, password: string) => { ok: boolean; error?: string };
  isDark: boolean;
  onToggleTheme: () => void;
}

export function LoginScreen({ onLogin, isDark, onToggleTheme }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = onLogin(username, password);
    if (!res.ok) {
      setError(res.error ?? 'Credenciais inválidas.');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10 transition-colors duration-200">
      {/* Botão de Tema no canto superior direito */}
      <div className="fixed right-4 top-4 z-30">
        <button
          onClick={onToggleTheme}
          type="button"
          className="btn-ghost flex items-center gap-1.5 px-3 py-1.5"
          title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
        >
          {isDark ? (
            <>
              <Sun size={15} className="text-amber-400" />
              <span className="text-xs font-semibold">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-indigo-600" />
              <span className="text-xs font-semibold">Modo Escuro</span>
            </>
          )}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Cabeçalho / Identidade Visual */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-2xl border border-brand/50 bg-gradient-to-br from-brand/25 via-brand/10 to-transparent shadow-[0_0_35px_-5px_rgba(249,115,22,0.65)]">
            <Trophy size={34} className="text-brand" />
          </div>
          <span className="mb-1 rounded-full border border-brand/40 bg-brand/15 px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest text-orange-400">
            Sistema Oficial 2026
          </span>
          <h1 className="font-display text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
            OLIMPÍADA <span className="text-brand">UFU 2026</span>
          </h1>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Projeção de Pontuação (Mínimo, Máximo e Média) e Chaveamento Oficial
          </p>
        </div>

        {/* Card de Login */}
        <div className="card overflow-hidden border border-line p-6 shadow-2xl sm:p-7">
          <div className="mb-5 border-b border-line/70 pb-3">
            <h2 className="flex items-center gap-2 font-display text-base font-bold text-white">
              <ShieldCheck size={18} className="text-brand" />
              Acesso ao Portal
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Entre com sua conta de visitante para acompanhar ou de administrador para gerenciar.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Usuário
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError(null);
                  }}
                  placeholder="Ex: USER ou admin"
                  autoComplete="username"
                  required
                  className="w-full rounded-xl border border-line bg-ink-950 py-2.5 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-brand"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-zinc-300">
                Senha
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                  required
                  className="w-full rounded-xl border border-line bg-ink-950 py-2.5 pl-9 pr-10 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-brand"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  tabIndex={-1}
                  title={showPass ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-brand flex w-full items-center justify-center gap-2 py-2.5 text-sm font-bold shadow-lg"
            >
              <LogIn size={16} />
              <span>Entrar no Sistema</span>
            </button>
          </form>

          {/* Acesso Rápido para Visitante */}
          <div className="mt-5 border-t border-line/60 pt-4 text-center">
            <p className="text-[11px] text-zinc-500">
              Para consulta pública da tabela e chaveamentos, utilize o login{' '}
              <code className="rounded bg-ink-950 px-1.5 py-0.5 font-mono text-zinc-300">USER</code> e senha{' '}
              <code className="rounded bg-ink-950 px-1.5 py-0.5 font-mono text-zinc-300">USER</code>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
