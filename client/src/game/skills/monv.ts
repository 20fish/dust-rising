/* ═══════════════════════════════════════════════════════════
 * 塔塔萝丝 — 魔女
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { modifyStat, moveDice, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 梦醒时分（持续；必杀）
 * 持续：意志+1，速度+X（X为冥想骰数量，上限3）。
 * 必杀：将你的最多3个冥想骰移动至你的另一个区域，并保留其原本的点数。
 */
export const skillMonvMengxingshifen: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const meditationCount = self.zone.meditation.length;

  /* ── 必杀：移动最多3个冥想骰到攻击骰区（保留点数） ── */
  if (meditationCount >= 1) {
    const moveCount = Math.min(3, meditationCount);
    return canExecute([
      moveDice('self', 'meditation', 'self', 'attack', moveCount, true),
      modifyStat('self', 'will', 1),
      modifyStat('self', 'speed', Math.min(3, meditationCount)),
      msg(`梦醒时分·必杀！移动${moveCount}个冥想骰到攻击骰区（保留点数），意志+1，速度+${Math.min(3, meditationCount)}`),
    ]);
  }

  /* ── 持续：意志+1，速度+冥想骰数（上限3） ── */
  const speedBonus = Math.min(3, meditationCount);

  return canExecute([
    modifyStat('self', 'will', 1),
    modifyStat('self', 'speed', speedBonus),
    msg(`梦醒时分：意志+1，速度+${speedBonus}（冥想骰数${meditationCount}，上限3）`),
  ]);
};