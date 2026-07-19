import { describe, it, expect } from 'vitest';
import { calcSpeed, calcWill, calcAttackBonus, calcMaxLife, calcAllStats } from '../attributeCalculator';
import type { PlayerState } from '../../../../shared/types';

function makeArtifact(id: string, overrides: Partial<{
  speed: number; will: number; life: number; chargeRequirement: number;
  skills: { skillId: string; type: string; name: string; description: string }[];
}> = {}) {
  return {
    id, name: id, column: 0, source: 'builtin' as const, version: 1,
    speed: overrides.speed ?? 4, will: overrides.will ?? 7,
    life: overrides.life ?? 50, chargeRequirement: overrides.chargeRequirement ?? 4,
    diceDistribution: { 1: 'defense', 2: 'attack', 3: 'defense', 4: 'attack', 5: 'defense', 6: 'attack' },
    skills: overrides.skills ?? [],
    imageKey: id, isActive: false, chargeCount: 0, counters: {},
  };
}

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: 'p1', name: '测试',
    artifacts: [
      makeArtifact('c1', { speed: 4, will: 7 }),
      makeArtifact('c2'),
      makeArtifact('c3', { life: 50, chargeRequirement: 4 }),
    ],
    zone: { defense: [], attack: [], meditation: [] },
    speed: 4, will: 7, life: 50, attackBonus: 0,
    hasDustSeal: false, chargeCount: 4,
    ...overrides,
  };
}

describe('attributeCalculator', () => {
  describe('calcSpeed', () => {
    it('should return base speed from player.speed', () => {
      const player = makePlayer();
      expect(calcSpeed(player)).toBe(4);
    });

    it('should return stored speed value', () => {
      const player = makePlayer({ speed: 3 });
      expect(calcSpeed(player)).toBe(3);
    });

    it('should return stored speed when artifact[0] is null', () => {
      const player = makePlayer({ artifacts: [null, null, null] as any, speed: 4 });
      expect(calcSpeed(player)).toBe(4);
    });
  });

  describe('calcWill', () => {
    it('should return base will from player.will', () => {
      const player = makePlayer();
      expect(calcWill(player)).toBe(7);
    });

    it('should return stored will value', () => {
      const player = makePlayer({ will: 8 });
      expect(calcWill(player)).toBe(8);
    });
  });

  describe('calcAttackBonus', () => {
    it('should return stored attackBonus (base 0)', () => {
      const player = makePlayer();
      expect(calcAttackBonus(player)).toBe(0);
    });

    it('should return modified attackBonus', () => {
      const player = makePlayer({ attackBonus: 2 });
      expect(calcAttackBonus(player)).toBe(2);
    });
  });

  describe('calcMaxLife', () => {
    it('should return artifact[2].life as max life', () => {
      const player = makePlayer();
      expect(calcMaxLife(player)).toBe(50);
    });

    it('should return 50 as default when artifact[2] is null', () => {
      const player = makePlayer({ artifacts: [null, null, null] as any });
      expect(calcMaxLife(player)).toBe(50);
    });

    it('should return 40 for low-life artifact', () => {
      const player = makePlayer({
        artifacts: [
          makeArtifact('c1'),
          makeArtifact('c2'),
          makeArtifact('c3', { life: 40 }),
        ],
      });
      expect(calcMaxLife(player)).toBe(40);
    });

    it('should return 45 for medium-life artifact', () => {
      const player = makePlayer({
        artifacts: [
          makeArtifact('c1'),
          makeArtifact('c2'),
          makeArtifact('c3', { life: 45 }),
        ],
      });
      expect(calcMaxLife(player)).toBe(45);
    });
  });

  describe('calcAllStats', () => {
    it('should return all computed stats', () => {
      const player = makePlayer();
      const stats = calcAllStats(player);
      expect(stats).toEqual({
        speed: 4,
        will: 7,
        life: 50,
        maxLife: 50,
        attackBonus: 0,
      });
    });

    it('should handle modified attackBonus and partial life', () => {
      const player = makePlayer({ attackBonus: 3, life: 30 });
      const stats = calcAllStats(player);
      expect(stats.attackBonus).toBe(3);
      expect(stats.life).toBe(30);
      expect(stats.maxLife).toBe(50);
    });
  });
});
