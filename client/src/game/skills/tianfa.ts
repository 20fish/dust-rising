/* ═══════════════════════════════════════════════════════════
 * 玛特（破晓之剑）— 天罚
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import {
  ignoreDefense,
  message as msg,
  canExecute,
} from '../effects';

/* ── 天罚 ────────────────────────────────────────────────── */

/**
 * 白昼之火（激活）
 * 直到本回合结束前，你的攻击不可用防御骰抵挡，而是改为只能使用冥想骰抵挡，
 * 且你的攻击点数始终视为[3]。
 */
export const skillTianfaBaizhouzhihuo: SkillFn = (_game, _selfId) => {
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
 * 直到本回合结束前，你的攻击不可用防御骰抵挡，而是改为只能使用攻击骰抵挡，
 * 且你的攻击点数始终视为[3]。
 */
export const skillTianfaYunluo: SkillFn = (_game, _selfId) => {
  return canExecute(
    [
      ignoreDefense(true),
      msg('陨落：攻击只能使用攻击骰抵挡，攻击点数视为3'),
    ],
    undefined,
  );
};