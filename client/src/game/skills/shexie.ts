/* ═══════════════════════════════════════════════════════════
 * 希瓦 — 蛇蝎
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { cannotExecute } from '../effects';

/**
 * 畏惧（启动）
 * 消耗1个骰子，对方也消耗1个骰子，比大小决定效果。
 *
 * 需要双方各选择骰子并比较，暂未实现。
 */
export const skillShexieWeiju: SkillFn = (_game, _selfId) => {
  return cannotExecute('畏惧需要双方各选择骰子并比较，暂未实现');
};

/**
 * 共振（启动）
 * 重掷1个骰子，按新点数移动骰子，然后选择①或②效果。
 *
 * 需要玩家选择骰子和效果，暂未实现。
 */
export const skillShexieGongzhen: SkillFn = (_game, _selfId) => {
  return cannotExecute('共振需要玩家选择骰子和效果，暂未实现');
};
