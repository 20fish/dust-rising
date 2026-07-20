/* ═══════════════════════════════════════════════════════════
 * 艾娃 — 梦魇
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, bonusDamage, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 低语（持续）
 * 主要阶段结束时获得骰子，需要玩家宣称类型。
 * 需要阶段结束触发和玩家选择，暂未实现。
 */
export const skillMengyanDiyu: SkillFn = (_game, _selfId) => {
  return cannotExecute('低语需要玩家选择类型和阶段结束触发，暂未实现');
};

/**
 * 恶意（启动；持续）
 * 启动：消耗1个攻击骰，获得2个冥想骰。
 * 持续：攻击伤害 + 冥想骰数 / 2（向下取整）。
 */
export const skillMengyanEyi: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const attackCount = self.zone.attack.length;

  if (attackCount < 1) {
    return cannotExecute('攻击骰不足，至少需要1个');
  }

  const meditationCount = self.zone.meditation.length;
  const dmgBonus = Math.floor(meditationCount / 2);

  return canExecute(
    [
      removeDice('self', 'attack', 1),
      gainDice('self', 'meditation', 2),
      bonusDamage(dmgBonus),
      msg(
        `恶意！消耗1个攻击骰获得2个冥想骰，` +
        `攻击伤害+${dmgBonus}（冥想骰${meditationCount}个）`,
      ),
    ],
    { attack: 1 },
  );
};
