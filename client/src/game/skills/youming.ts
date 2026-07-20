/* ═══════════════════════════════════════════════════════════
 * 修 — 幽冥
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { gainDice, removeDice, heal, trueDamage, message as msg, cannotExecute, canExecute } from '../effects';

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
 * 持续：当你使用攻击骰造成伤害后，根据骰点：1-2回血2，3-4回血4，5-6受伤2。
 */
export const skillYoumingMingjiexingzou: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 持续：攻击后根据攻击骰点数回血或受伤 ── */
  if (
    event &&
    event.type === 'attackResolved' &&
    event.playerId === selfId &&
    event.attackDiceValue != null
  ) {
    const value = event.attackDiceValue;
    if (value <= 2) {
      return canExecute([heal('self', 2), msg('冥界行走·持续：攻击骰≤2，回复2点生命')]);
    } else if (value <= 4) {
      return canExecute([heal('self', 4), msg('冥界行走·持续：攻击骰3-4，回复4点生命')]);
    } else {
      return canExecute([trueDamage('self', 2), msg('冥界行走·持续：攻击骰5-6，受到2点真实伤害')]);
    }
  }

  /* ── 启动：消耗最多3冥想，获得等量攻击 ── */
  const meditationCount = self.zone.meditation.length;
  if (meditationCount < 1) {
    return cannotExecute('冥想骰不足，至少需要1个');
  }

  const consumeCount = Math.min(3, meditationCount);
  return canExecute([
    removeDice('self', 'meditation', consumeCount),
    gainDice('self', 'attack', consumeCount),
    msg(`冥界行走！消耗${consumeCount}个冥想骰，获得${consumeCount}个攻击骰`),
  ], { meditation: consumeCount });
};