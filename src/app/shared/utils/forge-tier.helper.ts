export interface ForgeTier {
  name: string;
  icon: string;
  color: string;
  minScore: number;
  nextMin: number | null;
}

export const FORGE_TIERS: ForgeTier[] = [
  { name: 'Aprendiz de Forja', icon: '🔨', color: '#9CA3AF', minScore: 0, nextMin: 100 },
  { name: 'Pintor de Batalla', icon: '⚔️', color: '#60A5FA', minScore: 100, nextMin: 300 },
  { name: 'Maestro Herrero', icon: '🛡️', color: '#A78BFA', minScore: 300, nextMin: 700 },
  {
    name: 'Gran Maestro de la Forja',
    icon: '👑',
    color: '#F59E0B',
    minScore: 700,
    nextMin: null,
  },
];

export function getTierInfo(tierName: string): ForgeTier {
  return FORGE_TIERS.find((t) => t.name === tierName) ?? FORGE_TIERS[0];
}

export function getProgressToNextTier(score: number, tierName: string): number {
  const tier = getTierInfo(tierName);
  if (!tier.nextMin) return 100;
  const range = tier.nextMin - tier.minScore;
  const progress = score - tier.minScore;
  return Math.min(Math.round((progress / range) * 100), 100);
}
