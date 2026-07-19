import { describe, it, expect } from 'vitest';
import { executeEffects } from '../effectExecutor';
import type { GameState, PlayerState } from '../../../../shared/types';
import type { GameEffect } from '../../../../shared/effects';

function makeArtifact(id: string): PlayerState['artifacts'][0] {
  return {
    id, name: id, column: 0, source: 'builtin', version: 1,
    speed: 4, will: 7, life: 50, chargeRequirement: 4,
    diceDistribution: { 1: 'defense', 2: 'attack', 3: 'defense', 4: 'attack', 5: 'defense', 6: 'attack' },
    skills: [], imageKey: id, isActive: false, chargeCount: 0, counters: {},
  };
}

function createTestGame(): GameState {
  const player: PlayerState = {
    playerId: 'p1', name: '玩家',
    artifacts: [makeArtifact('a1'), null, null],
    zone: {
      defense: [{ id: 'd1', type: 'defense', value: 3 }],
      attack: [{ id: 'atk1', type: 'attack', value: 5 }],
      meditation: [{ id: 'm1', type: 'meditation', value: 2 }],
    },
    speed: 4, will: 7, life: 50, attackBonus: 0,
    hasDustSeal: false, chargeCount: 4,
  };
  const opponent: PlayerState = {
    ...player,
    playerId: 'p2', name: '对手',
    artifacts: [makeArtifact('b1'), null, null],
    zone: {
      defense: [{ id: 'd2', type: 'defense', value: 4 }],
      attack: [{ id: 'atk2', type: 'attack', value: 3 }],
      meditation: [],
    },
  };
  return {
    player, opponent,
    currentPlayerId: 'p1', phase: 'main', round: 1,
    dustFallCounter: 0, selectedDiceIds: [],
    isGameOver: false, winnerId: null,
  };
}

describe('EffectExecutor', () => {
  const selfId = 'p1';

  describe('damage', () => {
    it('should reduce opponent life by amount', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'damage', target: 'opponent', amount: 8 }], selfId);
      expect(result.opponent.life).toBe(42);
    });

    it('should not go below 0', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'damage', target: 'opponent', amount: 999 }], selfId);
      expect(result.opponent.life).toBe(0);
    });

    it('should damage self when target is self', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'damage', target: 'self', amount: 10 }], selfId);
      expect(result.player.life).toBe(40);
    });
  });

  describe('trueDamage', () => {
    it('should reduce opponent life', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'trueDamage', target: 'opponent', amount: 5 }], selfId);
      expect(result.opponent.life).toBe(45);
    });
  });

  describe('heal', () => {
    it('should restore self life', () => {
      const game = { ...createTestGame(), player: { ...createTestGame().player, life: 30 } };
      const result = executeEffects(game, [{ type: 'heal', target: 'self', amount: 10 }], selfId);
      expect(result.player.life).toBe(40);
    });

    it('should not exceed max life (50)', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'heal', target: 'self', amount: 999 }], selfId);
      expect(result.player.life).toBe(50);
    });
  });

  describe('gainDice', () => {
    it('should add random dice to self meditation zone', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'gainDice', target: 'self', zone: 'meditation', count: 2 }], selfId);
      expect(result.player.zone.meditation.length).toBe(3); // was 1
    });

    it('should add dice with specified values', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'gainDice', target: 'self', zone: 'attack', count: 2, values: [5, 6] }], selfId);
      expect(result.player.zone.attack.length).toBe(3);
      const vals = result.player.zone.attack.map(d => d.value);
      expect(vals).toContain(5);
      expect(vals).toContain(6);
    });
  });

  describe('removeDice', () => {
    it('should remove dice from opponent defense zone', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'removeDice', target: 'opponent', zone: 'defense', count: 1 }], selfId);
      expect(result.opponent.zone.defense.length).toBe(0);
    });

    it('should remove dice with maxValue filter', () => {
      const game = {
        ...createTestGame(),
        player: {
          ...createTestGame().player,
          zone: {
            defense: [
              { id: 'x1', type: 'defense', value: 2 },
              { id: 'x2', type: 'defense', value: 5 },
              { id: 'x3', type: 'defense', value: 1 },
            ],
            attack: [], meditation: [],
          },
        },
      };
      const result = executeEffects(game, [{ type: 'removeDice', target: 'self', zone: 'defense', count: 10, maxValue: 3 }], selfId);
      expect(result.player.zone.defense.length).toBe(1);
      expect(result.player.zone.defense[0].value).toBe(5);
    });

    it('should remove dice with exactValue filter', () => {
      const game = {
        ...createTestGame(),
        player: {
          ...createTestGame().player,
          zone: {
            defense: [
              { id: 'x1', type: 'defense', value: 2 },
              { id: 'x2', type: 'defense', value: 5 },
              { id: 'x3', type: 'defense', value: 2 },
            ],
            attack: [], meditation: [],
          },
        },
      };
      const result = executeEffects(game, [{ type: 'removeDice', target: 'self', zone: 'defense', count: 10, exactValue: 2 }], selfId);
      expect(result.player.zone.defense.length).toBe(1);
      expect(result.player.zone.defense[0].value).toBe(5);
    });
  });

  describe('moveDice', () => {
    it('should move dice from meditation to attack zone', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'moveDice', fromTarget: 'self', fromZone: 'meditation', toTarget: 'self', toZone: 'attack', count: 1 }], selfId);
      expect(result.player.zone.meditation.length).toBe(0);
      expect(result.player.zone.attack.length).toBe(2);
    });

    it('should move dice with new random value when keepValue is false', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'moveDice', fromTarget: 'self', fromZone: 'meditation', toTarget: 'self', toZone: 'attack', count: 1, keepValue: false }], selfId);
      expect(result.player.zone.meditation.length).toBe(0);
      expect(result.player.zone.attack.length).toBe(2);
      // 值在1-6之间
      const moved = result.player.zone.attack.find(d => d.id !== 'atk1');
      expect(moved!.value).toBeGreaterThanOrEqual(1);
      expect(moved!.value).toBeLessThanOrEqual(6);
    });
  });

  describe('changeDiceValue', () => {
    it('should change all dice in a zone', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'changeDiceValue', target: 'opponent', zone: 'defense', newValue: 1 }], selfId);
      expect(result.opponent.zone.defense[0].value).toBe(1);
    });

    it('should only change matching oldValue', () => {
      const game = {
        ...createTestGame(),
        player: {
          ...createTestGame().player,
          zone: {
            defense: [
              { id: 'x1', type: 'defense', value: 3 },
              { id: 'x2', type: 'defense', value: 5 },
            ],
            attack: [{ id: 'atk1', type: 'attack', value: 5 }],
            meditation: [],
          },
        },
      };
      const result = executeEffects(game, [{ type: 'changeDiceValue', target: 'self', zone: 'defense', newValue: 1, oldValue: 3 }], selfId);
      expect(result.player.zone.defense[0].value).toBe(1);
      expect(result.player.zone.defense[1].value).toBe(5); // unchanged
    });
  });

  describe('modifyStat', () => {
    it('should increase self speed', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'modifyStat', target: 'self', stat: 'speed', delta: 2 }], selfId);
      expect(result.player.speed).toBe(6);
    });

    it('should decrease opponent attackBonus', () => {
      const game = { ...createTestGame(), opponent: { ...createTestGame().opponent, attackBonus: 3 } };
      const result = executeEffects(game, [{ type: 'modifyStat', target: 'opponent', stat: 'attackBonus', delta: -1 }], selfId);
      expect(result.opponent.attackBonus).toBe(2);
    });
  });

  describe('dustFall', () => {
    it('should increase dustFallCounter', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'dustFall', delta: 1 }], selfId);
      expect(result.dustFallCounter).toBe(1);
    });
  });

  describe('setCounter', () => {
    it('should set counter on self artifact', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'setCounter', target: 'self', artifactIndex: 0, counter: 'stack', value: 3 }], selfId);
      expect(result.player.artifacts[0]?.counters?.stack).toBe(3);
    });

    it('should set counter on opponent artifact', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'setCounter', target: 'opponent', artifactIndex: 0, counter: 'blood', value: 5 }], selfId);
      expect(result.opponent.artifacts[0]?.counters?.blood).toBe(5);
    });
  });

  describe('message', () => {
    it('should collect messages in meta', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'message', text: 'hello' }, { type: 'message', text: 'world' }], selfId);
      expect(result._meta.messages).toEqual(['hello', 'world']);
    });
  });

  describe('bonusDamage / damageReduction / ignoreDefense', () => {
    it('should pass through without changing state', () => {
      const game = createTestGame();
      const result = executeEffects(game, [{ type: 'bonusDamage', delta: 5 }, { type: 'damageReduction', amount: 3 }, { type: 'ignoreDefense', apply: true }], selfId);
      expect(result.player.life).toBe(game.player.life);
      expect(result.opponent.life).toBe(game.opponent.life);
    });
  });

  describe('multiple effects', () => {
    it('should apply effects in order', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [
        { type: 'damage', target: 'opponent', amount: 10 },
        { type: 'heal', target: 'self', amount: 5 },
        { type: 'dustFall', delta: 1 },
      ];
      const result = executeEffects(game, effects, selfId);
      expect(result.opponent.life).toBe(40);
      expect(result.player.life).toBe(50); // already full
      expect(result.dustFallCounter).toBe(1);
    });
  });

  describe('immutability', () => {
    it('should not mutate the original game state', () => {
      const game = createTestGame();
      const originalLife = game.opponent.life;
      executeEffects(game, [{ type: 'damage', target: 'opponent', amount: 10 }], selfId);
      expect(game.opponent.life).toBe(originalLife);
    });
  });
});
