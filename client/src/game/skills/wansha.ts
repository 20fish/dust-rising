/* ═══════════════════════════════════════════════════════════
 * 影（永暗之刃）— 完杀
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  gainDice,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';
import type { DiceValue } from '../../../../shared/types';

/* ── 完杀 ────────────────────────────────────────────────── */

/**
 * 灵噬消耗（充能；必杀）
 * 充能：获得1个点数等同充能层数的攻击骰。
 * 必杀：需要玩家选择攻击骰和计算X值，复杂交互。
 */
export const skillWanshaLingshixiaoshou: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const chargeCount = (self.artifacts[2]?.counters?.charge as number) ?? 0;

  if (chargeCount <= 0) {
    return cannotExecute('充能层数不足，无法充能');
  }

  const diceValue = Math.min(chargeCount, 6) as DiceValue;

  return canExecute(
    [
      gainDice('self', 'attack', 1, [diceValue]),
      msg(`灵噬消耗（充能）：获得1个点数${diceValue}的攻击骰`),
    ],
    undefined,
  );
};
