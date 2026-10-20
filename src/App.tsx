import { useCallback, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  Download,
  Eye,
  FileSpreadsheet,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  Trophy,
  Upload,
} from 'lucide-react';
import { useAppState } from './hooks/useAppState';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { computeOverview } from './lib/scoring';
import { exportCSV, exportJSON, sanitizeState } from './lib/storage';
import { CompetitionsTab } from './components/competitions/CompetitionsTab';
import { StandingsTab } from './components/standings/StandingsTab';
import { AthleticsModal } from './components/AthleticsModal';
import { AdjustmentsModal } from './components/standings/AdjustmentsModal';
import { LoginScreen } from './components/LoginScreen';
import { CloudSyncModal } from './components/CloudSyncModal';
import { Toasts, type ToastMsg } from './components/ui';

type ActiveTab = 'competitions' | 'standings';

export function App() {
  const {
    state,
    update,
    setBracket,
    setTable,
    replaceState,
    saveError,
    cloudUrl,
    cloudStatus,
    updateCloudUrl,
    pullFromCloud,
  } = useAppState();
  const { role, isAdmin, isReadOnly, login, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<ActiveTab>('standings');
  const [selectedModality, setSelectedModality] = useState<string>('VM');
  const [athleticsModalOpen, setAthleticsModalOpen] = useState(false);
  const [adjustmentsModalOpen, setAdjustmentsModalOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [adjustInitialAthletic, setAdjustInitialAthletic] = useState<string | undefined>();
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notificações visuais tipo Toast
  const notify = useCallback((text: string, kind: 'ok' | 'err' | 'info' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // Motor reativo consolidado de toda a olimpíada
  const overview = computeOverview(state);

  // Se não estiver autenticado, exibe a tela de Login (USER ou admin)
  if (!role) {
    return <LoginScreen onLogin={login} isDark={isDark} onToggleTheme={toggleTheme} />;
  }

  // Ação de importar backup em JSON (apenas Admin)
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isReadOnly) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const validState = sanitizeState(parsed);
        replaceState(validState);
        notify('Backup importado com sucesso!', 'ok');
      } catch (err) {
        console.error(err);
        notify('Erro ao importar arquivo: JSON corrompido ou formato inválido.', 'err');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Navegar direto para uma modalidade a partir da Matriz
  const handleOpenModality = (code: string) => {
    setSelectedModality(code);
    setActiveTab('competitions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Abrir modal de ajustes pré-selecionando uma atlética (apenas Admin)
  const handleOpenAdjust = (athleticId?: string) => {
    if (isReadOnly) return;
    setAdjustInitialAthletic(athleticId);
    setAdjustmentsModalOpen(true);
  };

  return (
    <div className="min-h-screen pb-16 transition-colors duration-200">
      {/* Barra de Topo Principal */}
      <header className="sticky top-0 z-40 border-b border-line bg-ink-950/90 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-6">
          {/* Logo & Título */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-brand/50 bg-gradient-to-br from-brand/20 via-brand/10 to-transparent shadow-[0_0_20px_-5px_rgba(249,115,22,0.6)] sm:h-10 sm:w-10">
              <Trophy size={20} className="text-brand sm:size-[22px]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-xs font-extrabold tracking-wider text-white sm:text-base">
                  OLIMPÍADA UNIVERSITÁRIA <span className="text-brand">UFU 2026</span>
                </h1>
                <span className="hidden rounded-full border border-brand/40 bg-brand/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-orange-400 sm:text-[10px] md:inline-block">
                  Oficial
                </span>
              </div>
              <p className="hidden text-[11px] text-zinc-400 sm:block">
                Sistema Oficial de Projeção de Pontuação (Mínimo, Máximo e Média) e Chaveamento
              </p>
            </div>
          </div>

          {/* Ações globais do topo: Tema, Perfil, Atléticas, Ajustes, Backup */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Selo de Perfil (ADMIN vs VISITANTE) */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${
                isAdmin
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300'
                  : 'border-sky-500/40 bg-sky-500/10 text-sky-300'
              }`}
              title={isAdmin ? 'Logado como Administrador (Edição habilitada)' : 'Logado como Visitante (Somente visualização)'}
            >
              {isAdmin ? <ShieldCheck size={13} className="text-amber-400" /> : <Eye size={13} className="text-sky-400" />}
              <span className="hidden xs:inline">{isAdmin ? 'ADMIN' : 'USER'}</span>
            </div>

            {/* Botão de Alternar Modo Claro / Modo Escuro */}
            <button
              onClick={toggleTheme}
              className="btn-ghost flex items-center gap-1.5 px-2.5 py-1.5"
              title={isDark ? 'Ativar Modo Claro (Visualização clara)' : 'Ativar Modo Escuro'}
              aria-label="Alternar tema de cores"
            >
              {isDark ? (
                <>
                  <Sun size={15} className="text-amber-400" />
                  <span className="hidden md:inline text-[11px] font-semibold">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-indigo-600" />
                  <span className="hidden md:inline text-[11px] font-semibold">Modo Escuro</span>
                </>
              )}
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setAthleticsModalOpen(true)}
                  className="btn-ghost px-2 py-1.5 sm:px-3"
                  title="Personalizar escudos, siglas e cores das 16 atléticas"
                >
                  <Palette size={14} className="text-brand" />
                  <span className="hidden sm:inline">Atléticas</span>
                </button>

                <button
                  onClick={() => handleOpenAdjust()}
                  className="btn-ghost px-2 py-1.5 sm:px-3"
                  title="Bônus do Cerimonial de Abertura e punições por W.O."
                >
                  <SlidersHorizontal size={14} />
                  <span className="hidden sm:inline">Ajustes / W.O.</span>
                </button>

                <button
                  onClick={() => setCloudModalOpen(true)}
                  className={`btn-ghost px-2 py-1.5 sm:px-3 ${
                    cloudUrl ? 'border-emerald-500/40 text-emerald-300' : ''
                  }`}
                  title="Configurar banco na nuvem para sincronizar alterações em tempo real"
                >
                  <Cloud size={14} className={cloudUrl ? 'text-emerald-400' : 'text-zinc-400'} />
                  <span className="hidden lg:inline">Nuvem</span>
                </button>
              </>
            )}

            {/* Menu de Exportação / Backup */}
            <div className="flex items-center gap-0.5 rounded-lg border border-line bg-ink-900 p-0.5">
              {isAdmin && (
                <>
                  <button
                    onClick={() => exportJSON(state)}
                    className="btn-ghost border-0 bg-transparent px-2 text-zinc-300 hover:text-white"
                    title="Exportar arquivo de backup com todo o estado da Olimpíada (JSON)"
                  >
                    <Download size={13} />
                    <span className="hidden lg:inline">Salvar Backup</span>
                  </button>

                  <input
                    id={fileInputId}
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleImportJSON}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost border-0 bg-transparent px-2 text-zinc-300 hover:text-white"
                    title="Restaurar backup a partir de arquivo JSON"
                  >
                    <Upload size={13} />
                    <span className="hidden lg:inline">Restaurar</span>
                  </button>
                </>
              )}

              <button
                onClick={() => exportCSV(overview)}
                className="btn-ghost border-0 bg-transparent px-2 text-emerald-400 hover:text-emerald-300"
                title="Exportar Matriz Geral Completa para Excel / CSV"
              >
                <FileSpreadsheet size={13} />
                <span className="hidden xl:inline">Excel/CSV</span>
              </button>
            </div>

            {/* Botão de Sair / Trocar Login */}
            <button
              onClick={logout}
              className="btn-ghost px-2.5 py-1.5 text-zinc-400 hover:text-red-300"
              title="Sair / Trocar conta (USER / ADMIN)"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline text-[11px]">Sair</span>
            </button>
          </div>
        </div>

        {/* Barra de Status e Navegação de Abas */}
        <div className="border-t border-line/70 bg-ink-900/60">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-6">
            {/* Navegador das 2 Abas Principais (100% responsivo no mobile) */}
            <nav className="flex w-full items-center gap-1 sm:w-auto sm:gap-2" aria-label="Navegação Principal">
              <button
                onClick={() => setActiveTab('standings')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
                  activeTab === 'standings'
                    ? 'border border-brand/60 bg-gradient-to-r from-brand/25 to-brand/10 text-white shadow-[0_0_20px_-8px_rgba(249,115,22,0.8)]'
                    : 'text-zinc-400 hover:bg-card-hi hover:text-zinc-200'
                }`}
              >
                <span>📊</span>
                Classificação Geral
              </button>

              <button
                onClick={() => setActiveTab('competitions')}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition sm:px-4 sm:text-sm ${
                  activeTab === 'competitions'
                    ? 'border border-brand/60 bg-gradient-to-r from-brand/25 to-brand/10 text-white shadow-[0_0_20px_-8px_rgba(249,115,22,0.8)]'
                    : 'text-zinc-400 hover:bg-card-hi hover:text-zinc-200'
                }`}
              >
                <span>🏆</span>
                Competições
                <span className="rounded-full bg-ink-950 px-1.5 py-0.2 text-[10px] font-mono text-zinc-400">
                  25
                </span>
              </button>
            </nav>

            {/* Contador Dinâmico do Topo e Status de Salvamento */}
            <div className="flex w-full items-center justify-between gap-3 text-xs sm:w-auto">
              <div className="flex items-center gap-2 rounded-full border border-bronze-hi/60 bg-ink-950 px-3 py-1 text-zinc-300">
                <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                <span>
                  <strong className="font-mono text-orange-400">{overview.definedCount}</strong> de 25 modalidades definidas
                </span>
              </div>

              {cloudUrl ? (
                <span
                  className={`flex items-center gap-1 text-[11px] ${
                    cloudStatus === 'error'
                      ? 'text-red-400'
                      : cloudStatus === 'syncing'
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                  }`}
                >
                  <Cloud size={13} />
                  {cloudStatus === 'error'
                    ? 'Erro Nuvem'
                    : cloudStatus === 'syncing'
                      ? 'Sincronizando...'
                      : 'Salvo Online'}
                </span>
              ) : saveError ? (
                <span className="flex items-center gap-1 text-[11px] text-red-400" title="Falha ao salvar no localStorage">
                  <AlertCircle size={13} /> Não salvo
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] text-emerald-400/80" title="Salvo automaticamente">
                  <CheckCircle2 size={13} /> Auto-salvo
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-7xl px-3 pt-5 sm:px-6">
        {activeTab === 'standings' ? (
          <StandingsTab
            rows={overview.rows}
            overview={overview}
            onOpenAdjust={handleOpenAdjust}
            onOpenModality={handleOpenModality}
            readOnly={isReadOnly}
          />
        ) : (
          <CompetitionsTab
            state={state}
            overview={overview}
            selected={selectedModality}
            onSelect={setSelectedModality}
            setBracket={setBracket}
            setTable={setTable}
            notify={notify}
            readOnly={isReadOnly}
          />
        )}
      </main>

      {/* Modais Globais (Apenas Admin) */}
      {isAdmin && (
        <>
          <AthleticsModal
            open={athleticsModalOpen}
            onClose={() => setAthleticsModalOpen(false)}
            athletics={state.athletics}
            onChange={(athletics) => update((s) => ({ ...s, athletics }))}
            notify={notify}
          />

          <AdjustmentsModal
            open={adjustmentsModalOpen}
            onClose={() => setAdjustmentsModalOpen(false)}
            athletics={state.athletics}
            adjustments={state.adjustments}
            initialAthletic={adjustInitialAthletic}
            onChange={(adjustments) => update((s) => ({ ...s, adjustments }))}
          />

          <CloudSyncModal
            open={cloudModalOpen}
            onClose={() => setCloudModalOpen(false)}
            cloudUrl={cloudUrl}
            cloudStatus={cloudStatus}
            onSaveUrl={updateCloudUrl}
            onForceSync={() => pullFromCloud()}
            notify={notify}
          />
        </>
      )}

      {/* Notificações Flutuantes (Toasts) */}
      <Toasts items={toasts} />
    </div>
  );
}
export default App;
