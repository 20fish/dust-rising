import { describe, it, expect } from 'vitest';
import type { GameState, PlayerState } from '../../../../shared/types';
import {
  replenishDice,
  tickCharge,
  checkOnCharge,
} from '../engine';

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

function makePlayer(id: string = 'p1', overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: id, name: id,
    artifacts: [
      makeArtifact('c1', { speed: 4, will: 7 }),
      makeArtifact('c2'),
      makeArtifact('c3', { life: 50, chargeRequirement: 4 }),
    ],
    zone: { defense: [{ id: 'd1', type: 'defense', value: 3 }], attack: [{ id: 'a1', type: 'attack', value: 5 }], meditation: [] },
    speed: 4, will: 7, life: 50, attackBonus: 0,
    hasDustSeal: false, chargeCount: 0,
    ...overrides,
  };
}

describe('roundFlow — replenishDice', () => {
  it('should add dice up to will when zone is empty', () => {
    const player = makePlayer('p1', {
      zone: { defense: [], attack: [], meditation: [] },
    });
    const newPlayer = replenishDice(player);
    const totalDice = newPlayer.zone.defense.length + newPlayer.zone.attack.length + newPlayer.zone.meditation.length;
    expect(totalDice).toBe(7);
  });

  it('should not add dice when zone already has enough', () => {
    const player = makePlayer('p1', {
      will: 3,
      zone: {
        defense: [{ id: 'd1', type: 'defense', value: 3 }],
        attack: [{ id: 'a1', type: 'attack', value: 5 }],
        meditation: [{ id: 'm1', type: 'meditation', value: 2 }],
      },
    });
    const newPlayer = replenishDice(player);
    const totalDice = newPlayer.zone.defense.length + newPlayer.zone.attack.length + newPlayer.zone.meditation.length;
    expect(totalDice).toBe(3);
  });

  it('should add only missing dice count', () => {
    const player = makePlayer('p1', {
      will: 7,
      zone: { defense: [{ id: 'd1', type: 'defense', value: 3 }], attack: [], meditation: [] },
    });
    const newPlayer = replenishDice(player);
    const totalDice = newPlayer.zone.defense.length + newPlayer.zone.attack.length + newPlayer.zone.meditation.length;
    expect(totalDice).toBe(7);
  });
});

describe('roundFlow — tickCharge', () => {
  it('should increment artifact[2].chargeCount by 1', () => {
    const player = makePlayer('p1', {
      artifacts: [
        makeArtifact('c1'),
        makeArtifact('c2'),
        makeArtifact('c3', { chargeRequirement: 3 }),
      ],
    });
    const result = tickCharge(player);
    expect(result.player.artifacts[2]!.chargeCount).toBe(1);
    expect(result.isCharged).toBe(false);
  });

  it('should increment again on second call', () => {
    const player = makePlayer('p1', {
      artifacts: [
        makeArtifact('c1'),
        makeArtifact('c2'),
        makeArtifact('c3', { chargeRequirement: 3 }),
      ],
    });
    let p = tickCharge(player).player;
    p = tickCharge(p).player;
    expect(p.artifacts[2]!.chargeCount).toBe(2);
  });

  it('should return isCharged=true when reaching chargeRequirement', () => {
    const player = makePlayer('p1', {
      artifacts: [
        makeArtifact('c1'),
        makeArtifact('c2'),
        makeArtifact('c3', { chargeRequirement: 2 }),
      ],
    });
    const r1 = tickCharge(player);
    expect(r1.player.artifacts[2]!.chargeCount).toBe(1);
    expect(r1.isCharged).toBe(false);

    const r2 = tickCharge(r1.player);
    expect(r2.player.artifacts[2]!.chargeCount).toBe(2);
    expect(r2.isCharged).toBe(true);
  });

  it('should handle missing artifact[2] gracefully', () => {
    const player = makePlayer('p1', { artifacts: [makeArtifact('c1'), makeArtifact('c2'), null] });
    const result = tickCharge(player);
    expect(result.isCharged).toBe(false);
  });
});

describe('roundFlow — checkOnCharge', () => {
  it('should return charged artifact when chargeCount >= chargeRequirement', () => {
    const artifact = makeArtifact('c3', {
      chargeRequirement: 2,
      skills: [{ skillId: 'test_skill', type: 'onCharge', name: '测试充能', description: '' }],
    });
    artifact.chargeCount = 2;
    const player = makePlayer('p1', {
      artifacts: [makeArtifact('c1'), makeArtifact('c2'), artifact],
    });
    const charged = checkOnCharge(player);
    expect(charged).not.toBeNull();
    expect(charged!.artifactIndex).toBe(2);
  });

  it('should return null when not charged', () => {
    const player = makePlayer('p1');
    const charged = checkOnCharge(player);
    expect(charged).toBeNull();
  });

  it('should return null when artifact[2] is null', () => {
    const player = makePlayer('p1', { artifacts: [makeArtifact('c1'), makeArtifact('c2'), null] });
    const charged = checkOnCharge(player);
    expect(charged).toBeNull();
  });
});
