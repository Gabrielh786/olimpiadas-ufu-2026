import type { Athletic } from '../types';

// Escudos oficiais (somente o símbolo, sem nome/selo) extraídos por scripts/extract-logos.py
const logo = (id: string) => `${import.meta.env?.BASE_URL ?? '/'}logos/${id}.png`;

// As 16 Associações Atléticas Acadêmicas (AAAs) oficiais da UFU
export const DEFAULT_ATHLETICS: Athletic[] = [
  { id: 'agrarias', name: 'AAA Agrárias', short: 'AGR', color: '#16A34A' },
  { id: 'aplicada', name: 'AAA Aplicada', short: 'APL', color: '#0EA5E9' },
  { id: 'artes', name: 'AAA Artes', short: 'ART', color: '#D946EF' },
  { id: 'biologicas', name: 'AAA Biológicas', short: 'BIO', color: '#22C55E' },
  { id: 'computacao', name: 'AAA Computação & Exatas', short: 'C&E', color: '#6366F1' },
  { id: 'direito', name: 'AAA Direito', short: 'DIR', color: '#B91C1C' },
  { id: 'educa', name: 'AAA Educa', short: 'EDU', color: '#F59E0B' },
  { id: 'engenharia', name: 'AAA Engenharia', short: 'ENG', color: '#F97316' },
  { id: 'fisioterapia', name: 'AAA Fisioterapia', short: 'FIS', color: '#14B8A6' },
  { id: 'humanas', name: 'AAA Humanas', short: 'HUM', color: '#A855F7' },
  { id: 'infernal', name: 'AAA Infernal', short: 'INF', color: '#DC2626' },
  { id: 'medicina', name: 'AAA Medicina', short: 'MED', color: '#2563EB' },
  { id: 'moca', name: 'AAA Moca', short: 'MOC', color: '#EAB308' },
  { id: 'monetaria', name: 'AAA Monetária', short: 'MON', color: '#059669' },
  { id: 'odonto', name: 'AAA Odonto', short: 'ODO', color: '#38BDF8' },
  { id: 'psicologia', name: 'AAA Psicologia', short: 'PSI', color: '#EC4899' },
].map((a) => ({ ...a, logo: logo(a.id) }));

export const ALL_IDS = DEFAULT_ATHLETICS.map((a) => a.id);

/** Logo é um escudo padrão empacotado no app (não um upload do usuário). */
export const isDefaultLogo = (s: string | undefined) => !!s && /\/logos\/[a-z]+\.png$/.test(s);
