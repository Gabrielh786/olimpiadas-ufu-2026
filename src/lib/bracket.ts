// ============================================================================
// Motor de Chaveamento Oficial UFU 2026
// - Suporta chaveamento oficial com jogos numerados (Jogos 1 a 16)
// - Repescagem para cabeças de chave nas oitavas (BF, FF, HF, FC, HM)
// - Nova disputa presencial de 5º a 8º lugar (Jogos 13, 14, Final 5º/6º, Final 7º/8º)
// - Chaves tradicionais de Tênis de Campo (TCM, TCF) e E-Sports (ESM, ESF)
// ============================================================================
import { BYE, NONE } from '../types.ts';
import type { BracketState, Slot, TableState } from '../types.ts';
import { isLoserSlot, getLoserTargetMatch } from '../data/officialDraw2026.ts';

export const isPass = (x: Slot | undefined): boolean => x === BYE || x === NONE;
export const isReal = (x: Slot | undefined): x is string => !!x && !isPass(x) && !isLoserSlot(x);

export interface ResolvedMatch {
  matchNumber?: number; // Número oficial do jogo no chaveamento UFU (1 a 16)
  round: number; // 0=oitavas (ou 16-avos), 1=quartas, etc; -1=3º lugar; -2=semi 5-8; -3=5º/6º; -4=7º/8º
  index: number;
  label?: string;
  a: string | null;
  b: string | null;
  winner: string | null;
  auto: boolean;
}

export interface ResolvedBracket {
  size: number;
  numRounds: number;
  qf: number;
  sf: number;
  final: number;
  hasConsolation: boolean;
  rounds: ResolvedMatch[][];
  third: ResolvedMatch;
  finalMatch: ResolvedMatch;
  // Disputa de 5º ao 8º lugar (quando hasConsolation = true)
  consolationSemis: ResolvedMatch[]; // [Jogo 13, Jogo 14]
  fifthMatch: ResolvedMatch; // Final 5º ao 6º
  seventhMatch: ResolvedMatch; // Final 7º ao 8º
}

export interface RoundName {
  name: string;
  prep: 'nas' | 'nos' | 'na';
}

export const roundNames = (size: number): RoundName[] =>
  size === 32
    ? [
        { name: '16-avos de Final', prep: 'nos' },
        { name: 'Oitavas de Final', prep: 'nas' },
        { name: 'Quartas de Final', prep: 'nas' },
        { name: 'Semifinal', prep: 'na' },
        { name: 'Final', prep: 'na' },
      ]
    : [
        { name: 'Oitavas de Final', prep: 'nas' },
        { name: 'Quartas de Final', prep: 'nas' },
        { name: 'Semifinal', prep: 'na' },
        { name: 'Final', prep: 'na' },
      ];

export const emptyTable = (): TableState => ({ positions: Array(8).fill(null), finalized: false });

export const emptyBracket = (size: number): BracketState => {
  const numRounds = Math.round(Math.log2(size));
  return {
    slots: Array(size).fill(null),
    winners: Array.from({ length: numRounds }, (_, r) => Array(size >> (r + 1)).fill(null)),
    thirdWinner: null,
    consolationWinners: [null, null],
    fifthWinner: null,
    seventhWinner: null,
    mode: 'best',
    ranking: emptyTable(),
  };
};

function decide(a: string | null, b: string | null, stored: string | null): { winner: string | null; auto: boolean } {
  if (a == null || b == null) return { winner: null, auto: false };
  if (isPass(a) && isPass(b)) return { winner: BYE, auto: true };
  if (isPass(a)) return { winner: b, auto: true };
  if (isPass(b)) return { winner: a, auto: true };
  return { winner: stored === a || stored === b ? stored : null, auto: false };
}

export const loserOf = (m: ResolvedMatch): string | null =>
  m.winner == null ? null : m.winner === m.a ? m.b : m.a;

// Mapeamento dos índices das oitavas para a numeração oficial dos jogos UFU 2026:
// Confronto 0 -> Jogo 1
// Confronto 1 -> Jogo 5
// Confronto 2 -> Jogo 4
// Confronto 3 -> Jogo 8
// Confronto 4 -> Jogo 2
// Confronto 5 -> Jogo 6
// Confronto 6 -> Jogo 3
// Confronto 7 -> Jogo 7
const OITAVAS_MATCH_NUMBERS = [1, 5, 4, 8, 2, 6, 3, 7];
const QUARTAS_MATCH_NUMBERS = [9, 12, 10, 11];
const SEMIS_MATCH_NUMBERS = [15, 16];

export function resolveBracket(state: BracketState, hasConsolation = false): ResolvedBracket {
  const size = state.slots.length;
  const numRounds = Math.round(Math.log2(size));
  const rounds: ResolvedMatch[][] = [];

  // Rodada 0: Oitavas (ou 16-avos no Grupo B de 32)
  const round0Count = size / 2;
  const round0: ResolvedMatch[] = [];

  // Passagem 1 da Rodada 0 (resolve jogos normais que não dependem de repescagem)
  for (let i = 0; i < round0Count; i++) {
    const rawA = state.slots[2 * i] ?? null;
    const rawB = state.slots[2 * i + 1] ?? null;
    const stored = state.winners[0]?.[i] ?? null;
    const matchNum = size === 16 ? OITAVAS_MATCH_NUMBERS[i] : undefined;

    // Se não for repescagem LOSER:X, resolve diretamente
    const a = isLoserSlot(rawA) ? null : rawA;
    const b = isLoserSlot(rawB) ? null : rawB;

    round0.push({
      matchNumber: matchNum,
      round: 0,
      index: i,
      label: matchNum ? `Jogo ${matchNum}` : undefined,
      a,
      b,
      ...decide(a, b, stored),
    });
  }

  // Passagem 2 da Rodada 0: se algum slot for repescagem 'LOSER:X', alimenta com o perdedor do jogo X
  if (size === 16) {
    const findMatch = (num: number) => round0.find((m) => m.matchNumber === num);

    for (let i = 0; i < round0Count; i++) {
      const rawA = state.slots[2 * i] ?? null;
      const rawB = state.slots[2 * i + 1] ?? null;
      let effectiveA = round0[i].a;
      let effectiveB = round0[i].b;

      if (isLoserSlot(rawA)) {
        const target = getLoserTargetMatch(rawA as string);
        const sourceMatch = findMatch(target);
        effectiveA = sourceMatch ? loserOf(sourceMatch) : null;
      }
      if (isLoserSlot(rawB)) {
        const target = getLoserTargetMatch(rawB as string);
        const sourceMatch = findMatch(target);
        effectiveB = sourceMatch ? loserOf(sourceMatch) : null;
      }

      if (effectiveA !== round0[i].a || effectiveB !== round0[i].b) {
        const stored = state.winners[0]?.[i] ?? null;
        round0[i] = {
          ...round0[i],
          a: effectiveA,
          b: effectiveB,
          ...decide(effectiveA, effectiveB, stored),
        };
      }
    }
  }

  rounds.push(round0);

  // Rodadas seguintes (Quartas, Semifinais, Final)
  for (let r = 1; r < numRounds; r++) {
    const n = size >> (r + 1);
    const list: ResolvedMatch[] = [];
    for (let i = 0; i < n; i++) {
      const a = rounds[r - 1][2 * i].winner;
      const b = rounds[r - 1][2 * i + 1].winner;
      const stored = state.winners[r]?.[i] ?? null;

      let matchNum: number | undefined;
      let label: string | undefined;

      if (size === 16) {
        if (r === 1) {
          matchNum = QUARTAS_MATCH_NUMBERS[i];
          label = `Jogo ${matchNum} · Quartas`;
        } else if (r === 2) {
          matchNum = SEMIS_MATCH_NUMBERS[i];
          label = `Jogo ${matchNum} · Semi 1º ao 4º`;
        } else if (r === 3) {
          label = 'Grande Final (1º e 2º)';
        }
      }

      list.push({
        matchNumber: matchNum,
        round: r,
        index: i,
        label,
        a,
        b,
        ...decide(a, b, stored),
      });
    }
    rounds.push(list);
  }

  const qf = numRounds - 3;
  const sf = numRounds - 2;
  const final = numRounds - 1;

  // Decisão de 3º Lugar
  const ta = loserOf(rounds[sf][0]);
  const tb = loserOf(rounds[sf][1]);
  const third: ResolvedMatch = {
    round: -1,
    index: 0,
    label: 'Decisão 3º Lugar (3º e 4º)',
    a: ta,
    b: tb,
    ...decide(ta, tb, state.thirdWinner),
  };

  const finalMatch = rounds[final][0];

  // -------------------------------------------------------------------------
  // Disputa de 5º ao 8º Lugar (Oficial UFU 2026 para modalidades coletivas)
  // -------------------------------------------------------------------------
  const consolationSemis: ResolvedMatch[] = [];
  let fifthMatch: ResolvedMatch;
  let seventhMatch: ResolvedMatch;

  if (hasConsolation && size === 16) {
    // Jogo 13: Perdedor Jogo 9 (rounds[1][0]) vs Perdedor Jogo 12 (rounds[1][1])
    const p9 = loserOf(rounds[1][0]);
    const p12 = loserOf(rounds[1][1]);
    const stored13 = state.consolationWinners?.[0] ?? null;
    const semi13: ResolvedMatch = {
      matchNumber: 13,
      round: -2,
      index: 0,
      label: 'Jogo 13 · Semi 5º ao 8º',
      a: p9,
      b: p12,
      ...decide(p9, p12, stored13),
    };

    // Jogo 14: Perdedor Jogo 10 (rounds[1][2]) vs Perdedor Jogo 11 (rounds[1][3])
    const p10 = loserOf(rounds[1][2]);
    const p11 = loserOf(rounds[1][3]);
    const stored14 = state.consolationWinners?.[1] ?? null;
    const semi14: ResolvedMatch = {
      matchNumber: 14,
      round: -2,
      index: 1,
      label: 'Jogo 14 · Semi 5º ao 8º',
      a: p10,
      b: p11,
      ...decide(p10, p11, stored14),
    };

    consolationSemis.push(semi13, semi14);

    // Final 5º ao 6º: Vencedor Jogo 13 vs Vencedor Jogo 14
    const v13 = semi13.winner;
    const v14 = semi14.winner;
    fifthMatch = {
      round: -3,
      index: 0,
      label: 'Final 5º ao 6º Lugar',
      a: v13,
      b: v14,
      ...decide(v13, v14, state.fifthWinner ?? null),
    };

    // Final 7º ao 8º: Perdedor Jogo 13 vs Perdedor Jogo 14
    const l13 = loserOf(semi13);
    const l14 = loserOf(semi14);
    seventhMatch = {
      round: -4,
      index: 0,
      label: 'Final 7º ao 8º Lugar',
      a: l13,
      b: l14,
      ...decide(l13, l14, state.seventhWinner ?? null),
    };
  } else {
    // Dummy para manter integridade
    fifthMatch = { round: -3, index: 0, a: null, b: null, winner: null, auto: false };
    seventhMatch = { round: -4, index: 0, a: null, b: null, winner: null, auto: false };
  }

  return {
    size,
    numRounds,
    qf,
    sf,
    final,
    hasConsolation,
    rounds,
    third,
    finalMatch,
    consolationSemis,
    fifthMatch,
    seventhMatch,
  };
}

/** Limpa vencedores inválidos em cascata após alteração de qualquer jogo anterior. */
export function normalizeBracket(state: BracketState, hasConsolation = false): BracketState {
  const res = resolveBracket(state, hasConsolation);
  const keep = (m: ResolvedMatch) => (isReal(m.a) && isReal(m.b) ? m.winner : null);

  return {
    ...state,
    winners: res.rounds.map((round) => round.map(keep)),
    thirdWinner: keep(res.third),
    consolationWinners: hasConsolation ? res.consolationSemis.map(keep) : undefined,
    fifthWinner: hasConsolation ? keep(res.fifthMatch) : undefined,
    seventhWinner: hasConsolation ? keep(res.seventhMatch) : undefined,
  };
}

export const isBracketDefined = (res: ResolvedBracket): boolean => {
  if (res.finalMatch.winner == null || res.third.winner == null) return false;
  if (res.hasConsolation) {
    return res.fifthMatch.winner != null && res.seventhMatch.winner != null;
  }
  return true;
};

// ----------------------------------------------------------------------------
// Pontuação individual de um competidor dentro da chave
// ----------------------------------------------------------------------------
export interface CompetitorResult {
  min: number;
  max: number;
  label: string;
  reached: number;
}

export function competitorResult(
  res: ResolvedBracket,
  c: string,
  nameOf: (competitor: string) => string,
): CompetitorResult | null {
  const R = (min: number, max: number, label: string, reached = 0): CompetitorResult => ({ min, max, label, reached });

  // 1. Grande Final (1º e 2º)
  if (res.finalMatch.a === c || res.finalMatch.b === c) {
    if (res.finalMatch.winner == null) return R(10, 13, 'Na Grande Final (1º e 2º)', res.final);
    if (res.finalMatch.winner === c) return R(13, 13, '1º Lugar · Campeã 🏆', res.final);
    return R(10, 10, '2º Lugar · Vice-Campeã 🥈', res.final);
  }

  // 2. Decisão de 3º Lugar (3º e 4º)
  if (res.third.a === c || res.third.b === c) {
    if (res.third.winner == null) return R(7, 8, 'Na Decisão de 3º Lugar', res.sf);
    if (res.third.winner === c) return R(8, 8, '3º Lugar 🥉', res.sf);
    return R(7, 7, '4º Lugar', res.sf);
  }

  // 3. Semifinal 1º ao 4º
  for (const m of res.rounds[res.sf]) {
    if (m.a === c || m.b === c) {
      if (m.winner == null || m.winner === c) return R(7, 13, 'Viva na Semifinal', res.sf);
    }
  }

  // -------------------------------------------------------------------------
  // Disputa de 5º ao 8º Lugar (quando hasConsolation = true)
  // -------------------------------------------------------------------------
  if (res.hasConsolation) {
    // Final 5º ao 6º
    if (res.fifthMatch.a === c || res.fifthMatch.b === c) {
      if (res.fifthMatch.winner == null) return R(4, 5, 'Na Final de 5º ao 6º', res.qf);
      if (res.fifthMatch.winner === c) return R(5, 5, '5º Lugar', res.qf);
      return R(4, 4, '6º Lugar', res.qf);
    }

    // Final 7º ao 8º
    if (res.seventhMatch.a === c || res.seventhMatch.b === c) {
      if (res.seventhMatch.winner == null) return R(2, 3, 'Na Final de 7º ao 8º', res.qf);
      if (res.seventhMatch.winner === c) return R(3, 3, '7º Lugar', res.qf);
      return R(2, 2, '8º Lugar', res.qf);
    }

    // Semis de 5º ao 8º (Jogos 13 e 14)
    for (const m of res.consolationSemis) {
      if (m.a === c || m.b === c) {
        if (m.winner == null) return R(2, 5, 'Na Semi de 5º ao 8º', res.qf);
      }
    }
  }

  // 4. Quartas de Final
  for (const m of res.rounds[res.qf]) {
    if (m.a === c || m.b === c) {
      if (m.winner == null || m.winner === c) return R(2, 13, 'Viva nas Quartas', res.qf);

      // Perdeu nas quartas:
      if (res.hasConsolation) {
        // Nos coletivos, o perdedor vai para a semifinal de 5º a 8º!
        return R(2, 5, 'Classificada para Disputa de 5º ao 8º', res.qf);
      }

      // No Tênis de Campo (sem consolação): aplica Regra do Algoz
      const algoz = m.winner;
      const algozName = isReal(algoz) ? nameOf(algoz) : 'BYE';
      const sfMatch = res.rounds[res.sf].find((x) => x.a === algoz || x.b === algoz);
      if (!sfMatch || sfMatch.winner == null)
        return R(2, 5, `Eliminada nas Quartas · aguardando Algoz (${algozName}) na Semi`, res.qf);
      if (sfMatch.winner === algoz) {
        const fw = res.finalMatch.winner;
        if (fw == null) return R(4, 5, `Eliminada nas Quartas · Algoz (${algozName}) na Final`, res.qf);
        if (fw === algoz) return R(5, 5, `5º Lugar · Algoz (${algozName}) Campeã`, res.qf);
        return R(4, 4, `6º Lugar · Algoz (${algozName}) Vice`, res.qf);
      }
      const tw = res.third.winner;
      if (tw == null) return R(2, 3, `Eliminada nas Quartas · Algoz (${algozName}) na Disputa de 3º`, res.qf);
      if (tw === algoz) return R(3, 3, `7º Lugar · Algoz (${algozName}) em 3º`, res.qf);
      return R(2, 2, `8º Lugar · Algoz (${algozName}) em 4º`, res.qf);
    }
  }

  // 5. Oitavas de Final (Rodada 0)
  for (const m of res.rounds[0]) {
    if (m.a === c || m.b === c) {
      if (m.winner == null || m.winner === c) return R(0, 13, 'Viva nas Oitavas', 0);
    }
  }

  // 6. Verificar se ainda tem repescagem pendente nas Oitavas (caso tenha perdido um jogo com repescagem)
  for (let r = 0; r < res.rounds[0].length; r++) {
    const m = res.rounds[0][r];
    if (loserOf(m) === c) {
      // Verifica se o perdedor deste jogo alimenta algum outro jogo de oitava
      const matchNum = m.matchNumber;
      if (matchNum && [1, 2, 3, 4].includes(matchNum)) {
        // Se a repescagem ainda não ocorreu ou ele está nela:
        const repMatch = res.rounds[0].find((x) => x.a === c || x.b === c);
        if (repMatch) {
          if (repMatch.winner == null || repMatch.winner === c) {
            return R(0, 13, 'Viva na Repescagem das Oitavas', 0);
          }
        }
      }
    }
  }

  // Se participou e foi eliminada sem repescagem
  const playedAny = res.rounds[0].some((m) => m.a === c || m.b === c || loserOf(m) === c);
  if (playedAny) {
    return R(0, 0, 'Eliminada nas Oitavas', 0);
  }

  return null;
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function arrangeSide(items: string[], targetCount: number): (string | null)[] {
  const sh = shuffle(items);
  const res: (string | null)[] = Array(targetCount).fill(null);
  for (let i = 0; i < Math.min(sh.length, targetCount); i++) {
    res[i] = sh[i];
  }
  return res;
}

export function fillByesSide(
  slots: (Slot | null)[],
  unallocatedCount: number,
): { slots: (Slot | null)[]; added: number } {
  const next = [...slots];
  const emptyIndices = next.map((s, idx) => (s == null ? idx : -1)).filter((idx) => idx !== -1);
  const byesNeeded = Math.max(0, emptyIndices.length - unallocatedCount);
  let added = 0;

  emptyIndices.sort((a, b) => {
    const partnerA = a % 2 === 0 ? a + 1 : a - 1;
    const partnerB = b % 2 === 0 ? b + 1 : b - 1;
    const hasA = next[partnerA] != null ? 1 : 0;
    const hasB = next[partnerB] != null ? 1 : 0;
    return hasB - hasA;
  });

  for (let i = 0; i < byesNeeded && i < emptyIndices.length; i++) {
    next[emptyIndices[i]] = BYE;
    added++;
  }

  return { slots: next, added };
}

