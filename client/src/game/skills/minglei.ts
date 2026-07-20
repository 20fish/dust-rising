/* ═══════════════════════════════════════════════════════════
 * 佐雷 — 鸣雷
 * ═══════════════════════════════════════════════════════════ */

import type { DiceValue } from '../../../../shared/types';
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  changeDiceValue,
  removeDice,
  bonusDamage,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/**
 * 电刑（触发）
 * 当你使用攻击骰造成伤害后。你可以选择1个对方的防御骰，
 * 将其点数变更等同于你使用的攻击骰点数。
 */
export const skillMingleiDianxing: SkillFn = (game, selfId) => {
  const event = game.lastEvent;

  if (!event || event.type !== 'attackResolved' || event.playerId !== selfId) {
    return cannotExecute('电刑：未满足触发条件（需要自身攻击造成伤害后）');
  }

  if (!event.attackDamage || event.attackDamage <= 0) {
    return cannotExecute('电刑：本次攻击未造成伤害');
  }

  const attackDiceValue = event.attackDiceValue;
  if (attackDiceValue === undefined) {
    return cannotExecute('电刑：无法获取攻击骰点数');
  }

  return canExecute(
    [
      changeDiceValue('opponent', 'defense', attackDiceValue as DiceValue),
      msg(`电刑！将对方1个防御骰变更为${attackDiceValue}点`),
    ],
    undefined,
  );
};

/**
 * 雷暴（触发）
 * 在你的回合的结束阶段中。你可以弃置你的1个攻击骰。
 * 若如此做，直到你的下个回合开始，你的攻击伤害+3。
 */
export const skillMingleiLeibao: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  if (!event || event.type !== 'phaseEnd' || event.phase !== 'end' || event.playerId !== selfId) {
    return cannotExecute('雷暴：未满足触发条件（需要自身回合结束阶段）');
  }

  if (self.zone.attack.length === 0) {
    return cannotExecute('雷暴：攻击骰区无骰子可弃置');
  }

  return canExecute(
    [
      removeDice('self', 'attack', 1),
      bonusDamage(3),
      msg('雷暴！弃置1个攻击骰，攻击伤害+3'),
    ],
    { attack: 1 },
  );
};