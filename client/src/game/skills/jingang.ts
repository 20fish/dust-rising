/* ═══════════════════════════════════════════════════════════
 * 弥云 — 金刚
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { cannotExecute, canExecute, message as msg } from '../effects';

/**
 * 破障（激活；持续）
 * 激活：从供应堆取3个不同点数的骰子存放在神器上。
 * 持续：可将神器上的骰子当作自己的能力骰使用。
 *
 * 激活部分需要供应堆系统，暂未实现。
 * 持续部分为纯规则描述，无实际效果。
 */
export const skillJingangPozhang: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 激活：需要供应堆系统
  if (!self.artifacts[0]?.isActive) {
    return cannotExecute('破障需要供应堆系统，暂未实现');
  }

  // 持续：纯规则效果，提示即可
  return canExecute([msg('破障：可将神器骰当作能力骰')]);
};

/**
 * 不动菩提（激活；触发）
 * 激活：同破障，从供应堆取3个不同点数的骰子存放在神器上。
 * 触发：对方使用防御/攻击骰后，移除神器上同点骰取消效果。
 *
 * 激活部分需要供应堆系统，触发部分需要攻击上下文，暂未实现。
 */
export const skillJingangBudongputi: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 激活：需要供应堆系统
  if (!self.artifacts[0]?.isActive) {
    return cannotExecute('不动菩提需要供应堆系统，暂未实现');
  }

  // 触发部分需要攻击上下文
  return cannotExecute('不动菩提的触发效果需要攻击上下文，暂未实现');
};
