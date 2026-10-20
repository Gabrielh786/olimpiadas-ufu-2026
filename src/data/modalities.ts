import type { Group, Modality, RepechageType } from '../types.ts';
import { ALL_IDS } from './athletics.ts';

/** Pontuação Art. 79 — índice 0 = 1º lugar */
export const POINTS = [13, 10, 8, 7, 5, 4, 3, 2] as const;
export const MAX_POINTS = POINTS[0];

export const placeFromPoints = (pts: number): number | undefined => {
  const i = POINTS.indexOf(pts as (typeof POINTS)[number]);
  return i >= 0 ? i + 1 : undefined;
};

const except = (...ids: string[]) => ALL_IDS.filter((id) => !ids.includes(id));
const ALL = ALL_IDS;

const m = (
  code: string,
  name: string,
  sport: string,
  emoji: string,
  group: Group,
  enrolled: string[],
  hasConsolationBracket = false,
  repechageType: RepechageType = 'none',
): Modality => ({
  code,
  name,
  sport,
  emoji,
  group,
  enrolled,
  hasConsolationBracket,
  repechageType,
});

// ============================================================================
// As 27 categorias/modalidades pontuáveis oficiais da Olimpíada UFU 2026
// ============================================================================
export const MODALITIES: Modality[] = [
  // ---------------- GRUPO A: Modalidades Coletivas com Chaveamento Oficial UFU 2026 ----------------
  // (Com jogos de Oitavas, Repescagem para cabeças de chave quando aplicável e Disputa de 5º a 8º lugar)
  m('VM', 'Vôlei Masculino', 'Vôlei', '🏐', 'A', ALL, true, 'none'),
  m('VF', 'Vôlei Feminino', 'Vôlei', '🏐', 'A', ALL, true, 'none'),
  m('BM', 'Basquete Masculino', 'Basquete', '🏀', 'A', ALL, true, 'none'),
  m('BF', 'Basquete Feminino', 'Basquete', '🏀', 'A', except('moca', 'psicologia'), true, '14_teams'),
  m('HM', 'Handebol Masculino', 'Handebol', '🤾', 'A', except('artes', 'moca', 'odonto', 'psicologia'), true, '12_teams'),
  m('HF', 'Handebol Feminino', 'Handebol', '🤾', 'A', except('moca'), true, '15_teams'),
  m('PM', 'Peteca Masculino', 'Peteca', '🏸', 'A', ALL, true, 'none'),
  m('PF', 'Peteca Feminino', 'Peteca', '🏸', 'A', ALL, true, 'none'),
  m('FM', 'Futsal Masculino', 'Futsal', '⚽', 'A', ALL, true, 'none'),
  m('FF', 'Futsal Feminino', 'Futsal', '⚽', 'A', except('moca', 'psicologia'), true, '14_teams'),
  m('FC', 'Futebol de Campo Masculino', 'Futebol de Campo', '🥅', 'A', except('aplicada', 'artes', 'biologicas', 'moca'), true, '12_teams'),

  // ---------------- Tênis de Campo (Mata-mata tradicional simples com BYE) ----------------
  m('TCM', 'Tênis de Campo Masculino', 'Tênis de Campo', '🎾', 'A', except('aplicada', 'moca', 'psicologia'), false, 'none'),
  m('TCF', 'Tênis de Campo Feminino', 'Tênis de Campo', '🎾', 'A', except('moca'), false, 'none'),

  // ---------------- GRUPO C: Modalidades de Tabela de Ordem / Pontuação Final ----------------
  // Tênis de Mesa (15 atléticas inscritas — todas exceto Moca)
  m('TMM', 'Tênis de Mesa Masculino', 'Tênis de Mesa', '🏓', 'C', except('moca')),
  m('TMF', 'Tênis de Mesa Feminino', 'Tênis de Mesa', '🏓', 'C', except('moca')),

  // FIFA / E-Sports (Tabela de Ordem)
  m('ESM', 'FIFA Masculino', 'FIFA / E-Sports', '🎮', 'C', ALL),
  m('ESF', 'FIFA Feminino', 'FIFA / E-Sports', '🎮', 'C', ALL),

  // Demais modalidades de Tabela de Ordem
  m('AM', 'Atletismo Masculino', 'Atletismo', '🏃', 'C', ALL),
  m('AF', 'Atletismo Feminino', 'Atletismo', '🏃', 'C', ALL),
  m('NM', 'Natação Masculino', 'Natação', '🏊', 'C', except('humanas')),
  m('NF', 'Natação Feminino', 'Natação', '🏊', 'C', except('humanas')),
  m('JM', 'Judô Masculino', 'Judô', '🥋', 'C', except('moca')),
  m('JF', 'Judô Feminino', 'Judô', '🥋', 'C', except('moca')),
  m('XM', 'Xadrez Masculino', 'Xadrez', '♟️', 'C', ALL),
  m('XF', 'Xadrez Feminino', 'Xadrez', '♟️', 'C', ALL),
  m('CD', 'Cheer Dance Misto', 'Cheer Dance', '📣', 'C', [
    'aplicada',
    'artes',
    'biologicas',
    'direito',
    'educa',
    'engenharia',
    'fisioterapia',
    'humanas',
    'medicina',
    'monetaria',
  ]),
  m('TC', 'Team Cheer Misto', 'Team Cheer', '🎉', 'C', except('infernal', 'moca', 'odonto')),
];

export const MODALITY_BY_CODE: Record<string, Modality> = Object.fromEntries(MODALITIES.map((x) => [x.code, x]));

export const GROUP_LABEL: Record<Group, string> = {
  A: 'Mata-Mata (Coletivos & Tênis)',
  B: 'Mata-Mata 32 · Duplo Atleta',
  C: 'Tabela de Ordem',
};

export const bracketSize = (g: Group) => (g === 'B' ? 32 : 16);
