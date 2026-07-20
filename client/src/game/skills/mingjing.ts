/* ═══════════════════════════════════════════════════════════
 * 空（雨中剑圣）— 明镜
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  trueDamage,
  message as msg,
  canExecute,
} from '../effects';

/* ── 明镜 ────────────────────────────────────────────────── */

/**
 * 战神切（充能）
 * 充能计数达到要求时：造成X真实伤害(X=对方骰子数)。
 */
export const skillMingjingZhanshenqie: SkillFn = (game, selfId) => {
  const { opponent } = resolvePlayers(game, selfId);
  const opponentTotal =
    opponent.zone.attack.length +
    opponent.zone.defense.length +
    opponent.zone.meditation.length;
  const totalDamage = Math.floor(opponentTotal / 2);

  return canExecute([
    trueDamage('opponent', totalDamage),
    msg(`战神切！对方骰子${opponentTotal}个，造成${totalDamage}点真实伤害`),
  ]);
};
