/* ═══════════════════════════════════════════════════════════
 * 巴顿二世 — 铁壁
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, modifyStat, trueDamage, bonusDamage, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 战车（持续；触发）
 * 持续：意志+1。
 * 触发：你的回合开始时，如果你拥有至少1个防御骰，你获得1个[4]点的攻击骰。
 */
export const skillTiebiZhanche: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 触发：回合开始时（roundEnd 事件中 playerId 是刚结束回合的玩家，不等于 selfId 意味着新回合开始） ── */
  if (event && event.type === 'roundEnd' && event.playerId !== selfId) {
    if (self.zone.defense.length < 1) {
      return cannotExecute('战车·触发：没有防御骰');
    }
    return canExecute([
      modifyStat('self', 'will', 1),
      gainDice('self', 'attack', 1, [4]),
      msg('战车！意志+1，获得1个[4]攻击骰'),
    ]);
  }

  /* ── 持续：意志+1 ── */
  return canExecute([
    modifyStat('self', 'will', 1),
    msg('战车：意志+1'),
  ]);
};

/**
 * 往世之权（启动）
 * 消耗2冥想骰，弃置2防御骰（不足则每少1个受2真实伤害），
 * 获得4个随机防御骰，攻击+1。
 */
export const skillTiebiWangshizhiquan: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const meditationCount = self.zone.meditation.length;
  const defenseCount = self.zone.defense.length;

  if (meditationCount < 2) {
    return cannotExecute('冥想骰不足，至少需要2个');
  }

  const effects: ReturnType<typeof canExecute>['effects'] = [
    removeDice('self', 'meditation', 2),
  ];

  // 弃置防御骰，不足则自伤
  if (defenseCount < 2) {
    const shortage = 2 - defenseCount;
    effects.push(trueDamage('self', shortage * 2));
    if (defenseCount > 0) {
      effects.push(removeDice('self', 'defense', defenseCount));
    }
    effects.push(msg(
      `往世之权！防御骰不足（仅有${defenseCount}个），承受${shortage * 2}真实伤害`,
    ));
  } else {
    effects.push(removeDice('self', 'defense', 2));
  }

  effects.push(gainDice('self', 'defense', 4));
  effects.push(bonusDamage(1));
  effects.push(msg('往世之权：获得4个防御骰，攻击+1'));

  return canExecute(effects, { meditation: 2 });
};