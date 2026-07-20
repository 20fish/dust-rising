/* ═══════════════════════════════════════════════════════════
 * 空（雨中剑圣）— 游龙
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import {
  cannotExecute,
} from '../effects';

/* ── 游龙 ────────────────────────────────────────────────── */

/**
 * 龙游万象（启动）
 * 消耗X攻击骰(X≤意志)。选择①②③中的一个效果。
 */
export const skillYoulongLongyouwanxiang: SkillFn = (_game, _selfId) => {
  return cannotExecute('需要玩家选择消耗骰子数量和效果选项，暂未实现');
};

/**
 * 龙腾万丈（触发）
 * 当你使用攻击骰造成伤害后。对手意志-X(X=使用的攻击骰数)。
 */
export const skillYoulongLongtengwanzhang: SkillFn = (_game, _selfId) => {
  return cannotExecute('龙腾万丈需要攻击上下文来获取使用的攻击骰数，暂未实现');
};
