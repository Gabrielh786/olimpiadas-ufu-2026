import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState, BracketState, TableState } from '../types';
import { normalizeBracket } from '../lib/bracket';
import { MODALITY_BY_CODE } from '../data/modalities';
import { loadState, sanitizeState, saveState } from '../lib/storage';

const CLOUD_URL_KEY = 'olimpiada_ufu_2026_cloud_url';
export const DEFAULT_CLOUD_URL = 'https://olimpiadas-ufu-default-rtdb.firebaseio.com';

export function getCloudDbUrl(): string {
  const envUrl = import.meta.env.VITE_CLOUD_DB_URL as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl.trim().replace(/\/+$/, '');
  try {
    const saved = localStorage.getItem(CLOUD_URL_KEY);
    if (saved !== null) {
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

/** Estado global com persistência automática em localStorage e sincronização opcional em nuvem (Firebase RTDB / REST JSON). */
export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);
  const [saveError, setSaveError] = useState(false);
  const [cloudUrl, setCloudUrlState] = useState<string>(getCloudDbUrl);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const isRemoteUpdate = useRef(false);

  // Salva sempre no localStorage local
  useEffect(() => {
    setSaveError(!saveState(state));
  }, [state]);

  // Busca estado atualizado da nuvem ao iniciar e periodicamente (a cada 12s)
  const pullFromCloud = useCallback(async (urlToUse = cloudUrl) => {
    const endpoint = buildEndpoint(urlToUse);
    if (!endpoint) return false;
    try {
      setCloudStatus('syncing');
      const res = await fetch(endpoint, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && typeof data === 'object') {
        const remoteState = sanitizeState(data);
        setState((prev) => {
          if (prev.updatedAt === remoteState.updatedAt) return prev;
          isRemoteUpdate.current = true;
          return remoteState;
        });
      }
      setCloudStatus('synced');
      return true;
    } catch {
      setCloudStatus('error');
      return false;
    }
  }, [cloudUrl]);

  // Envia estado para a nuvem sempre que uma alteração local for feita
  const pushToCloud = useCallback(async (nextState: AppState, urlToUse = cloudUrl) => {
    const endpoint = buildEndpoint(urlToUse);
    if (!endpoint) return false;
    try {
      setCloudStatus('syncing');
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextState),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setCloudStatus('synced');
      return true;
    } catch {
      setCloudStatus('error');
      return false;
    }
  }, [cloudUrl]);

  useEffect(() => {
    if (!cloudUrl) {
      setCloudStatus('idle');
      return;
    }
    pullFromCloud(cloudUrl);
    const timer = setInterval(() => {
      pullFromCloud(cloudUrl);
    }, 12000);
    return () => clearInterval(timer);
  }, [cloudUrl, pullFromCloud]);

  const update = useCallback(
    (fn: (s: AppState) => AppState) => {
      setState((s) => {
        const next = { ...fn(s), updatedAt: new Date().toISOString() };
        if (cloudUrl) {
          pushToCloud(next, cloudUrl);
        }
        return next;
      });
    },
    [cloudUrl, pushToCloud],
  );

  const setBracket = useCallback(
    (code: string, b: BracketState) =>
      update((s) => ({
        ...s,
        brackets: { ...s.brackets, [code]: normalizeBracket(b, MODALITY_BY_CODE[code]?.hasConsolationBracket ?? false) },
      })),
    [update],
  );

  const setTable = useCallback(
    (code: string, t: TableState) => update((s) => ({ ...s, tables: { ...s.tables, [code]: t } })),
    [update],
  );

  const replaceState = useCallback(
    (s: AppState) => {
      const next = { ...s, updatedAt: new Date().toISOString() };
      setState(next);
      if (cloudUrl) {
        pushToCloud(next, cloudUrl);
      }
    },
    [cloudUrl, pushToCloud],
  );

  const updateCloudUrl = useCallback(
    async (newUrl: string) => {
      setCloudDbUrl(newUrl);
      const clean = newUrl.trim().replace(/\/+$/, '');
      setCloudUrlState(clean);
      if (clean) {
        await pushToCloud(state, clean);
      }
    },
    [pushToCloud, state],
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
    pushToCloud,
  };
}
