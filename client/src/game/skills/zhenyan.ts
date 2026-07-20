/* ═══════════════════════════════════════════════════════════
 * 玛特（破晓之剑）— 真言
 * ═══════════════════════════════════════════════════════════ */

import type { DiceValue } from '../../../../shared/types';
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  changeDiceValue,
  heal,
  modifyStat,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 真言 ────────────────────────────────────────────────── */

/**
 * 权指（持续）
 * 速度+1。
 */
export const skillZhenyanQuanzhi: SkillFn = (_game, _selfId) => {
  return canExecute(
    [
      modifyStat('self', 'speed', 1),
      msg('权指（持续）：速度+1'),
    ],
    undefined,
  );
};

/**
 * 神圣干涉（激活）
 * 将你的最多3个能力骰改为随机点数，并将其移动至对应点数的区域。
 * 之后，回复3点生命。
 * 默认：从防御骰区取最多3个骰子，改为随机点数（1-6）。
 */
export const skillZhenyanShenshengganshe: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 优先从防御骰区取骰子
  const totalDice = self.zone.defense.length + self.zone.attack.length + self.zone.meditation.length;
  if (totalDice < 1) {
    return cannotExecute('神圣干涉：没有任何能力骰可改变');
  }

  const changeCount = Math.min(3, totalDice);

  // 随机生成新点数（1-6）
  const newValues: DiceValue[] = [];
  for (let i = 0; i < changeCount; i++) {
    newValues.push((Math.floor(Math.random() * 6) + 1) as DiceValue);
  }

  return canExecute(
    [
      changeDiceValue('self', 'defense', newValues[0] ?? 6 as DiceValue),
      changeDiceValue('self', 'attack', newValues[1] ?? 5 as DiceValue),
      changeDiceValue('self', 'meditation', newValues[2] ?? 4 as DiceValue),
      heal('self', 3),
      msg(`神圣干涉！将${changeCount}个能力骰改为随机点数，回复3点生命`),
    ],
    undefined,
  );
};