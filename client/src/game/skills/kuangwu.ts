/* ═══════════════════════════════════════════════════════════
 * 希瓦 — 狂舞
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { cannotExecute } from '../effects';

/**
 * 凶弹夜舞（充能；必杀）
 * 充能：选择1个骰子移至另一区域。
 * 必杀：复杂的多段伤害与骰子操作效果。
 *
 * 充能部分需要玩家选择骰子和目标区域，必杀逻辑复杂，暂未实现。
 */
export const skillKuangwuXiongdanyewu: SkillFn = (_game, _selfId) => {
  return cannotExecute('凶弹夜舞充能需要玩家选择骰子和目标区域，必杀逻辑复杂，暂未实现');
};
