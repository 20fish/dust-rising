/* ═══════════════════════════════════════════════════════════
 * 尼萨 — 决意
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { trueDamage, setCounter, message as msg, canExecute } from '../effects';

/**
 * 野火燎原（激活；持续；充能）
 * 激活：受到8点真实伤害，计数+1。
 * 持续：根据计数提供各种效果（速度、伤害减免、攻击加成等）。
 * 充能：弃置1骰，计数+1。
 *
 * 激活部分可实现，持续/充能部分需要计数上下文，暂仅实现激活。
 */
export const skillJueyiYehuoliaoyuan: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const stack = self.artifacts[2]?.counters?.stack ?? 0;

  // 激活：受8真实伤害，计数+1
  const newStack = stack + 1;
  return canExecute([
    trueDamage('self', 8),
    setCounter('self', 2, 'stack', newStack),
    msg(`野火燎原激活！受到8点真实伤害，计数+1（当前=${newStack}）`),
  ], { life: 8 });
};
