/* ═══════════════════════════════════════════════════════════
 * 修 — 虚臾
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { modifyStat, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 虚无形态（激活；持续）
 * 激活：受到10点真实伤害，获得指定类型的[4]骰子直至意志上限。
 * 持续：速度+2。
 *
 * 激活部分需要玩家选择骰子类型，暂未实现。
 * 持续部分提供速度+2。
 */
export const skillXuyuXuwuxingtai: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 激活：需要玩家选择骰子类型
  if (!self.artifacts[0]?.isActive) {
    return cannotExecute('虚无形态需要玩家选择骰子类型，暂未实现');
  }

  // 持续：速度+2
  return canExecute([modifyStat('self', 'speed', 2)]);
};

/**
 * 献祭（启动）
 * 受到4点真实伤害，选择①或②效果。
 * ①：弃置对方1骰。 ②：获得对方1骰。
 *
 * 需要玩家选择效果，暂未实现。
 */
export const skillXuyuXianji: SkillFn = (_game, _selfId) => {
  return cannotExecute('献祭需要玩家选择效果，暂未实现');
};
