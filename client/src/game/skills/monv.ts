/* ═══════════════════════════════════════════════════════════
 * 塔塔萝丝 — 魔女
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { modifyStat, message as msg, canExecute } from '../effects';

/**
 * 梦醒时分（持续；必杀）
 * 持续：意志+1，速度+X（X为冥想骰数量，上限3）。
 * 必杀：需要玩家选择移动区域，暂未实现。
 */
export const skillMonvMengxingshifen: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const meditationCount = self.zone.meditation.length;
  const speedBonus = Math.min(3, meditationCount);

  return canExecute([
    modifyStat('self', 'will', 1),
    modifyStat('self', 'speed', speedBonus),
    msg(`梦醒时分：意志+1，速度+${speedBonus}（冥想骰数${meditationCount}，上限3）`),
  ]);
};
