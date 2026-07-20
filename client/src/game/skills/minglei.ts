/* ═══════════════════════════════════════════════════════════
 * 佐雷 — 鸣雷
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { cannotExecute } from '../effects';

/**
 * 电刑（触发）
 * 使用攻击骰后，消耗2个冥想骰，视为使用[2][3][4]攻击。
 *
 * 需要攻击上下文，暂未实现。
 */
export const skillMingleiDianxing: SkillFn = (_game, _selfId) => {
  return cannotExecute('电刑需要攻击上下文，暂未实现');
};

/**
 * 雷暴（触发；持续）
 * 触发：攻击被挡后，将冥想骰移至攻击区。
 * 持续：对方重掷结束后插入一个重掷阶段。
 *
 * 触发部分需要攻击上下文，持续部分需要阶段上下文，暂未实现。
 */
export const skillMingleiLeibao: SkillFn = (_game, _selfId) => {
  return cannotExecute('雷暴需要攻击上下文和阶段上下文，暂未实现');
};
