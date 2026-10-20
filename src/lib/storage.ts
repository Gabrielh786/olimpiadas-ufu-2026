// ============================================================================
// Persistência (localStorage) + Backup JSON + Exportação CSV
// ============================================================================
import { DEFAULT_ATHLETICS } from '../data/athletics.ts';
import { MODALITIES, bracketSize } from '../data/modalities.ts';
import { BYE, NONE } from '../types.ts';
import type { Adjustment, AppState, Athletic, BracketState, TableState } from '../types.ts';
import { emptyBracket, emptyTable, normalizeBracket } from './bracket.ts';
import { fmt, sortRows, type Overview } from './scoring.ts';
import { getOfficialBracket2026, isLoserSlot } from '../data/officialDraw2026.ts';

export const STORAGE_KEY = 'olimpiada-ufu-2026:v2';

export function defaultState(): AppState {
  const brackets: Record<string, BracketState> = {};
  const tables: Record<string, TableState> = {};
  for (const m of MODALITIES) {
    if (m.group === 'C') {
      tables[m.code] = emptyTable();
    } else {
      const official = getOfficialBracket2026(m.code);
      brackets[m.code] = official ? normalizeBracket(official, m.hasConsolationBracket ?? false) : emptyBracket(bracketSize(m.group));
    }
  }
  return {
    version: 1,
    athletics: DEFAULT_ATHLETICS.map((a) => ({ ...a })),
    brackets,
    tables,
    adjustments: [],
    updatedAt: new Date().toISOString(),
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown): string | null => (typeof x === 'string' ? x : null);

function sanitizeTable(raw: unknown, enrolled: string[]): TableState {
  const t = emptyTable();
  if (!isObj(raw)) return t;
  const used = new Set<string>();
  if (Array.isArray(raw.positions))
    for (let i = 0; i < 8; i++) {
      const v = str(raw.positions[i]);
      if (v && enrolled.includes(v) && !used.has(v)) {
        t.positions[i] = v;
        used.add(v);
      }
    }
  t.finalized = raw.finalized === true;
  return t;
}

/** Valida e completa qualquer estado (localStorage antigo ou arquivo importado). */
export function sanitizeState(raw: unknown): AppState {
  const base = defaultState();
  if (!isObj(raw)) return base;

  // Atléticas: mantém as 16 oficiais, preservando personalizações
  const rawAth = Array.isArray(raw.athletics) ? raw.athletics : [];
  const athletics: Athletic[] = base.athletics.map((def) => {
    const found = rawAth.find((x) => isObj(x) && x.id === def.id) as Record<string, unknown> | undefined;
    if (!found) return def;
    return {
      ...def,
      short: (str(found.short) ?? def.short).slice(0, 4) || def.short,
      color: /^#[0-9a-fA-F]{6}$/.test(str(found.color) ?? '') ? (found.color as string) : def.color,
      logo: str(found.logo)?.startsWith('data:image')
        ? (found.logo as string)
        : found.logo === ''
          ? ''
          : def.logo,
    };
  });

  const rawBr = isObj(raw.brackets) ? raw.brackets : {};
  const rawTb = isObj(raw.tables) ? raw.tables : {};
  const brackets: Record<string, BracketState> = {};
  const tables: Record<string, TableState> = {};

  for (const m of MODALITIES) {
    if (m.group === 'C') {
      tables[m.code] = sanitizeTable(rawTb[m.code], m.enrolled);
      continue;
    }
    const size = bracketSize(m.group);
    const b = emptyBracket(size);
    const rb = rawBr[m.code];
    if (isObj(rb)) {
      const used = new Set<string>();
      if (Array.isArray(rb.slots))
        for (let i = 0; i < size; i++) {
          const v = str(rb.slots[i]);
          if (!v) continue;
          if (v === BYE || (v === NONE && m.group === 'B') || isLoserSlot(v)) {
            b.slots[i] = v;
            continue;
          }
          const [ath, rep] = v.split(':');
          const valid =
            m.enrolled.includes(ath) &&
            (m.group === 'A' ? rep === undefined : (rep === '1' && i < size / 2) || (rep === '2' && i >= size / 2));
          if (valid && !used.has(v)) {
            b.slots[i] = v;
            used.add(v);
          }
        }
      if (Array.isArray(rb.winners))
        b.winners = b.winners.map((round, r) =>
          round.map((_, i) => (Array.isArray(rb.winners) && Array.isArray(rb.winners[r]) ? str((rb.winners[r] as unknown[])[i]) : null)),
        );
      b.thirdWinner = str(rb.thirdWinner);
      if (Array.isArray(rb.consolationWinners)) {
        b.consolationWinners = [str(rb.consolationWinners[0]), str(rb.consolationWinners[1])];
      }
      b.fifthWinner = str(rb.fifthWinner);
      b.seventhWinner = str(rb.seventhWinner);
      b.mode = rb.mode === 'ranking' ? 'ranking' : 'best';
      b.ranking = sanitizeTable(rb.ranking, m.enrolled);
    } else {
      // Se não tinha salvo, usa o oficial se houver
      const official = getOfficialBracket2026(m.code);
      if (official) {
        b.slots = [...official.slots];
      }
    }
    brackets[m.code] = normalizeBracket(b, m.hasConsolationBracket ?? false);
  }

  const adjustments: Adjustment[] = Array.isArray(raw.adjustments)
    ? raw.adjustments
        .filter((x): x is Record<string, unknown> => isObj(x))
        .filter((x) => athletics.some((a) => a.id === x.athleticId) && typeof x.value === 'number' && Number.isFinite(x.value))
        .map((x) => ({
          id: str(x.id) ?? crypto.randomUUID(),
          athleticId: x.athleticId as string,
          value: Math.round(x.value as number),
          reason: (str(x.reason) ?? 'Ajuste').slice(0, 80),
        }))
    : [];

  return { version: 1, athletics, brackets, tables, adjustments, updatedAt: str(raw.updatedAt) ?? base.updatedAt };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? sanitizeState(JSON.parse(raw)) : defaultState();
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stamp = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}h${p(d.getMinutes())}`;
};

export function exportJSON(state: AppState) {
  download(`olimpiada-ufu-2026_backup_${stamp()}.json`, JSON.stringify(state, null, 2), 'application/json');
}

export function exportCSV(overview: Overview) {
  const sep = ';';
  const header = ['Posição', 'Atlética'];
  for (const m of MODALITIES) header.push(`${m.code} Mín`, `${m.code} Máx`);
  header.push('Ajustes', 'TOTAL MÍN', 'TOTAL MÁX', 'MÉDIA');
  const lines = [header.join(sep)];
  sortRows(overview.rows, 'avg').forEach((r, i) => {
    const cells: (string | number)[] = [i + 1, r.athletic.name];
    for (const m of MODALITIES) {
      const s = r.perModality[m.code];
      if (!s.enrolled) cells.push('N/I', 'N/I');
      else cells.push(s.min, s.max);
    }
    cells.push(r.adj, r.min, r.max, fmt(r.avg));
    lines.push(cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(sep));
  });
  download(`olimpiada-ufu-2026_matriz_${stamp()}.csv`, '\uFEFF' + lines.join('\r\n'), 'text/csv;charset=utf-8');
}
