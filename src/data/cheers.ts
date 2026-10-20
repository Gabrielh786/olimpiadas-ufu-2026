// ============================================================================
// Informações Oficiais das Equipes de Cheerleading — UFU 2026
// Mapeamento dos nomes oficiais dos Cheers e Ordem Oficial de Apresentação
// ============================================================================

export interface CheerTeam {
  cheerName: string;
  athleticId: string;
  order: number;
}

// Nomes oficiais dos Cheers por Atlética
export const CHEER_NAMES_BY_ATHLETIC: Record<string, string> = {
  aplicada: 'HOPPERS',
  educa: 'FURIOUS',
  humanas: 'PANTHERS',
  engenharia: 'SEXY LIONS',
  direito: 'LA LOBA',
  monetaria: 'MAGNATAS',
  fisioterapia: 'WILD CROCS',
  biologicas: 'FLAMES',
  artes: 'ARLEKINGS',
  medicina: 'PYTHONS',
  psicologia: 'VOLUPTA',
  agrarias: 'BLUE BEASTS',
  computacao: 'WOLVES',
};

// 1. CHEER DANCE (Ordem Oficial de Apresentação do Congresso Técnico)
export const CHEER_DANCE_ORDER: CheerTeam[] = [
  { order: 1, cheerName: 'HOPPERS', athleticId: 'aplicada' },
  { order: 2, cheerName: 'FURIOUS', athleticId: 'educa' },
  { order: 3, cheerName: 'PANTHERS', athleticId: 'humanas' },
  { order: 4, cheerName: 'SEXY LIONS', athleticId: 'engenharia' },
  { order: 5, cheerName: 'LA LOBA', athleticId: 'direito' },
  { order: 6, cheerName: 'MAGNATAS', athleticId: 'monetaria' },
  { order: 7, cheerName: 'WILD CROCS', athleticId: 'fisioterapia' },
  { order: 8, cheerName: 'FLAMES', athleticId: 'biologicas' },
  { order: 9, cheerName: 'ARLEKINGS', athleticId: 'artes' },
  { order: 10, cheerName: 'PYTHONS', athleticId: 'medicina' },
];

// 2. TEAM CHEER (Ordem Oficial de Apresentação do Congresso Técnico)
export const TEAM_CHEER_ORDER: CheerTeam[] = [
  { order: 1, cheerName: 'PANTHERS', athleticId: 'humanas' },
  { order: 2, cheerName: 'WILD CROCS', athleticId: 'fisioterapia' },
  { order: 3, cheerName: 'MAGNATAS', athleticId: 'monetaria' },
  { order: 4, cheerName: 'FURIOUS', athleticId: 'educa' },
  { order: 5, cheerName: 'SEXY LIONS', athleticId: 'engenharia' },
  { order: 6, cheerName: 'VOLUPTA', athleticId: 'psicologia' },
  { order: 7, cheerName: 'BLUE BEASTS', athleticId: 'agrarias' },
  { order: 8, cheerName: 'LA LOBA', athleticId: 'direito' },
  { order: 9, cheerName: 'PYTHONS', athleticId: 'medicina' },
  { order: 10, cheerName: 'HOPPERS', athleticId: 'aplicada' },
  { order: 11, cheerName: 'FLAMES', athleticId: 'biologicas' },
  { order: 12, cheerName: 'ARLEKINGS', athleticId: 'artes' },
  { order: 13, cheerName: 'WOLVES', athleticId: 'computacao' },
];

export const isCheerModality = (code: string): boolean => code === 'CD' || code === 'TC';

export const getCheerName = (athleticId: string): string | undefined => CHEER_NAMES_BY_ATHLETIC[athleticId];

export const getCheerPresentationOrder = (code: string): CheerTeam[] | null => {
  if (code === 'CD') return CHEER_DANCE_ORDER;
  if (code === 'TC') return TEAM_CHEER_ORDER;
  return null;
};
