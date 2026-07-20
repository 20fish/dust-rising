/* ═══════════════════════════════════════════════════════════
 * 修 — 虚臾
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, modifyStat, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 虚无形态（激活；持续）
 * 激活：选择你的1种能力骰。直到本回合结束前，你的该类型能力骰点数始终视为3。
 * 持续：速度+2。
 */
export const skillXuyuXuwuxingtai: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 激活：选择骰子类型（默认攻击骰），视为3点
  if (!self.artifacts[0]?.isActive) {
    return canExecute([
      msg('虚无形态·激活：攻击骰点数视为3，速度+2'),
    ]);
  }

  // 持续：速度+2
  return canExecute([modifyStat('self', 'speed', 2)]);
};

/**
 * 献祭（启动）
 * 选择一项：
 * ①消耗2个防御骰，获得2个攻击骰。
 * ②消耗2个攻击骰，获得2个防御骰。
 * 默认选择①。
 */
export const skillXuyuXianji: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const defenseCount = self.zone.defense.length;

  // 默认选择①：消耗2防御获得2攻击
  if (defenseCount < 2) {
    return cannotExecute('献祭：防御骰不足，至少需要2个');
  }

  return canExecute(
    [
      removeDice('self', 'defense', 2),
      gainDice('self', 'attack', 2),
      msg('献祭！消耗2个防御骰，获得2个攻击骰'),
    ],
    { defense: 2 },
  );
};