// ============================================================================
// Chaveamentos Oficiais Sorteados no Congresso Técnico UFU 2026
// Mapeamento dos 16 slots da 1ª fase conforme os diagramas oficiais das 13 chaves.
// ============================================================================
import { BYE } from '../types.ts';
import type { BracketState } from '../types.ts';
import { emptyBracket } from '../lib/bracket.ts';

// Marcadores de repescagem
export const LOSER_PREFIX = 'LOSER:';
export const isLoserSlot = (s: string | null): boolean => typeof s === 'string' && s.startsWith(LOSER_PREFIX);
export const getLoserTargetMatch = (s: string): number => parseInt(s.replace(LOSER_PREFIX, ''), 10);

export const OFFICIAL_DRAWS_2026: Record<string, string[]> = {
  // 1. Basquete Feminino (14 atléticas)
  BF: [
    'humanas', 'aplicada',       // Jogo 1
    'direito', 'artes',          // Jogo 5
    'medicina', 'agrarias',      // Jogo 4
    'odonto', 'LOSER:2',         // Jogo 8 (repescagem do perdedor do jogo 2)
    'monetaria', 'computacao',   // Jogo 2
    'engenharia', 'educa',       // Jogo 6
    'fisioterapia', 'infernal',  // Jogo 3
    'biologicas', 'LOSER:1',     // Jogo 7 (repescagem do perdedor do jogo 1)
  ],

  // 2. Basquete Masculino (16 atléticas)
  BM: [
    'engenharia', 'moca',
    'computacao', 'aplicada',
    'artes', 'psicologia',
    'agrarias', 'infernal',
    'educa', 'humanas',
    'direito', 'medicina',
    'fisioterapia', 'biologicas',
    'odonto', 'monetaria',
  ],

  // 3. Futebol de Campo (12 atléticas)
  FC: [
    'engenharia', 'computacao',  // Jogo 1
    'agrarias', 'LOSER:3',       // Jogo 5 (repescagem perdedor jogo 3)
    'monetaria', 'direito',      // Jogo 4
    'humanas', 'LOSER:2',        // Jogo 8 (repescagem perdedor jogo 2)
    'educa', 'infernal',         // Jogo 2
    'psicologia', 'LOSER:4',     // Jogo 6 (repescagem perdedor jogo 4)
    'medicina', 'fisioterapia',  // Jogo 3
    'odonto', 'LOSER:1',         // Jogo 7 (repescagem perdedor jogo 1)
  ],

  // 4. Futsal Feminino (14 atléticas)
  FF: [
    'engenharia', 'agrarias',    // Jogo 1
    'computacao', 'infernal',    // Jogo 5
    'fisioterapia', 'direito',   // Jogo 4
    'aplicada', 'LOSER:2',       // Jogo 8 (repescagem perdedor jogo 2)
    'humanas', 'odonto',         // Jogo 2
    'artes', 'biologicas',       // Jogo 6
    'educa', 'medicina',         // Jogo 3
    'monetaria', 'LOSER:1',      // Jogo 7 (repescagem perdedor jogo 1)
  ],

  // 5. Futsal Masculino (16 atléticas)
  FM: [
    'engenharia', 'artes',
    'biologicas', 'medicina',
    'aplicada', 'moca',
    'computacao', 'direito',
    'fisioterapia', 'monetaria',
    'odonto', 'humanas',
    'psicologia', 'educa',
    'infernal', 'agrarias',
  ],

  // 6. Handebol Feminino (15 atléticas)
  HF: [
    'engenharia', 'direito',     // Jogo 1
    'computacao', 'fisioterapia',// Jogo 5
    'agrarias', 'odonto',        // Jogo 4
    'infernal', 'psicologia',    // Jogo 8
    'educa', 'medicina',         // Jogo 2
    'artes', 'humanas',          // Jogo 6
    'monetaria', 'aplicada',     // Jogo 3
    'biologicas', 'LOSER:1',     // Jogo 7 (repescagem perdedor jogo 1)
  ],

  // 7. Handebol Masculino (12 atléticas)
  HM: [
    'engenharia', 'fisioterapia',// Jogo 1
    'computacao', 'LOSER:3',     // Jogo 5 (repescagem perdedor jogo 3)
    'educa', 'agrarias',         // Jogo 4
    'biologicas', 'LOSER:2',     // Jogo 8 (repescagem perdedor jogo 2)
    'monetaria', 'infernal',     // Jogo 2
    'aplicada', 'LOSER:4',       // Jogo 6 (repescagem perdedor jogo 4)
    'medicina', 'direito',       // Jogo 3
    'humanas', 'LOSER:1',        // Jogo 7 (repescagem perdedor jogo 1)
  ],

  // 8. Peteca Feminina (16 atléticas)
  PF: [
    'medicina', 'direito',
    'computacao', 'psicologia',
    'biologicas', 'moca',
    'educa', 'infernal',
    'engenharia', 'humanas',
    'fisioterapia', 'odonto',
    'agrarias', 'aplicada',
    'monetaria', 'artes',
  ],

  // 9. Peteca Masculino (16 atléticas)
  PM: [
    'monetaria', 'agrarias',
    'computacao', 'biologicas',
    'psicologia', 'fisioterapia',
    'infernal', 'odonto',
    'engenharia', 'moca',
    'aplicada', 'artes',
    'medicina', 'educa',
    'direito', 'humanas',
  ],

  // 10. Vôlei Feminino (16 atléticas)
  VF: [
    'direito', 'odonto',
    'biologicas', 'monetaria',
    'fisioterapia', 'agrarias',
    'artes', 'engenharia',
    'educa', 'aplicada',
    'moca', 'psicologia',
    'humanas', 'medicina',
    'infernal', 'computacao',
  ],

  // 11. Vôlei Masculino (16 atléticas)
  VM: [
    'fisioterapia', 'aplicada',
    'artes', 'agrarias',
    'moca', 'computacao',
    'infernal', 'odonto',
    'monetaria', 'direito',
    'educa', 'psicologia',
    'engenharia', 'biologicas',
    'medicina', 'humanas',
  ],

  // 12. Tênis de Campo Masculino (13 atléticas)
  TCM: [
    'agrarias', BYE,             // Agrárias vai direto para as quartas
    'humanas', 'odonto',
    'engenharia', 'artes',
    'medicina', 'fisioterapia',
    'monetaria', BYE,            // Monetária vai direto para as quartas
    'educa', 'biologicas',
    'direito', BYE,              // Direito vai direto para as quartas
    'infernal', 'computacao',
  ],

  // 13. Tênis de Campo Feminino (15 atléticas)
  TCF: [
    'direito', BYE,              // Direito vai direto para as quartas
    'educa', 'odonto',
    'agrarias', 'aplicada',
    'artes', 'computacao',
    'engenharia', 'medicina',
    'biologicas', 'infernal',
    'psicologia', 'humanas',
    'fisioterapia', 'monetaria',
  ],
};

export function getOfficialBracket2026(code: string): BracketState | null {
  const slots = OFFICIAL_DRAWS_2026[code];
  if (!slots) return null;
  const base = emptyBracket(16);
  return {
    ...base,
    slots: [...slots],
  };
}
