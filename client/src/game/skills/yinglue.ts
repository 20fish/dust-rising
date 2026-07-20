/* ═══════════════════════════════════════════════════════════
 * 影（永暗之刃）— 影掠
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  gainDice,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 影掠 ────────────────────────────────────────────────── */

/**
 * 影袭（启动）
 * 需要玩家选择骰子和X值，复杂交互。
 */
export const skillYinglueYingxi: SkillFn = (_game, _selfId) => {
  return cannotExecute('需要玩家选择骰子和下降点数，暂未实现');
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
