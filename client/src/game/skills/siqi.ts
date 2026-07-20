/* ═══════════════════════════════════════════════════════════
 * 希瓦 — 死契
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { cannotExecute } from '../effects';

/**
 * 填弹（启动）
 * 消耗最多6个骰子（2个以上需为顺点），计数+X（最多6）。
 *
 * 需要玩家选择骰子并验证顺点条件，暂未实现。
 */
export const skillSiqiTiandan: SkillFn = (_game, _selfId) => {
  return cannotExecute('填弹需要玩家选择骰子并验证顺点，暂未实现');
};

/**
 * 处刑通牒（触发）
 * 攻击时计数-1，选择①伤害+1不可挡或②伤害+5。
 *
 * 需要攻击上下文和玩家选择，暂未实现。
 */
export const skillSiqiChuxingtongdie: SkillFn = (_game, _selfId) => {
  return cannotExecute('处刑通牒需要攻击上下文和玩家选择，暂未实现');
};
