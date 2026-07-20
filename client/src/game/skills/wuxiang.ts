/* ═══════════════════════════════════════════════════════════
 * 弥云 — 无相
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { cannotExecute } from '../effects';

/**
 * 万象俱灭（充能；必杀）
 * 充能：弃置1骰，回复3点生命。
 * 必杀：复杂的多段清除与伤害效果。
 *
 * 充能部分需要玩家选择弃置骰子，必杀逻辑复杂，暂未实现。
 */
export const skillWuxiangWanxiangjumie: SkillFn = (_game, _selfId) => {
  return cannotExecute('万象俱灭充能需要玩家选择弃置骰子，必杀逻辑复杂，暂未实现');
};
