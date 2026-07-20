/* ═══════════════════════════════════════════════════════════
 * 弥云 — 金刚
 * ═══════════════════════════════════════════════════════════ */

import type { DiceValue } from '../../../../shared/types';
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  gainDice,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';
import { takeFromPoolByCount } from '../dice';

/**
 * 破障（激活）
 * 从供应堆中拿取1个骰子，将其放置到你的对应区域。
 *
 * 根据点数：1-2防御 / 3-4攻击 / 5-6冥想
 */
export const skillJingangPozhang: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 激活：从供应堆取1个骰子
  if (!self.artifacts[0]?.isActive) {
    const { dice, pool } = takeFromPoolByCount(game.dicePool, 1);

    if (dice.length === 0) {
      return cannotExecute('破障：供应堆已空');
    }

    const die = dice[0];
    // 1-2防御 / 3-4攻击 / 5-6冥想
    const zone = die.value <= 2 ? 'defense' : die.value <= 4 ? 'attack' : 'meditation';

    // 更新 dicePool
    game.dicePool = pool;

    return canExecute(
      [
        gainDice('self', zone, 1, [die.value as DiceValue]),
        msg(`破障！从供应堆拿取${die.value}点骰子，放入${zone === 'attack' ? '攻击' : zone === 'defense' ? '防御' : '冥想'}骰区`),
      ],
      undefined,
    );
  }

  // 持续：纯规则效果，提示即可
  return canExecute([msg('破障：可将神器骰当作能力骰')]);
};

/**
 * 不动菩提（触发）
 * 当你受到攻击后。你可以从供应堆中拿取1个骰子，将其放置到你的对应区域。
 */
export const skillJingangBudongputi: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  // 触发：检查是否受到攻击
  if (!event || event.type !== 'attackResolved' || event.targetId !== selfId) {
    return cannotExecute('不动菩提：未满足触发条件（需要自身受到攻击后）');
  }

  const { dice, pool } = takeFromPoolByCount(game.dicePool, 1);

  if (dice.length === 0) {
    return cannotExecute('不动菩提：供应堆已空');
  }

  const die = dice[0];
  // 1-2防御 / 3-4攻击 / 5-6冥想
  const zone = die.value <= 2 ? 'defense' : die.value <= 4 ? 'attack' : 'meditation';

  // 更新 dicePool
  game.dicePool = pool;

  return canExecute(
    [
      gainDice('self', zone, 1, [die.value as DiceValue]),
      msg(`不动菩提！受到攻击后从供应堆拿取${die.value}点骰子，放入${zone === 'attack' ? '攻击' : zone === 'defense' ? '防御' : '冥想'}骰区`),
    ],
    undefined,
  );
};