/* ═══════════════════════════════════════════════════════════
 * 塔塔萝丝 — 深红
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 真实之剑（持续）
 * 纯规则修正 — "2个能力骰视为任意种类的1个"。
 * 这是一个纯被动规则提示，不需要产生实际 effect。
 */
export const skillShenhongZhenshizhijian: SkillFn = (_game, _selfId) => {
  return canExecute([
    msg('真实之剑：可将2个骰视为1个任意类型'),
  ]);
};

/**
 * 杀意（触发）
 * 当补充骰 ≤ 3 时，造成3真实伤害，回复2生命。
 * 需要在补骰阶段触发，当前无法在触发时获取补骰数量。
 */
export const skillShenhongShayi: SkillFn = (_game, _selfId) => {
  return cannotExecute('杀意需要在补骰阶段触发，暂未实现');
};
