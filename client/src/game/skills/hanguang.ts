/* ═══════════════════════════════════════════════════════════
 * 李封（天殇的战鬼）— 寒光
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  setCounter,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 寒光 ────────────────────────────────────────────────── */

/**
 * 凛冽之音（充能；必杀）
 * 充能：设置"重掷造成真实伤害"计数。
 * 必杀：需要复杂状态管理，暂未实现。
 */
export const skillHanguangLinliezhiyin: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const chargeCount = (self.artifacts[2]?.counters?.charge as number) ?? 0;

  if (chargeCount <= 0) {
    return cannotExecute('充能层数不足，无法充能');
  }

  return canExecute(
    [
      setCounter('self', 2, 'rerdamage', chargeCount),
      msg(`凛冽之音（充能）：设置重掷真实伤害计数为${chargeCount}`),
    ],
    undefined,
  );
};
