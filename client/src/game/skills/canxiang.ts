/* ═══════════════════════════════════════════════════════════
 * 佐雷 — 残响
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { modifyStat, bonusDamage, message as msg, canExecute } from '../effects';

/**
 * 绝境天神（持续；必杀）
 * 持续：意志+1，攻击伤害+X（X=计数）。回合结束计数-1。
 * 必杀：生命每低10点计数+1（最多4）。
 *
 * 持续部分：返回意志+1和伤害加成（回合结束-1需要阶段上下文，暂不实现）。
 * 必杀部分：根据已损失生命计算计数。
 */
export const skillCanxiangJuejingtianshen: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const stack = self.artifacts[2]?.counters?.stack ?? 0;

  // 持续：意志+1，攻击伤害+X
  // 回合结束计数-1 需要阶段上下文，暂不实现
  return canExecute([
    modifyStat('self', 'will', 1),
    bonusDamage(stack),
    msg(`绝境天神：意志+1，攻击伤害+${stack}（计数=${stack}）`),
  ]);
};
