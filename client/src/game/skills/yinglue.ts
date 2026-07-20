/* ═══════════════════════════════════════════════════════════
 * 影（永暗之刃）— 影掠
 * ═══════════════════════════════════════════════════════════ */

import type { DiceValue } from '../../../../shared/types';
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  gainDice,
  changeDiceValue,
  damage,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 影掠 ────────────────────────────────────────────────── */

/**
 * 影袭（启动）
 * 使你的1个能力骰点数下降X点（最低降为1），并根据新的点数，将其移动至对应的区域。
 * 视为以X点进行1次攻击。
 * 默认：从攻击骰区选第一个骰子，点数下降1，移动到对应区域，造成1点伤害。
 */
export const skillYinglueYingxi: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const attackCount = self.zone.attack.length;

  if (attackCount < 1) {
    return cannotExecute('影袭：攻击骰不足，至少需要1个');
  }

  // 默认选择第一个攻击骰，下降1点
  const die = self.zone.attack[0];
  const x = 1; // 默认下降1点
  const newValue = Math.max(1, die.value - x) as DiceValue;

  // 根据新点数确定目标区域（1-2=防御, 3-4=攻击, 5-6=冥想）
  let targetZone: 'attack' | 'defense' | 'meditation';
  if (newValue <= 2) {
    targetZone = 'defense';
  } else if (newValue <= 4) {
    targetZone = 'attack';
  } else {
    targetZone = 'meditation';
  }

  return canExecute(
    [
      removeDice('self', 'attack', 1, { exactValue: die.value }),
      changeDiceValue('self', targetZone, newValue),
      damage('opponent', x),
      msg(`影袭！将攻击骰[${die.value}]下降${x}点变为[${newValue}]，移至${targetZone === 'attack' ? '攻击' : targetZone === 'defense' ? '防御' : '冥想'}区，造成${x}点伤害`),
    ],
    { attack: 1 },
  );
};

/**
 * 潜行（启动）
 * 消耗2个攻击骰。获得2个随机防御骰和1个随机冥想骰。
 */
export const skillYinglueQianxing: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const attackCount = self.zone.attack.length;

  if (attackCount < 2) {
    return cannotExecute('攻击骰不足，至少需要2个');
  }

  return canExecute(
    [
      removeDice('self', 'attack', 2),
      gainDice('self', 'defense', 2),
      gainDice('self', 'meditation', 1),
      msg('潜行！消耗2个攻击骰，获得2个随机防御骰和1个随机冥想骰'),
    ],
    { attack: 2 },
  );
};