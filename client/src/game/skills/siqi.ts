/* ═══════════════════════════════════════════════════════════
 * 希瓦 — 死契
 * ═══════════════════════════════════════════════════════════ */

import type { DiceValue } from '../../../../shared/types';
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  moveDice,
  changeDiceValue,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/**
 * 填弹（启动）
 * 选择你的1个能力骰。若其点数与你的防御骰区中的1个骰子点数相同，
 * 将其移动至攻击骰区。
 *
 * 默认：从防御骰区取第一个骰子，检查攻击骰区是否有同点数骰子，
 * 有则移动到攻击骰区。
 */
export const skillSiqiTiandan: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  if (self.zone.defense.length === 0) {
    return cannotExecute('填弹：防御骰区无骰子');
  }

  const defDie = self.zone.defense[0];
  const hasMatch = self.zone.attack.some(d => d.value === defDie.value);

  if (!hasMatch) {
    return cannotExecute(`填弹：攻击骰区无${defDie.value}点骰子匹配`);
  }

  return canExecute(
    [
      moveDice('self', 'defense', 'self', 'attack', 1, true),
      msg(`填弹！将${defDie.value}点防御骰移至攻击骰区`),
    ],
    undefined,
  );
};

/**
 * 处刑通牒（触发）
 * 当你使用攻击骰造成伤害后。你可以令该攻击骰的点数+1。
 */
export const skillSiqiChuxingtongdie: SkillFn = (game, selfId) => {
  const event = game.lastEvent;

  if (!event || event.type !== 'attackResolved' || event.playerId !== selfId) {
    return cannotExecute('处刑通牒：未满足触发条件（需要自身攻击造成伤害后）');
  }

  if (!event.attackDamage || event.attackDamage <= 0) {
    return cannotExecute('处刑通牒：本次攻击未造成伤害');
  }

  const attackValue = event.attackDiceValue;
  if (attackValue === undefined || attackValue >= 6) {
    return cannotExecute('处刑通牒：攻击骰点数已达上限（6点）');
  }

  const newValue = (attackValue + 1) as DiceValue;
  const oldValue = attackValue as DiceValue;

  return canExecute(
    [
      changeDiceValue('self', 'attack', newValue, oldValue),
      msg(`处刑通牒！攻击骰点数从${oldValue}提升至${newValue}`),
    ],
    undefined,
  );
};