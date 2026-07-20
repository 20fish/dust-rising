/* ═══════════════════════════════════════════════════════════
 * 玛特（破晓之剑）— 真言
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import {
  modifyStat,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 真言 ────────────────────────────────────────────────── */

/**
 * 权指（持续）
 * 速度+1。
 */
export const skillZhenyanQuanzhi: SkillFn = (_game, _selfId) => {
  return canExecute(
    [
      modifyStat('self', 'speed', 1),
      msg('权指（持续）：速度+1'),
    ],
    undefined,
  );
};

/**
 * 神圣干涉（激活）
 * 需要玩家指定骰子点数，复杂交互。
 */
export const skillZhenyanShenshengganshe: SkillFn = (_game, _selfId) => {
  return cannotExecute('需要玩家指定骰子点数，暂未实现');
};
