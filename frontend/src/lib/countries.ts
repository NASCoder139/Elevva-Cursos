export const COUNTRIES = [
  'Chile',
  'Argentina',
  'Bolivia',
  'Brasil',
  'Canadá',
  'Colombia',
  'Costa Rica',
  'Cuba',
  'Ecuador',
  'El Salvador',
  'España',
  'Estados Unidos',
  'Francia',
  'Guatemala',
  'Honduras',
  'Italia',
  'México',
  'Nicaragua',
  'Panamá',
  'Paraguay',
  'Perú',
  'Portugal',
  'Puerto Rico',
  'Reino Unido',
  'República Dominicana',
  'Uruguay',
  'Venezuela',
  'Otro',
] as const;

export type Country = (typeof COUNTRIES)[number];

const CHILE_ALIASES = new Set(['chile', 'chl', 'cl']);

export function isChile(country: string | null | undefined): boolean {
  if (!country) return false;
  return CHILE_ALIASES.has(country.trim().toLowerCase());
}
