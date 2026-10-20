// ============================================================================
// Tipos centrais do Sistema de Projeção — Olimpíada Universitária UFU 2026
// ============================================================================

export type Group = 'A' | 'B' | 'C';

export interface Athletic {
  id: string;
  name: string;
  short: string;
  color: string;
  /** Escudo opcional (data URL redimensionada) */
  logo?: string;
}

export type RepechageType = 'none' | '14_teams' | '15_teams' | '12_teams';

export interface Modality {
  code: string;
  name: string;
  group: Group;
  /** IDs das atléticas inscritas */
  enrolled: string[];
  /** Nome do esporte (sem gênero), usado para agrupar visualmente */
  sport: string;
  emoji: string;
  /** Se tem a nova disputa presencial de 5º ao 8º lugar (Jogos 13, 14, Final 5/6, Final 7/8) */
  hasConsolationBracket?: boolean;
  /** Se tem repescagem para cabeças de chave nas oitavas */
  repechageType?: RepechageType;
}

/** Valores especiais de slot de chave */
export const BYE = 'BYE';
export const NONE = 'NONE';

/**
 * Valor de um slot da 1ª fase:
 * - Grupo A / Tênis: id da atlética ou marcador de repescagem 'LOSER:X'
 * - Grupo B: `${idAtletica}:1` (Chave A) ou `${idAtletica}:2` (Chave B)
 * - BYE / NONE: avança o adversário automaticamente
 * - null: vazio (aguardando sorteio)
 */
export type Slot = string | null;

export interface TableState {
  positions: (string | null)[]; // 8 posições: índice 0 = 1º lugar
  finalized: boolean;
}

export type BracketMode = 'best' | 'ranking';

export interface BracketState {
  slots: Slot[]; // 16 (Grupo A / Tênis) ou 32 (Grupo B)
  winners: (string | null)[][]; // winners[rodada][jogo]
  thirdWinner: string | null; // Vencedor da Decisão de 3º lugar
  // Novos campos oficiais de 2026 para disputa de 5º a 8º lugar nos coletivos:
  consolationWinners?: (string | null)[]; // [vencedor Jogo 13, vencedor Jogo 14]
  fifthWinner?: string | null; // Vencedor da Final 5º ao 6º lugar (5º colocado)
  seventhWinner?: string | null; // Vencedor da Final 7º ao 8º lugar (7º colocado)
  mode: BracketMode;
  ranking: TableState; // usado no Modo Ranking Geral Derivado (Grupo B)
}

export interface Adjustment {
  id: string;
  athleticId: string;
  value: number;
  reason: string;
}

export interface AppState {
  version: 1;
  athletics: Athletic[];
  brackets: Record<string, BracketState>;
  tables: Record<string, TableState>;
  adjustments: Adjustment[];
  updatedAt: string;
}

export interface Score {
  min: number;
  max: number;
  enrolled: boolean;
  label: string;
  /** Posição definitiva (1..8) quando min === max > 0 */
  place?: number;
  tone: 'locked' | 'open' | 'out' | 'ni';
}

export type ModalityStatus = 'not-started' | 'in-progress' | 'defined';
