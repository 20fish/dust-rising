/* ═══════════════════════════════════════════════════════════
 * 玛特（破晓之剑）— 天罚
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  ignoreDefense,
  message as msg,
  canExecute,
  cannotExecute,
} from '../effects';

/* ── 天罚 ────────────────────────────────────────────────── */

/**
 * 白昼之火（激活）
 * 天罚第一侧面（activeSide=0）：攻击只能用冥想骰抵挡，攻击点数视为3。
 */
export const skillTianfaBaizhouzhihuo: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const artifact = self.artifacts[0];
  if (!artifact?.isActive) return cannotExecute('天罚未激活');
  if ((artifact.activeSide ?? 0) !== 0) return cannotExecute('当前不是白昼之火侧面');

  return canExecute(
    [
      ignoreDefense(true),
      msg('白昼之火：攻击只能使用冥想骰抵挡，攻击点数视为3'),
    ],
    undefined,
  );
};

/**
 * 陨落（激活）
 * 天罚第二侧面（activeSide=1）：攻击只能用攻击骰抵挡，攻击点数视为3。
 */
export const skillTianfaYunluo: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const artifact = self.artifacts[0];
  if (!artifact?.isActive) return cannotExecute('天罚未激活');
  if ((artifact.activeSide ?? 0) !== 1) return cannotExecute('当前不是陨落侧面');

  return canExecute(
    [
      ignoreDefense(true),
      msg('陨落：攻击只能使用攻击骰抵挡，攻击点数视为3'),
    ],
    undefined,
  );
};