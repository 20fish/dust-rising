/* ═══════════════════════════════════════════════════════════
 * 李封（天殇的战鬼）— 哀歌
 * ═══════════════════════════════════════════════════════════ */

import type { DiceValue } from '../../../../shared/types';
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  gainDice,
  changeDiceValue,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 哀歌 ────────────────────────────────────────────────── */

/**
 * 陷阵（持续）
 * 你的重掷阶段结束时，弃置你的1个能力骰，获得另外两种类型各1个。
 */
export const skillAigeXianzhen: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  if (!event || event.type !== 'rerollEnd' || event.playerId !== selfId) {
    return cannotExecute('陷阵：未满足触发条件（需要自身重掷阶段结束时）');
  }

  // 优先从防御骰区弃置，否则攻击骰区，否则冥想骰区
  let removeZone: 'attack' | 'defense' | 'meditation';
  if (self.zone.defense.length > 0) {
    removeZone = 'defense';
  } else if (self.zone.attack.length > 0) {
    removeZone = 'attack';
  } else if (self.zone.meditation.length > 0) {
    removeZone = 'meditation';
  } else {
    return cannotExecute('陷阵：没有任何骰子可弃置');
  }

  // 获得另外两种类型各1个骰子
  const allTypes: Array<'attack' | 'defense' | 'meditation'> = ['attack', 'defense', 'meditation'];
  const otherTypes = allTypes.filter(t => t !== removeZone);

  const effects: ReturnType<typeof canExecute>['effects'] = [
    removeDice('self', removeZone, 1),
    gainDice('self', otherTypes[0], 1),
    gainDice('self', otherTypes[1], 1),
    msg(`陷阵！弃置1个${removeZone === 'attack' ? '攻击' : removeZone === 'defense' ? '防御' : '冥想'}骰，获得${otherTypes[0] === 'attack' ? '攻击' : otherTypes[0] === 'defense' ? '防御' : '冥想'}骰和${otherTypes[1] === 'attack' ? '攻击' : otherTypes[1] === 'defense' ? '防御' : '冥想'}骰各1个`),
  ];

  return canExecute(effects, undefined);
};

/**
 * 剑压（触发）
 * 当你使用1个任意能力骰后。将对手的1个能力骰点数变更为2点。
 * 默认：将对手的防御骰改为2点。
 */
export const skillAigeJianya: SkillFn = (game, selfId) => {
  const { opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  if (!event || event.type !== 'attackResolved' || event.playerId !== selfId) {
    return cannotExecute('剑压：未满足触发条件（需要自身使用能力骰后）');
  }

  // 默认将对手的防御骰改为2点
  return canExecute(
    [
      changeDiceValue('opponent', 'defense', 2 as DiceValue),
      changeDiceValue('opponent', 'attack', 2 as DiceValue),
      changeDiceValue('opponent', 'meditation', 2 as DiceValue),
      msg('剑压！将对手的1个能力骰点数变更为2点'),
    ],
    undefined,
  );
};