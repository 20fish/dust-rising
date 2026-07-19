import { describe, it, expect } from 'vitest';
import type { GameState } from '../../../../shared/types';
import {
  skillYuqieZhanji,
  skillJingangJingangShen,
  skillZuoleiLeiji,
  skillPoxiaoPoxiao,
  skillYinglueYingxi,
  skillYoumingMinghuo,
  skillGutaGuta,
  skillXielingZuzhou,
  skillAigeBeiming,
  skillDunwuDunwu,
  skillNisaZhiyu,
  skillHeiqiangHeiqiang,
} from '../skills';

function makeArtifact(id: string, skills: any[] = []) {
  return {
    id, name: id, column: 0, source: 'builtin' as const, version: 1,
    speed: 4, will: 7, life: 50, chargeRequirement: 4,
    diceDistribution: { 1: 'defense', 2: 'attack', 3: 'defense', 4: 'attack', 5: 'defense', 6: 'attack' },
    skills, imageKey: id, isActive: false, chargeCount: 0, counters: {},
  };
}

function createTestGame(overrides?: Partial<GameState>): GameState {
  const game: GameState = {
    player: {
      playerId: 'p1', name: '玩家',
      artifacts: [makeArtifact('a1'), null, makeArtifact('a3')],
      zone: {
        defense: [{ id: 'd1', type: 'defense', value: 3 }],
        attack: [{ id: 'atk1', type: 'attack', value: 5 }],
        meditation: [{ id: 'm1', type: 'meditation', value: 2 }, { id: 'm2', type: 'meditation', value: 4 }],
      },
      speed: 4, will: 7, life: 50, attackBonus: 0,
      hasDustSeal: false, chargeCount: 4,
    },
    opponent: {
      playerId: 'p2', name: '对手',
      artifacts: [makeArtifact('b1'), null, makeArtifact('b3')],
      zone: {
        defense: [{ id: 'd2', type: 'defense', value: 4 }],
        attack: [{ id: 'atk2', type: 'attack', value: 3 }],
        meditation: [],
      },
      speed: 4, will: 7, life: 50, attackBonus: 0,
      hasDustSeal: false, chargeCount: 4,
    },
    currentPlayerId: 'p1', phase: 'main', round: 1,
    dustFallCounter: 0, selectedDiceIds: [],
    isGameOver: false, winnerId: null,
  };
  return overrides ? { ...game, ...overrides } : game;
}

describe('重构后的技能返回 SkillExecutionResult', () => {
  describe('第1列 — 速度/意志', () => {
    it('skillYuqieZhanji: 消耗1冥想骰，bonusDamage +2', () => {
      const game = createTestGame();
      const result = skillYuqieZhanji(game, 'p1');
      expect(result.canExecute).toBe(true);
      expect(result.effects.some(e => e.type === 'removeDice')).toBe(true);
      expect(result.effects.some(e => e.type === 'bonusDamage')).toBe(true);
      const bd = result.effects.find(e => e.type === 'bonusDamage');
      expect(bd && 'delta' in bd && bd.delta).toBe(2);
    });

    it('skillYuqieZhanji: 无冥想骰时不可执行', () => {
      const game = createTestGame();
      game.player.zone.meditation = [];
      const result = skillYuqieZhanji(game, 'p1');
      expect(result.canExecute).toBe(false);
    });

    it('skillJingangJingangShen: 持续减伤1', () => {
      const game = createTestGame();
      const result = skillJingangJingangShen(game, 'p1');
      expect(result.canExecute).toBe(true);
      expect(result.effects.some(e => e.type === 'damageReduction')).toBe(true);
    });

    it('skillZuoleiLeiji: 消耗1冥想骰，bonusDamage +1', () => {
      const game = createTestGame();
      const result = skillZuoleiLeiji(game, 'p1');
      expect(result.canExecute).toBe(true);
      const bd = result.effects.find(e => e.type === 'bonusDamage');
      expect(bd && 'delta' in bd && bd.delta).toBe(1);
    });

    it('skillPoxiaoPoxiao: 消耗1冥想骰，ignoreDefense', () => {
      const game = createTestGame();
      const result = skillPoxiaoPoxiao(game, 'p1');
      expect(result.canExecute).toBe(true);
      expect(result.effects.some(e => e.type === 'ignoreDefense')).toBe(true);
    });
  });

  describe('第2列 — 骰点分布', () => {
    it('skillYinglueYingxi: 攻击命中 bonusDamage +1', () => {
      const game = createTestGame();
      const result = skillYinglueYingxi(game, 'p1');
      expect(result.canExecute).toBe(true);
      const bd = result.effects.find(e => e.type === 'bonusDamage');
      expect(bd && 'delta' in bd && bd.delta).toBe(1);
    });

    it('skillYoumingMinghuo: 消耗1冥想骰，attackBonus +2', () => {
      const game = createTestGame();
      const result = skillYoumingMinghuo(game, 'p1');
      expect(result.canExecute).toBe(true);
      expect(result.effects.some(e => e.type === 'modifyStat')).toBe(true);
    });

    it('skillGutaGuta: 持续减伤1', () => {
      const game = createTestGame();
      const result = skillGutaGuta(game, 'p1');
      expect(result.canExecute).toBe(true);
      expect(result.effects.some(e => e.type === 'damageReduction')).toBe(true);
    });

    it('skillXielingZuzhou: 尘落+1', () => {
      const game = createTestGame();
      const result = skillXielingZuzhou(game, 'p1');
      expect(result.canExecute).toBe(true);
      expect(result.effects.some(e => e.type === 'dustFall')).toBe(true);
    });
  });

  describe('第3列 — 生命/充能', () => {
    it('skillAigeBeiming: 充能满 damage 3', () => {
      const game = createTestGame();
      const result = skillAigeBeiming(game, 'p1');
      expect(result.canExecute).toBe(true);
      const dmg = result.effects.find(e => e.type === 'damage');
      expect(dmg && 'amount' in dmg && dmg.amount).toBe(3);
    });

    it('skillDunwuDunwu: 充能满 gainDice meditation 1', () => {
      const game = createTestGame();
      const result = skillDunwuDunwu(game, 'p1');
      expect(result.canExecute).toBe(true);
      expect(result.effects.some(e => e.type === 'gainDice')).toBe(true);
    });

    it('skillNisaZhiyu: 充能满 heal 3', () => {
      const game = createTestGame();
      const result = skillNisaZhiyu(game, 'p1');
      expect(result.canExecute).toBe(true);
      const h = result.effects.find(e => e.type === 'heal');
      expect(h && 'amount' in h && h.amount).toBe(3);
    });

    it('skillHeiqiangHeiqiang: 充能满 damage 5', () => {
      const game = createTestGame();
      const result = skillHeiqiangHeiqiang(game, 'p1');
      expect(result.canExecute).toBe(true);
      const dmg = result.effects.find(e => e.type === 'damage');
      expect(dmg && 'amount' in dmg && dmg.amount).toBe(5);
    });
  });
});
