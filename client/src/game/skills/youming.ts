/* ═══════════════════════════════════════════════════════════
 * 修 — 幽冥
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { gainDice, removeDice, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 帷幕（触发）
 * 对方重掷阶段结束时，受到2点真实伤害并弃置对方1骰。
 *
 * 需要在对方重掷阶段结束时触发，暂未实现。
 */
export const skillYoumingWeimu: SkillFn = (_game, _selfId) => {
  return cannotExecute('帷幕需要在对方重掷阶段结束触发，暂未实现');
};

/**
 * 冥界行走（启动；持续）
 * 启动：消耗最多3个冥想骰，获得等量攻击骰。
 * 持续：攻击后根据攻击骰点数回血或受伤。
 *
 * 启动部分可实现，持续部分需要攻击上下文，暂未实现。
 */
export const skillYoumingMingjiexingzou: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const meditationCount = self.zone.meditation.length;

  if (meditationCount < 1) {
    return cannotExecute('冥想骰不足，至少需要1个');
  }

  // 启动：消耗最多3冥想，获得等量攻击
  const consumeCount = Math.min(3, meditationCount);
  return canExecute([
    removeDice('self', 'meditation', consumeCount),
    gainDice('self', 'attack', consumeCount),
    msg(`冥界行走！消耗${consumeCount}个冥想骰，获得${consumeCount}个攻击骰`),
  ], { meditation: consumeCount });
};
