/* ═══════════════════════════════════════════════════════════
 * 塔塔萝丝 — 顿悟
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 灵能屏障（启动；触发）
 * 启动：消耗最多3个防御骰，获得2倍数量的冥想骰。
 * 触发：需要攻击上下文，暂未实现。
 */
export const skillDunwuLingnengpingzhang: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const defenseCount = self.zone.defense.length;

  if (defenseCount < 1) {
    return cannotExecute('防御骰不足，至少需要1个');
  }

  const consumeCount = Math.min(3, defenseCount);
  return canExecute(
    [
      removeDice('self', 'defense', consumeCount),
      gainDice('self', 'meditation', consumeCount * 2),
      msg(`灵能屏障！消耗${consumeCount}个防御骰，获得${consumeCount * 2}个冥想骰`),
    ],
    { defense: consumeCount },
  );
};

/**
 * 灵能脉冲（启动；触发）
 * 启动：消耗最多3个攻击骰，获得2倍数量的冥想骰。
 * 触发：需要技能消耗上下文，暂未实现。
 */
export const skillDunwuLingnengmaichong: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const attackCount = self.zone.attack.length;

  if (attackCount < 1) {
    return cannotExecute('攻击骰不足，至少需要1个');
  }

  const consumeCount = Math.min(3, attackCount);
  return canExecute(
    [
      removeDice('self', 'attack', consumeCount),
      gainDice('self', 'meditation', consumeCount * 2),
      msg(`灵能脉冲！消耗${consumeCount}个攻击骰，获得${consumeCount * 2}个冥想骰`),
    ],
    { attack: consumeCount },
  );
};
