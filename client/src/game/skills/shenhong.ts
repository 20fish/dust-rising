/* ═══════════════════════════════════════════════════════════
 * 塔塔萝丝 — 深红
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { trueDamage, heal, message as msg, cannotExecute, canExecute } from '../effects';

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
 * 当你在补充阶段补充的能力骰数量少于或等于3个时。
 * 你可以造成3点真实伤害，然后回复2点生命。
 */
export const skillShenhongShayi: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  if (!event || event.type !== 'replenishEnd' || event.playerId !== selfId) {
    return cannotExecute('杀意：未满足触发条件（需要自身补骰阶段结束时）');
  }

  // replenishDice 补充 speed 个骰子
  if (self.speed > 3) {
    return cannotExecute('杀意：补充骰数量超过3，无法触发');
  }

  return canExecute([
    trueDamage('opponent', 3),
    heal('self', 2),
    msg('杀意！造成3点真实伤害，回复2点生命'),
  ]);
};