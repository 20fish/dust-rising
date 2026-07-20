/* ═══════════════════════════════════════════════════════════
 * 李封（天殇的战鬼）— 哀歌
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import {
  cannotExecute,
} from '../effects';

/* ── 哀歌 ────────────────────────────────────────────────── */

/**
 * 陷阵（持续）
 * 回合结束时触发的复杂规则效果。
 * 需要轮询机制支持，暂未实现。
 */
export const skillAigeXianzhen: SkillFn = (_game, _selfId) => {
  return cannotExecute('陷阵在回合结束时触发，需要轮询机制，暂未实现');
};

/**
 * 剑压（触发）
 * 需要玩家选择目标和变更骰子，复杂交互。
 */
export const skillAigeJianya: SkillFn = (_game, _selfId) => {
  return cannotExecute('需要玩家选择目标和变更骰子，暂未实现');
};
