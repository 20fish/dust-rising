/* ═══════════════════════════════════════════════════════════
 * 李封（天殇的战鬼）— 屠虎
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import type { DiceValue } from '../../../../shared/effects';
import {
  bonusDamage,
  removeDice,
  message as msg,
  canExecute,
  cannotExecute,
} from '../effects';

/* ── 屠虎 ────────────────────────────────────────────────── */

/**
 * 齐袭（持续）
 * 纯规则修饰：攻击时，若使用多个攻击骰，每个额外的攻击骰+1伤害。
 * 不需要产生效果，仅作为规则说明。
 */
export const skillTuhuQixi: SkillFn = (_game, _selfId) => {
  return canExecute(
    [
      msg('齐袭（持续）：使用多个攻击骰攻击时，每个额外的攻击骰+1伤害'),
    ],
    undefined,
  );
};

/**
 * 横贯（持续；触发）
 * 持续：第二次攻击伤害+2。
 * 触发：每当你的攻击被抵挡后，弃置对方区域中1个点数小于该攻击的能力骰。
 */
export const skillTuhuHengguan: SkillFn = (game, selfId) => {
  const { opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 触发：攻击被抵挡后，弃置对方1个点数小于攻击骰点数的能力骰 ── */
  if (
    event &&
    event.type === 'attackResolved' &&
    event.playerId === selfId &&
    event.attackBlocked &&
    event.attackDiceValue != null
  ) {
    const attackValue = event.attackDiceValue;
    // 按攻击→防御→冥想顺序查找有低点数骰子的区域
    const zones = ['attack', 'defense', 'meditation'] as const;
    for (const zone of zones) {
      const hasLowValue = opponent.zone[zone].some((d) => d.value < attackValue);
      if (hasLowValue) {
        return canExecute([
          removeDice('opponent', zone, 1, { maxValue: (attackValue - 1) as DiceValue }),
          msg(`横贯·触发！弃置对方1个点数小于${attackValue}的${zone}骰`),
        ]);
      }
    }
    return cannotExecute('横贯·触发：对方没有点数小于攻击骰的能力骰');
  }

  /* ── 持续：第二次攻击伤害+2 ── */
  return canExecute([
    bonusDamage(2),
    msg('横贯（持续）：第二次攻击伤害+2'),
  ]);
};