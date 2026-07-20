/* ═══════════════════════════════════════════════════════════
 * 艾娃 — 梦魇
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, bonusDamage, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 低语（触发）
 * 在你的主要阶段结束时。你可以移去1个能力骰。
 * 若如此做，本回合中，你的攻击伤害+1。
 */
export const skillMengyanDiyu: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  if (!event || event.type !== 'phaseEnd' || event.phase !== 'main' || event.playerId !== selfId) {
    return cannotExecute('低语：未满足触发条件（需要自身主要阶段结束时）');
  }

  // 移去1个能力骰，优先防御骰
  let removeZone: 'attack' | 'defense' | 'meditation';
  if (self.zone.defense.length > 0) {
    removeZone = 'defense';
  } else if (self.zone.attack.length > 0) {
    removeZone = 'attack';
  } else if (self.zone.meditation.length > 0) {
    removeZone = 'meditation';
  } else {
    return cannotExecute('低语：没有骰子可移去');
  }

  return canExecute([
    removeDice('self', removeZone, 1),
    bonusDamage(1),
    msg(`低语！移去1个${removeZone === 'attack' ? '攻击' : removeZone === 'defense' ? '防御' : '冥想'}骰，本回合攻击伤害+1`),
  ]);
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