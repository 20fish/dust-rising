/* ═══════════════════════════════════════════════════════════
 * 巴顿二世 — 孤王
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { changeDiceValue, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 高塔铁幕（触发；充能；必杀）
 * 触发：受到真实伤害时消耗1防御骰取消伤害。
 * 充能：将对方1个攻击骰改为[1]。
 * 必杀：需要复杂交互选择，暂未实现。
 *
 * 当前实现充能效果；触发和必杀需要特定上下文。
 */
export const skillGuwangGaotatiemu: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);

  // 充能效果：将对方1个攻击骰改为[1]
  if (opponent.zone.attack.length < 1) {
    return cannotExecute('对方没有攻击骰可修改');
  }

  return canExecute([
    changeDiceValue('opponent', 'attack', 1),
    msg('高塔铁幕·充能：将对方1个攻击骰改为[1]'),
  ]);
};
