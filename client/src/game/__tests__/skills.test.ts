import { describe, it, expect } from 'vitest';
import type { GameState } from '../../../../shared/types';
import { skillYuqieZhongyangTupo, skillYuqieCaiyuliu } from '../skills/yuqie';
import { SKILL_REGISTRY, getSkillFn } from '../skills';

/* ── 测试辅助 ── */

function makeArtifact(id: string, skills: any[] = []) {
  return {
    id, name: id, column: 0 as const, source: 'builtin' as const, version: 1,
    speed: 4, will: 7, life: 50, chargeRequirement: 4,
    diceDistribution: {} as any,
    skills, imageKey: id, isActive: false, chargeCount: 0, counters: {},
  };
}

function makeMeditationDice(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `med${i}`, type: 'meditation' as const, value: (i % 6 + 1) as 1 | 2 | 3 | 4 | 5 | 6,
  }));
}

function makeDefenseDice(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `def${i}`, type: 'defense' as const, value: (i % 6 + 1) as 1 | 2 | 3 | 4 | 5 | 6,
  }));
}

function createTestGame(overrides?: {
  selfMeditation?: number;
  opponentDefense?: number;
  selfId?: string;
}): GameState {
  const selfId = overrides?.selfId ?? 'p1';
  const opponentId = selfId === 'p1' ? 'p2' : 'p1';
  const selfMeditation = makeMeditationDice(overrides?.selfMeditation ?? 3);
  const opponentDefense = makeDefenseDice(overrides?.opponentDefense ?? 5);

  const self: GameState['player'] = {
    playerId: selfId, name: '玩家',
    artifacts: [
      makeArtifact('yuqie', [
        { skillId: 'yuqie_zhongyangtupo', name: '中央突破', type: '启动', description: '' },
        { skillId: 'yuqie_caiyuliu', name: '裁雨流', type: '触发', description: '' },
      ]),
      null,
      makeArtifact('mingjing'),
    ],
    zone: { defense: [], attack: [], meditation: selfMeditation },
    speed: 4, will: 7, life: 50, attackBonus: 0,
    hasDustSeal: false, chargeCount: 0,
  };

  const opponent: GameState['opponent'] = {
    playerId: opponentId, name: '对手',
    artifacts: [makeArtifact('b1'), null, makeArtifact('b3')],
    zone: { defense: opponentDefense, attack: [], meditation: [] },
    speed: 4, will: 7, life: 50, attackBonus: 0,
    hasDustSeal: false, chargeCount: 0,
  };

  return selfId === 'p1'
    ? { player: self, opponent: opponent as any, currentPlayerId: 'p1', phase: 'main', round: 1, dustFallCounter: 0, selectedDiceIds: [], isGameOver: false, winnerId: null }
    : { player: opponent as any, opponent: self, currentPlayerId: 'p2', phase: 'main', round: 1, dustFallCounter: 0, selectedDiceIds: [], isGameOver: false, winnerId: null };
}

/* ═══════════════════════════════════════════════════════════
 *  中央突破（启动）
 * ═══════════════════════════════════════════════════════════ */

describe('雨切 · 中央突破（启动）', () => {
  it('有3个冥想骰时：消耗3个，弃置3个防御骰，ignoreDefense', () => {
    const game = createTestGame({ selfMeditation: 3, opponentDefense: 5 });
    const result = skillYuqieZhongyangTupo(game, 'p1');

    expect(result.canExecute).toBe(true);
    expect(result.cost?.meditation).toBe(3);

    const removeSelf = result.effects.find(e => e.type === 'removeDice' && e.target === 'self');
    expect(removeSelf).toBeDefined();
    expect(removeSelf && 'count' in removeSelf && removeSelf.count).toBe(3);
    expect(removeSelf && 'zone' in removeSelf && removeSelf.zone).toBe('meditation');

    const removeOpponent = result.effects.find(e => e.type === 'removeDice' && e.target === 'opponent');
    expect(removeOpponent).toBeDefined();
    expect(removeOpponent && 'count' in removeOpponent && removeOpponent.count).toBe(3);
    expect(removeOpponent && 'zone' in removeOpponent && removeOpponent.zone).toBe('defense');

    const ignore = result.effects.find(e => e.type === 'ignoreDefense');
    expect(ignore).toBeDefined();
  });

  it('有2个冥想骰时：消耗2个，弃置2个防御骰，无ignoreDefense', () => {
    const game = createTestGame({ selfMeditation: 2, opponentDefense: 5 });
    const result = skillYuqieZhongyangTupo(game, 'p1');

    expect(result.canExecute).toBe(true);
    expect(result.cost?.meditation).toBe(2);

    const removeSelf = result.effects.find(e => e.type === 'removeDice' && e.target === 'self');
    expect(removeSelf && 'count' in removeSelf && removeSelf.count).toBe(2);

    const removeOpponent = result.effects.find(e => e.type === 'removeDice' && e.target === 'opponent');
    expect(removeOpponent && 'count' in removeOpponent && removeOpponent.count).toBe(2);

    const ignore = result.effects.find(e => e.type === 'ignoreDefense');
    expect(ignore).toBeUndefined();
  });

  it('有1个冥想骰时：消耗1个，弃置1个防御骰', () => {
    const game = createTestGame({ selfMeditation: 1, opponentDefense: 5 });
    const result = skillYuqieZhongyangTupo(game, 'p1');

    expect(result.canExecute).toBe(true);
    expect(result.cost?.meditation).toBe(1);

    const removeSelf = result.effects.find(e => e.type === 'removeDice' && e.target === 'self');
    expect(removeSelf && 'count' in removeSelf && removeSelf.count).toBe(1);
  });

  it('有5个冥想骰时：最多消耗3个（上限）', () => {
    const game = createTestGame({ selfMeditation: 5, opponentDefense: 5 });
    const result = skillYuqieZhongyangTupo(game, 'p1');

    expect(result.canExecute).toBe(true);
    expect(result.cost?.meditation).toBe(3);

    const removeSelf = result.effects.find(e => e.type === 'removeDice' && e.target === 'self');
    expect(removeSelf && 'count' in removeSelf && removeSelf.count).toBe(3);
  });

  it('无冥想骰时不可执行', () => {
    const game = createTestGame({ selfMeditation: 0 });
    const result = skillYuqieZhongyangTupo(game, 'p1');

    expect(result.canExecute).toBe(false);
    expect(result.reason).toContain('冥想骰不足');
  });

  it('对手无防御骰时仍可执行（弃置0个）', () => {
    const game = createTestGame({ selfMeditation: 2, opponentDefense: 0 });
    const result = skillYuqieZhongyangTupo(game, 'p1');

    expect(result.canExecute).toBe(true);
    expect(result.cost?.meditation).toBe(2);
    // 移除自身冥想骰
    const removeSelf = result.effects.find(e => e.type === 'removeDice' && e.target === 'self');
    expect(removeSelf && 'count' in removeSelf && removeSelf.count).toBe(2);
  });

  it('对手视角（selfId=p2）也能正确工作', () => {
    const game = createTestGame({ selfMeditation: 3, opponentDefense: 5, selfId: 'p2' });
    const result = skillYuqieZhongyangTupo(game, 'p2');

    expect(result.canExecute).toBe(true);
    expect(result.cost?.meditation).toBe(3);

    const removeSelf = result.effects.find(e => e.type === 'removeDice' && e.target === 'self');
    expect(removeSelf).toBeDefined();
    expect(removeSelf && 'zone' in removeSelf && removeSelf.zone).toBe('meditation');
  });

  it('包含 message 效果', () => {
    const game = createTestGame({ selfMeditation: 3 });
    const result = skillYuqieZhongyangTupo(game, 'p1');

    const message = result.effects.find(e => e.type === 'message');
    expect(message).toBeDefined();
    expect(message && 'text' in message && message.text).toContain('中央突破');
  });
});

/* ═══════════════════════════════════════════════════════════
 *  裁雨流（触发）
 * ═══════════════════════════════════════════════════════════ */

describe('雨切 · 裁雨流（触发）', () => {
  it('当前暂未实现交互，返回 cannotExecute', () => {
    const game = createTestGame({ selfMeditation: 3 });
    const result = skillYuqieCaiyuliu(game, 'p1');

    expect(result.canExecute).toBe(false);
    expect(result.reason).toContain('暂未实现');
  });
});

/* ═══════════════════════════════════════════════════════════
 *  SKILL_REGISTRY 注册验证
 * ═══════════════════════════════════════════════════════════ */

describe('SKILL_REGISTRY 注册验证', () => {
  it('yuqie_zhongyangtupo 已注册', () => {
    expect(SKILL_REGISTRY['yuqie_zhongyangtupo']).toBeDefined();
    expect(getSkillFn('yuqie_zhongyangtupo')).toBe(skillYuqieZhongyangTupo);
  });

  it('yuqie_caiyuliu 已注册', () => {
    expect(SKILL_REGISTRY['yuqie_caiyuliu']).toBeDefined();
    expect(getSkillFn('yuqie_caiyuliu')).toBe(skillYuqieCaiyuliu);
  });
});
