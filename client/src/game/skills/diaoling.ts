/* ═══════════════════════════════════════════════════════════
 * 艾娃 — 凋零
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { message as msg, cannotExecute } from '../effects';

/**
 * 死亡亦逝（充能；持续）
 * 充能：对方生命值个位归零，自己回复至个位归零。
 * 持续：回合结束时弃置骰子。
 * 需要复杂的生命值取整逻辑和回合结束触发，暂未实现。
 */
export const skillDiaolingSiwangyishi: SkillFn = (_game, _selfId) => {
  return cannotExecute('死亡亦逝需要复杂的生命值取整逻辑，暂未实现');
};
