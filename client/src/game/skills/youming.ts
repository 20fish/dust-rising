/* ═══════════════════════════════════════════════════════════
 * 修 — 幽冥
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { gainDice, removeDice, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 帷幕（触发）
 * 在对方的重掷阶段结束时。你可以弃置对方1个攻击骰。
 */
export const skillYoumingWeimu: SkillFn = (game, selfId) => {
  const { opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  if (!event || event.type !== 'rerollEnd' || event.playerId === selfId) {
    return cannotExecute('帷幕：未满足触发条件（需要对方重掷阶段结束时）');
  }

  if (opponent.zone.attack.length < 1) {
    return cannotExecute('帷幕：对方没有攻击骰可弃置');
  }

  return canExecute([
    removeDice('opponent', 'attack', 1),
    msg('帷幕！弃置对方1个攻击骰'),
  ]);
};

/**
 * 冥界行走（启动；持续）
 * 启动：消耗最多3个冥想骰，获得等量攻击骰。
 * 持续：攻击后根据攻击骰点数回血或受伤。
 *
 * 启动部分可实现，持续部分需要攻击上下文，暂未实现。
 */
export const skillYoumingMingjiexingzou: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const meditationCount = self.zone.meditation.length;

  if (meditationCount < 1) {
    return cannotExecute('冥想骰不足，至少需要1个');
  }

  // 启动：消耗最多3冥想，获得等量攻击
  const consumeCount = Math.min(3, meditationCount);
  return canExecute([
    removeDice('self', 'meditation', consumeCount),
    gainDice('self', 'attack', consumeCount),
    msg(`冥界行走！消耗${consumeCount}个冥想骰，获得${consumeCount}个攻击骰`),
  ], { meditation: consumeCount });
};