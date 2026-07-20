/* ═══════════════════════════════════════════════════════════
 * 玛特（破晓之剑）— 救赎
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  gainDice,
  heal,
  setCounter,
  bonusDamage,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 救赎 ────────────────────────────────────────────────── */

/**
 * 幻灭飞升（持续；必杀）
 * 持续：双方第一次攻击+3。
 * 必杀：消耗4冥想骰，获得3攻击骰+3防御骰，回复10生命，失去持续效果。
 */
export const skillJiushuHuanyufeisheng: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const lostContinuous = (self.artifacts[2]?.counters?.lost_continuous as number) ?? 0;

  // 若已失去持续效果，持续部分不再生效
  if (lostContinuous > 0) {
    return cannotExecute('幻灭飞升的持续效果已失去');
  }

  // 必杀部分：消耗4个冥想骰
  const meditationCount = self.zone.meditation.length;
  if (meditationCount >= 4) {
    return canExecute(
      [
        removeDice('self', 'meditation', 4),
        gainDice('self', 'attack', 3),
        gainDice('self', 'defense', 3),
        heal('self', 10),
        setCounter('self', 2, 'lost_continuous', 1),
        msg('幻灭飞升（必杀）！消耗4冥想骰，获得3攻击骰+3防御骰，回复10点生命，持续效果已失去'),
      ],
      { meditation: 4 },
    );
  }

  // 持续效果：双方第一次攻击+3
  return canExecute(
    [
      bonusDamage(3),
      msg('幻灭飞升（持续）：双方第一次攻击+3'),
    ],
    undefined,
  );
};