/* ═══════════════════════════════════════════════════════════
 * 弥云 — 千劫
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { modifyStat, message as msg, canExecute, cannotExecute } from '../effects';

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
 * 超度（启动）
 * 消耗2个同点冥想骰，造成5点真实伤害，选择一个区域重掷。
 *
 * 需要玩家选择区域，暂未实现。
 */
export const skillQianjieChaodu: SkillFn = (_game, _selfId) => {
  return cannotExecute('超度需要玩家选择区域，暂未实现');
};
