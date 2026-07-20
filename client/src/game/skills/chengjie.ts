/* ═══════════════════════════════════════════════════════════
 * 佐雷 — 惩戒
 * ═══════════════════════════════════════════════════════════ */

import type { DiceValue } from '../../../../shared/types';
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { changeDiceValue, gainDice, trueDamage, message as msg, canExecute } from '../effects';

/**
 * 净化（激活）
 * 将对方最多2个[1]点骰改为[3]点。若成功改变：获得2冥想骰，受2真实伤害。
 *
 * 对所有区域（防御/攻击/冥想）尝试改变[1]为[3]。
 * 由于无法追踪 changeDiceValue 是否实际改变了骰子，
 * 直接应用所有效果（获得冥想和受伤作为代价）。
 */
export const skillChengjieJinghua: SkillFn = (game, selfId) => {
  const { opponent } = resolvePlayers(game, selfId);

  // 将对方所有区域的[1]改为[3]，最多影响2个
  return canExecute([
    changeDiceValue('opponent', 'defense', 3 as DiceValue, 1 as DiceValue),
    changeDiceValue('opponent', 'attack', 3 as DiceValue, 1 as DiceValue),
    changeDiceValue('opponent', 'meditation', 3 as DiceValue, 1 as DiceValue),
    gainDice('self', 'meditation', 2),
    trueDamage('self', 2),
    msg('净化！将对方[1]改为[3]，获得2冥想骰，受2真实伤害'),
  ], { life: 2 });
};

/**
 * 数罪并罚（激活）
 * 将自己最多2个[2]点骰改为[4]点。获得2冥想骰，受2真实伤害。
 *
 * 对所有区域（防御/攻击/冥想）尝试改变[2]为[4]。
 * 直接应用所有效果（获得冥想和受伤作为代价）。
 */
export const skillChengjieShuzuibingfa: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 将自己所有区域的[2]改为[4]，最多影响2个
  return canExecute([
    changeDiceValue('self', 'defense', 4 as DiceValue, 2 as DiceValue),
    changeDiceValue('self', 'attack', 4 as DiceValue, 2 as DiceValue),
    changeDiceValue('self', 'meditation', 4 as DiceValue, 2 as DiceValue),
    gainDice('self', 'meditation', 2),
    trueDamage('self', 2),
    msg('数罪并罚！将自己[2]改为[4]，获得2冥想骰，受2真实伤害'),
  ], { life: 2 });
};
