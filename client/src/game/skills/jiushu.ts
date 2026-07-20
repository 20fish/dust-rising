/* ═══════════════════════════════════════════════════════════
 * 玛特（破晓之剑）— 救赎
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
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

  // 持续效果：双方第一次攻击+3
  return canExecute(
    [
      bonusDamage(3),
      msg('幻灭飞升（持续）：双方第一次攻击+3'),
    ],
    undefined,
  );
};
