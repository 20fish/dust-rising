/* ═══════════════════════════════════════════════════════════
 * 李封（天殇的战鬼）— 屠虎
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import {
  bonusDamage,
  message as msg,
  canExecute,
} from '../effects';

/* ── 屠虎 ────────────────────────────────────────────────── */

/**
 * 齐袭（持续）
 * 纯规则修饰：攻击时，若使用多个攻击骰，每个额外的攻击骰+1伤害。
 * 不需要产生效果，仅作为规则说明。
 */
export const skillTuhuQixi: SkillFn = (_game, _selfId) => {
  return canExecute(
    [
      msg('齐袭（持续）：使用多个攻击骰攻击时，每个额外的攻击骰+1伤害'),
    ],
    undefined,
  );
};

/**
 * 横贯（持续；触发）
 * 持续：第二次攻击伤害+2。
 * 触发：弃置对方1个点数小于攻击的能力骰。
 *
 * 注意：持续部分已实现（bonusDamage），但无法在当前 GameState 中
 * 精确追踪"第几次攻击"，因此持续效果作为被动规则标注。
 * 触发部分需要攻击上下文和玩家选择，暂未实现。
 */
export const skillTuhuHengguan: SkillFn = (_game, _selfId) => {
  // 持续效果：第二次攻击+2（无法精确判断攻击次序，作为被动规则标注）
  return canExecute(
    [
      bonusDamage(2),
      msg('横贯（持续）：第二次攻击伤害+2'),
    ],
    undefined,
  );
};
