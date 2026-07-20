/* ═══════════════════════════════════════════════════════════
 * 尼萨 — 尘哀
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { cannotExecute } from '../effects';

/**
 * 尘起（触发）
 * 攻击造成伤害后，额外获得一次"尘起行动"。
 *
 * 需要额外行动系统，暂未实现。
 */
export const skillChenaiChenqi: SkillFn = (_game, _selfId) => {
  return cannotExecute('尘起需要额外行动系统，暂未实现');
};

/**
 * 蛮王之牙（启动）
 * 消耗X个不同种类的骰子，选择X项效果。
 *
 * 需要复杂玩家选择，暂未实现。
 */
export const skillChenaiManwangzhiya: SkillFn = (_game, _selfId) => {
  return cannotExecute('蛮王之牙需要复杂玩家选择，暂未实现');
};
