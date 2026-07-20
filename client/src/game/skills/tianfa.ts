/* ═══════════════════════════════════════════════════════════
 * 玛特（破晓之剑）— 天罚
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import {
  cannotExecute,
} from '../effects';

/* ── 天罚 ────────────────────────────────────────────────── */

/**
 * 白昼之火（激活）
 * 修改防御规则，需要复杂的规则修饰系统。
 */
export const skillTianfaBaizhouzhihuo: SkillFn = (_game, _selfId) => {
  return cannotExecute('白昼之火需要修改防御规则，暂未实现');
};

/**
 * 陨落（激活）
 * 修改防御规则，需要复杂的规则修饰系统。
 */
export const skillTianfaYunluo: SkillFn = (_game, _selfId) => {
  return cannotExecute('陨落需要修改防御规则，暂未实现');
};
