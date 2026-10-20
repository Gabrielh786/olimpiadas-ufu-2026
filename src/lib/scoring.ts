// ============================================================================
// Motor de Pontuação Reativo — Mín / Máx / Média por atlética e modalidade
// ============================================================================
import { MODALITIES, POINTS, placeFromPoints } from '../data/modalities.ts';
import type { AppState, Athletic, BracketState, Modality, ModalityStatus, Score, TableState } from '../types.ts';
import {
  competitorResult,
  isBracketDefined,
  isReal,
  resolveBracket,
  type CompetitorResult,
  type ResolvedBracket,
} from './bracket.ts';

export const repId = (athleticId: string, rep: 1 | 2) => `${athleticId}:${rep}`;
export const athleticOfCompetitor = (c: string) => c.split(':')[0];
export const repOfCompetitor = (c: string): 1 | 2 | null => {
  const r = c.split(':')[1];
  return r === '1' ? 1 : r === '2' ? 2 : null;
};

const toneOf = (min: number, max: number): Score['tone'] =>
  max === 0 ? 'out' : min === max ? 'locked' : 'open';

const mk = (min: number, max: number, label: string, enrolled = true): Score => ({
  min,
  max,
  label,
  enrolled,
  tone: enrolled ? toneOf(min, max) : 'ni',
  place: min === max && min > 0 ? placeFromPoints(min) : undefined,
});

const NI = (): Score => mk(0, 0, 'N/I · Não inscrita', false);

export interface RepDetail {
  competitor: string;
  athleticId: string;
  rep: 1 | 2;
  result: CompetitorResult | null;
  min: number;
  max: number;
  label: string;
}

export interface ModalityResult {
  modality: Modality;
  scores: Record<string, Score>;
  status: ModalityStatus;
  bracket?: ResolvedBracket;
  /** Grupo B: detalhamento por representante (Atleta 1 / Atleta 2) */
  reps?: Record<string, RepDetail[]>;
}

// ----------------------------------------------------------------------------
// Tabela de ordem (Grupo C e Modo Ranking do Grupo B)
// ----------------------------------------------------------------------------
export function tableScores(mod: Modality, table: TableState, athletics: Athletic[]): { scores: Record<string, Score>; status: ModalityStatus } {
  const placed = new Map<string, number>();
  table.positions.forEach((id, idx) => {
    if (id && mod.enrolled.includes(id) && !placed.has(id)) placed.set(id, idx);
  });
  const vacant = table.positions.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
  const maxVacant = vacant.length ? POINTS[vacant[0]] : 0;
  const closed = table.finalized || vacant.length === 0 || placed.size >= mod.enrolled.length;
  const scores: Record<string, Score> = {};
  for (const a of athletics) {
    if (!mod.enrolled.includes(a.id)) scores[a.id] = NI();
    else if (placed.has(a.id)) {
      const idx = placed.get(a.id)!;
      scores[a.id] = mk(POINTS[idx], POINTS[idx], `${idx + 1}º Lugar`);
    } else if (closed) scores[a.id] = mk(0, 0, 'Fora do Top 8');
    else
      scores[a.id] = mk(
        0,
        maxVacant,
        maxVacant === 13 ? 'Elegível · aguardando resultado' : `Elegível · melhor vaga aberta ${vacant[0] + 1}º`,
      );
  }
  const status: ModalityStatus = closed ? 'defined' : placed.size === 0 ? 'not-started' : 'in-progress';
  return { scores, status };
}

// ----------------------------------------------------------------------------
// Modalidade de chave
// ----------------------------------------------------------------------------
function bracketModality(mod: Modality, b: BracketState, athletics: Athletic[]): ModalityResult {
  const res = resolveBracket(b, mod.hasConsolationBracket ?? false);
  const nameById = new Map(athletics.map((a) => [a.id, a.name]));
  const nameOf = (c: string) => {
    const base = nameById.get(athleticOfCompetitor(c)) ?? c;
    const rep = repOfCompetitor(c);
    return rep ? `${base} (Atleta ${rep})` : base;
  };
  const anySlot = b.slots.some((s) => s != null);
  const bracketStatus: ModalityStatus = isBracketDefined(res) ? 'defined' : anySlot ? 'in-progress' : 'not-started';
  const scores: Record<string, Score> = {};

  if (mod.group === 'A') {
    const full = b.slots.every((s) => s != null);
    for (const a of athletics) {
      if (!mod.enrolled.includes(a.id)) {
        scores[a.id] = NI();
        continue;
      }
      const r = competitorResult(res, a.id, nameOf);
      if (r) scores[a.id] = mk(r.min, r.max, r.label);
      else scores[a.id] = full ? mk(0, 0, 'Fora da chave') : mk(0, 13, 'Aguardando alocação na chave');
    }
    return { modality: mod, scores, status: bracketStatus, bracket: res };
  }

  // ---------------- Grupo B (32 vagas, 2 representantes) ----------------
  const half = b.slots.length / 2;
  const leftFull = b.slots.slice(0, half).every((s) => s != null);
  const rightFull = b.slots.slice(half).every((s) => s != null);
  const reps: Record<string, RepDetail[]> = {};
  for (const a of athletics) {
    if (!mod.enrolled.includes(a.id)) continue;
    reps[a.id] = ([1, 2] as const).map((rep) => {
      const competitor = repId(a.id, rep);
      const result = competitorResult(res, competitor, nameOf);
      const sideFull = rep === 1 ? leftFull : rightFull;
      if (result) return { competitor, athleticId: a.id, rep, result, min: result.min, max: result.max, label: result.label };
      return sideFull
        ? { competitor, athleticId: a.id, rep, result, min: 0, max: 0, label: `Sem vaga na Chave ${rep === 1 ? 'A' : 'B'}` }
        : { competitor, athleticId: a.id, rep, result, min: 0, max: 13, label: 'Aguardando alocação' };
    });
  }

  if (b.mode === 'ranking') {
    const t = tableScores(mod, b.ranking, athletics);
    const status: ModalityStatus =
      t.status === 'defined' ? 'defined' : t.status === 'in-progress' || anySlot ? 'in-progress' : 'not-started';
    return { modality: mod, scores: t.scores, status, bracket: res, reps };
  }

  const fin = res.finalMatch;
  const thd = res.third;
  const bothIn = (m: { a: string | null; b: string | null }, id: string) =>
    isReal(m.a) && isReal(m.b) && athleticOfCompetitor(m.a) === id && athleticOfCompetitor(m.b) === id;

  for (const a of athletics) {
    if (!mod.enrolled.includes(a.id)) {
      scores[a.id] = NI();
      continue;
    }
    const [r1, r2] = reps[a.id];
    if (bothIn(fin, a.id)) {
      scores[a.id] = mk(13, 13, 'Final 100% da atlética · Campeã garantida 🏆');
      continue;
    }
    if (bothIn(thd, a.id)) {
      scores[a.id] = mk(8, 8, 'Disputa de 3º 100% da atlética · 3º garantido');
      continue;
    }
    const best = r1.max > r2.max || (r1.max === r2.max && r1.min >= r2.min) ? r1 : r2;
    scores[a.id] = mk(Math.max(r1.min, r2.min), Math.max(r1.max, r2.max), `Melhor: Atleta ${best.rep} · ${best.label}`);
  }
  return { modality: mod, scores, status: bracketStatus, bracket: res, reps };
}

export function computeModality(mod: Modality, state: AppState): ModalityResult {
  if (mod.group === 'C') {
    const t = tableScores(mod, state.tables[mod.code], state.athletics);
    return { modality: mod, ...t };
  }
  return bracketModality(mod, state.brackets[mod.code], state.athletics);
}

/** Sugestão de ordem 1º–8º das delegações a partir da chave (Modo Ranking do Grupo B). */
export function suggestRankingFromBracket(result: ModalityResult): (string | null)[] {
  const out: (string | null)[] = Array(8).fill(null);
  if (!result.reps) return out;
  const entries: { id: string; place: number }[] = [];
  Object.values(result.reps).forEach((list) =>
    list.forEach((r) => {
      if (r.min === r.max && r.min > 0) {
        const p = placeFromPoints(r.min);
        if (p) entries.push({ id: r.athleticId, place: p });
      }
    }),
  );
  entries.sort((x, y) => x.place - y.place);
  const seen = new Set<string>();
  let i = 0;
  for (const e of entries) {
    if (seen.has(e.id) || i >= 8) continue;
    seen.add(e.id);
    out[i++] = e.id;
  }
  return out;
}

// ----------------------------------------------------------------------------
// Classificação Geral
// ----------------------------------------------------------------------------
export type SortMetric = 'avg' | 'max' | 'min';

export interface StandingRow {
  athletic: Athletic;
  min: number;
  max: number;
  avg: number;
  adj: number;
  /** contagem de 1º..8º lugares cravados */
  places: number[];
  perModality: Record<string, Score>;
  enrolledCount: number;
}

export interface Overview {
  results: Record<string, ModalityResult>;
  rows: StandingRow[];
  definedCount: number;
}

export function computeOverview(state: AppState): Overview {
  const results: Record<string, ModalityResult> = {};
  for (const mod of MODALITIES) results[mod.code] = computeModality(mod, state);
  const rows: StandingRow[] = state.athletics.map((a) => {
    let min = 0;
    let max = 0;
    let enrolledCount = 0;
    const places = Array(8).fill(0);
    const perModality: Record<string, Score> = {};
    for (const mod of MODALITIES) {
      const s = results[mod.code].scores[a.id];
      perModality[mod.code] = s;
      min += s.min;
      max += s.max;
      if (s.enrolled) enrolledCount++;
      if (s.place) places[s.place - 1]++;
    }
    const adj = state.adjustments.filter((x) => x.athleticId === a.id).reduce((acc, x) => acc + x.value, 0);
    min += adj;
    max += adj;
    return { athletic: a, min, max, avg: (min + max) / 2, adj, places, perModality, enrolledCount };
  });
  const definedCount = MODALITIES.filter((m) => results[m.code].status === 'defined').length;
  return { results, rows, definedCount };
}

export function sortRows(rows: StandingRow[], metric: SortMetric): StandingRow[] {
  return [...rows].sort((x, y) => {
    const d = y[metric] - x[metric];
    if (d !== 0) return d;
    for (let p = 0; p < 3; p++) if (y.places[p] !== x.places[p]) return y.places[p] - x.places[p];
    return x.athletic.name.localeCompare(y.athletic.name, 'pt-BR');
  });
}

/** 162.5 -> "162,5" · 156 -> "156" */
export const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
