import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState, BracketState, TableState } from '../types';
import { normalizeBracket } from '../lib/bracket';
import { MODALITY_BY_CODE } from '../data/modalities';
import { encodeForCloud, loadState, sanitizeState, saveState } from '../lib/storage';

const CLOUD_URL_KEY = 'olimpiada_ufu_2026_cloud_url';
export const DEFAULT_CLOUD_URL = 'https://olimpiadas-ufu-default-rtdb.firebaseio.com';

export function getCloudDbUrl(): string {
  const envUrl = import.meta.env.VITE_CLOUD_DB_URL as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/+$/, '');
  try {
    const saved = localStorage.getItem(CLOUD_URL_KEY);
    if (saved !== null && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  } catch {
    // ignore
  }
  return DEFAULT_CLOUD_URL;
}

export function setCloudDbUrl(url: string) {
  try {
    const clean = url.trim().replace(/\/+$/, '');
    if (clean) localStorage.setItem(CLOUD_URL_KEY, clean);
    else localStorage.removeItem(CLOUD_URL_KEY);
  } catch {
    // ignore
  }
}

function buildEndpoint(baseUrl: string): string {
  if (!baseUrl) return '';
  if (baseUrl.endsWith('.json')) return baseUrl;
  return `${baseUrl}/ufu2026_state.json`;
}

function nextIsoTimestamp(prevIso?: string): string {
  const prevMs = prevIso ? Date.parse(prevIso) : 0;
  const nowMs = Date.now();
  const safeMs = Number.isFinite(prevMs) ? Math.max(nowMs, prevMs + 1) : nowMs;
  return new Date(safeMs).toISOString();
}

function hasContentDiff(a: AppState, b: AppState): boolean {
  return (
    JSON.stringify(a.brackets) !== JSON.stringify(b.brackets) ||
    JSON.stringify(a.tables) !== JSON.stringify(b.tables) ||
    JSON.stringify(a.adjustments) !== JSON.stringify(b.adjustments)
  );
}

/**
 * Estado global com persistência em localStorage e sincronização blindada com Firebase RTDB:
 * - Codifica `null` como `""` no envio para evitar que o Firebase converta arrays esparsos em objetos.
 * - Enfileira gravações (PUT) em série para impedir concorrência/sobrescrita fora de ordem.
 * - Compara `updatedAt` cronologicamente para nunca sobrescrever dados locais mais recentes com dados antigos.
 */
export function useAppState(canWrite = false) {
  const [state, setState] = useState<AppState>(loadState);
  const [saveError, setSaveError] = useState(false);
  const [cloudUrl, setCloudUrlState] = useState<string>(getCloudDbUrl);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const stateRef = useRef<AppState>(state);
  stateRef.current = state;

  const canWriteRef = useRef<boolean>(canWrite);
  canWriteRef.current = canWrite;

  const cloudUrlRef = useRef<string>(cloudUrl);
  cloudUrlRef.current = cloudUrl;

  const dirtySeqRef = useRef(0);
  const syncedSeqRef = useRef(0);
  const inFlightPushRef = useRef(false);

  // Salva sempre no localStorage local
  useEffect(() => {
    setSaveError(!saveState(state));
  }, [state]);

  // Fila serializada de envio para a nuvem (evita PUT fora de ordem em cliques rápidos)
  const flushPush = useCallback(async (overrideUrl?: string): Promise<boolean> => {
    const targetUrl = overrideUrl ?? cloudUrlRef.current;
    const endpoint = buildEndpoint(targetUrl);
    if (!endpoint) return false;
    if (inFlightPushRef.current) return true;

    inFlightPushRef.current = true;
    let allOk = true;

    try {
      while (dirtySeqRef.current > syncedSeqRef.current) {
        const seqToSync = dirtySeqRef.current;
        const snapshot = stateRef.current;
        setCloudStatus('syncing');

        const res = await fetch(endpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(encodeForCloud(snapshot)),
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        syncedSeqRef.current = seqToSync;
        setCloudStatus('synced');
      }
    } catch {
      setCloudStatus('error');
      allOk = false;
    } finally {
      inFlightPushRef.current = false;
    }

    return allOk;
  }, []);

  // Busca estado atualizado da nuvem sem jamais sobrescrever edições locais mais novas
  const pullFromCloud = useCallback(
    async (urlToUse = cloudUrlRef.current, forceAccept = false): Promise<boolean> => {
      const endpoint = buildEndpoint(urlToUse);
      if (!endpoint) return false;

      // Se o Admin possui alterações locais pendentes de envio, envia primeiro em vez de sobrescrever!
      if (!forceAccept && canWriteRef.current && dirtySeqRef.current > syncedSeqRef.current) {
        return flushPush(urlToUse);
      }

      const seqAtStart = dirtySeqRef.current;

      try {
        if (!inFlightPushRef.current) {
          setCloudStatus('syncing');
        }
        const res = await fetch(endpoint, { cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        // Se o Admin clicou em algum jogo enquanto o download estava em andamento, descarta o download antigo!
        if (
          !forceAccept &&
          canWriteRef.current &&
          (dirtySeqRef.current > syncedSeqRef.current || dirtySeqRef.current !== seqAtStart || inFlightPushRef.current)
        ) {
          return true;
        }

        if (data && typeof data === 'object') {
          const remoteState = sanitizeState(data);
          setState((prev) => {
            if (forceAccept) {
              stateRef.current = remoteState;
              syncedSeqRef.current = dirtySeqRef.current;
              return remoteState;
            }

            const remoteMs = Date.parse(remoteState.updatedAt || '') || 0;
            const localMs = Date.parse(prev.updatedAt || '') || 0;

            // Visitante (USER) espelha sempre a nuvem oficial
            if (!canWriteRef.current) {
              if (prev.updatedAt === remoteState.updatedAt && !hasContentDiff(prev, remoteState)) {
                return prev;
              }
              stateRef.current = remoteState;
              return remoteState;
            }

            // Admin só aceita automaticamente dados da nuvem se forem mais novos (ou mesmo timestamp com reparo de estrutura)
            if (remoteMs > localMs) {
              stateRef.current = remoteState;
              return remoteState;
            }
            if (remoteMs === localMs && hasContentDiff(prev, remoteState)) {
              stateRef.current = remoteState;
              return remoteState;
            }

            return prev;
          });
        }

        if (dirtySeqRef.current === syncedSeqRef.current) {
          setCloudStatus('synced');
        }
        return true;
      } catch {
        setCloudStatus('error');
        return false;
      }
    },
    [flushPush],
  );

  // Força envio imediato do estado atual da tela para a nuvem (botão "Salvar na Nuvem Agora")
  const forcePushToCloud = useCallback(
    async (urlToUse = cloudUrlRef.current): Promise<boolean> => {
      const endpoint = buildEndpoint(urlToUse);
      if (!endpoint) return false;
      const stamped: AppState = {
        ...stateRef.current,
        updatedAt: nextIsoTimestamp(stateRef.current.updatedAt),
      };
      stateRef.current = stamped;
      setState(stamped);
      dirtySeqRef.current += 1;
      return flushPush(urlToUse);
    },
    [flushPush],
  );

  // Polling periódico + sincronização ao focar a aba + retry automático de envios pendentes
  useEffect(() => {
    if (!cloudUrl) {
      setCloudStatus('idle');
      return;
    }

    pullFromCloud(cloudUrl);

    const pollTimer = setInterval(() => {
      if (canWriteRef.current && dirtySeqRef.current > syncedSeqRef.current) {
        flushPush(cloudUrl);
      } else {
        pullFromCloud(cloudUrl);
      }
    }, 10000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'hidden') return;
      if (canWriteRef.current && dirtySeqRef.current > syncedSeqRef.current) {
        flushPush(cloudUrl);
      } else {
        pullFromCloud(cloudUrl);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [cloudUrl, flushPush, pullFromCloud]);

  // Proteção ao fechar a aba caso ainda haja um salvamento em trânsito
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (canWriteRef.current && dirtySeqRef.current > syncedSeqRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const applyLocalMutation = useCallback(
    (computeNext: (prev: AppState) => AppState) => {
      const prev = stateRef.current;
      const next: AppState = {
        ...computeNext(prev),
        updatedAt: nextIsoTimestamp(prev.updatedAt),
      };
      stateRef.current = next;
      setState(next);

      if (canWriteRef.current && cloudUrlRef.current) {
        dirtySeqRef.current += 1;
        void flushPush();
      }
    },
    [flushPush],
  );

  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      applyLocalMutation(fn);
    },
    [applyLocalMutation],
  );

  const setBracket = useCallback(
    (code: string, b: BracketState) =>
      applyLocalMutation((s) => ({
        ...s,
        brackets: {
          ...s.brackets,
          [code]: normalizeBracket(b, MODALITY_BY_CODE[code]?.hasConsolationBracket ?? false),
        },
      })),
    [applyLocalMutation],
  );

  const setTable = useCallback(
    (code: string, t: TableState) =>
      applyLocalMutation((s) => ({
        ...s,
        tables: { ...s.tables, [code]: t },
      })),
    [applyLocalMutation],
  );

  const replaceState = useCallback(
    (s: AppState) => {
      applyLocalMutation(() => s);
    },
    [applyLocalMutation],
  );

  const updateCloudUrl = useCallback(
    async (newUrl: string) => {
      const clean = newUrl.trim().replace(/\/+$/, '') || DEFAULT_CLOUD_URL;
      setCloudDbUrl(clean);
      cloudUrlRef.current = clean;
      setCloudUrlState(clean);
      if (canWriteRef.current) {
        await forcePushToCloud(clean);
      } else {
        await pullFromCloud(clean, true);
      }
    },
    [forcePushToCloud, pullFromCloud],
  );

  return {
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
    forcePushToCloud,
  };
}
