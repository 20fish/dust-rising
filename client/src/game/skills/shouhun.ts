/* ═══════════════════════════════════════════════════════════
 * 尼萨 — 兽魂
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { bonusDamage, modifyStat, message as msg, canExecute, cannotExecute } from '../effects';

/**
 * 雄之心（激活；持续）
 * 激活：计数重设为2。
 * 持续：攻击伤害+X（X=当前计数）。
 *
 * 激活部分设置计数，持续部分提供伤害加成。
 */
export const skillShouhunXiongzhixin: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const stack = self.artifacts[1]?.counters?.stack ?? 0;

  // 激活：计数重设为2
  if (!self.artifacts[1]?.isActive) {
    return cannotExecute('雄之心需要激活后才能使用持续效果');
  }

  // 持续：攻击伤害+X（X=计数）
  return canExecute([
    bonusDamage(stack),
    msg(`雄之心：攻击伤害+${stack}（计数=${stack}）`),
  ]);
};

/**
 * 狼之血（激活；持续）
 * 激活：计数重设为2。
 * 持续：速度+X（X=当前计数）。
 *
 * 激活部分设置计数，持续部分提供速度加成。
 */
export const skillShouhunLangzhixue: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const stack = self.artifacts[1]?.counters?.stack ?? 0;

  // 激活：计数重设为2
  if (!self.artifacts[1]?.isActive) {
    return cannotExecute('狼之血需要激活后才能使用持续效果');
  }

  // 持续：速度+X（X=计数）
  return canExecute([
    modifyStat('self', 'speed', stack),
    msg(`狼之血：速度+${stack}（计数=${stack}）`),
  ]);
};
