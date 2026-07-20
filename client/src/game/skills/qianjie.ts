/* ═══════════════════════════════════════════════════════════
 * 弥云 — 千劫
 * ═══════════════════════════════════════════════════════════ */

import type { DiceValue } from '../../../../shared/types';
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { modifyStat, changeDiceValue, message as msg, canExecute, cannotExecute } from '../effects';

/**
 * 万丈明光（持续）
 * 速度+3，意志+2。
 * 主要阶段开始时弃置2骰（需要阶段上下文，暂不实现）。
 *
 * 当前仅返回属性加成效果。
 */
export const skillQianjieWanzhangmingguang: SkillFn = (_game, _selfId) => {
  return canExecute([
    modifyStat('self', 'speed', 3),
    modifyStat('self', 'will', 2),
    msg('万丈明光：速度+3，意志+2'),
  ]);
};

/**
 * 超度（激活）
 * 将你的2个任意能力骰点数变更为[6]。
 *
 * 默认：从攻击骰区取最多2个骰子，变更为6点。
 */
export const skillQianjieChaodu: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  if (self.zone.attack.length === 0) {
    return cannotExecute('超度：攻击骰区无骰子可变更');
  }

  const changeCount = Math.min(2, self.zone.attack.length);

  return canExecute(
    [
      changeDiceValue('self', 'attack', 6 as DiceValue),
      msg(`超度！将${changeCount}个攻击骰变更为[6]点`),
    ],
    undefined,
  );
};