/* ═══════════════════════════════════════════════════════════
 * 空（雨中剑圣）— 雨切
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  ignoreDefense,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 雨切 ────────────────────────────────────────────────── */

/**
 * 中央突破（启动）
 * 消耗最多3个冥想骰。弃置对方同等数量的防御骰。
 * 如果你消耗了恰好3个冥想骰，直到本回合结束前，你的攻击不可抵挡。
 */
export const skillYuqieZhongyangTupo: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const meditationCount = self.zone.meditation.length;

  if (meditationCount < 1) {
    return cannotExecute('冥想骰不足，至少需要1个');
  }

  const consumeCount = Math.min(3, meditationCount);
  const effects: ReturnType<typeof canExecute>['effects'] = [
    removeDice('self', 'meditation', consumeCount),
    removeDice('opponent', 'defense', consumeCount),
  ];

  if (consumeCount === 3) {
    effects.push(ignoreDefense(true));
  }

  effects.push(
    msg(`中央突破！消耗${consumeCount}个冥想骰，弃置对方${consumeCount}个防御骰${consumeCount === 3 ? '，攻击不可抵挡' : ''}`)
  );

  return canExecute(effects, { meditation: consumeCount });
};

/**
 * 裁雨流（触发）
 * 当你使用攻击骰造成伤害后。你可以保留其点数，
 * 将其移动至你的防御骰区或冥想骰区。
 * 本技能每回合最多触发3次。
 */
export const skillYuqieCaiyuliu: SkillFn = (_game, _selfId) => {
  return cannotExecute('裁雨流需要玩家选择目标区域，暂未实现交互');
};
