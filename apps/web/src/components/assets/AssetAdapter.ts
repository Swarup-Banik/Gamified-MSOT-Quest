/**
 * AssetAdapter Interface
 * Decouples game visual rendering from asset source (procedural parametric SVG vs external artist vectors).
 */

export interface CompanionRenderProps {
  species?: 'fox' | 'owl' | 'dragon' | 'golem';
  evolutionStage?: 1 | 2 | 3;
  mood?: 'idle' | 'happy' | 'cheering' | 'focused';
  size?: number;
  className?: string;
}

export interface MonsterRenderProps {
  topicKey?: string;
  rarity?: 'COMMON' | 'ELITE' | 'BOSS';
  size?: number;
  isHit?: boolean;
  className?: string;
}

export interface ChestRenderProps {
  tier?: 'WOODEN' | 'SILVER' | 'GOLDEN' | 'LEGENDARY';
  size?: number;
  isOpen?: boolean;
  isShaking?: boolean;
  className?: string;
}

export class AssetAdapter {
  static getCompanionLabel(species: string = 'fox', stage: number = 1): string {
    return `Level ${stage} ${species.charAt(0).toUpperCase() + species.slice(1)} Study Companion`;
  }

  static getMonsterLabel(topic: string = 'recursion', rarity: string = 'COMMON'): string {
    return `${rarity} Mistake Monster for ${topic}`;
  }

  static getChestLabel(tier: string = 'WOODEN'): string {
    return `${tier} Mystery Reward Chest`;
  }
}
