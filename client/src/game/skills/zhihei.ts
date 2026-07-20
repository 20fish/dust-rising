/* ═══════════════════════════════════════════════════════════
 * 修 — 至黑
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { message as msg, cannotExecute } from '../effects';

/**
 * 漆黑绽放（持续；必杀）
 * 持续：受伤后计数+1（最多5），达到5时必杀必定触发。
 * 必杀：复杂的多段效果（不可挡真实伤害、尘降、骰子操作等）。
 *
 * 持续部分需要受伤上下文来递增计数，必杀部分逻辑复杂，暂未实现。
 */
export const skillZhiheiQiheizhanfang: SkillFn = (_game, _selfId) => {
  return cannotExecute('漆黑绽放需要受伤上下文来递增计数，且必杀逻辑复杂，暂未实现');
};
