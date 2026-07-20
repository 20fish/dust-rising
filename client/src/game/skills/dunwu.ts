/* ═══════════════════════════════════════════════════════════
 * 塔塔萝丝 — 顿悟
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, trueDamage, damageReduction, setCounter, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 灵能屏障（启动；触发）
 * 启动：消耗最多3个防御骰，获得2倍数量的冥想骰。
 * 触发：当对方使用1个攻击骰后，消耗1个冥想骰，将该攻击骰造成的伤害改为一半（向下取整）。
 */
export const skillDunwuLingnengpingzhang: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 触发：对方攻击后消耗1冥想骰减半伤害 ── */
  if (event && event.type === 'attackResolved' && event.playerId !== selfId && (event.attackDamage ?? 0) > 0) {
    const meditationCount = self.zone.meditation.length;
    if (meditationCount < 1) {
      return cannotExecute('灵能屏障·触发：冥想骰不足');
    }
    const reduction = Math.floor((event.attackDamage ?? 0) / 2);
    return canExecute(
      [
        removeDice('self', 'meditation', 1),
        damageReduction(reduction),
        msg(`灵能屏障·触发！消耗1冥想骰，伤害减半（减少${reduction}）`),
      ],
      { meditation: 1 },
    );
  }

  /* ── 启动：消耗防御骰获得冥想骰 ── */
  const defenseCount = self.zone.defense.length;

  if (defenseCount < 1) {
    return cannotExecute('防御骰不足，至少需要1个');
  }

  const consumeCount = Math.min(3, defenseCount);
  return canExecute(
    [
      removeDice('self', 'defense', consumeCount),
      gainDice('self', 'meditation', consumeCount * 2),
      msg(`灵能屏障！消耗${consumeCount}个防御骰，获得${consumeCount * 2}个冥想骰`),
    ],
    { defense: consumeCount },
  );
};

/**
 * 灵能脉冲（启动；触发）
 * 启动：消耗最多3个攻击骰，获得2倍数量的冥想骰。
 * 触发：当你通过技能消耗能力骰后，额外造成等同消耗能力骰数量的真实伤害。
 * 本技能每回合最多触发1次。
 */
export const skillDunwuLingnengmaichong: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 触发：自身攻击后额外造成真实伤害（每回合最多1次） ── */
  if (event && event.type === 'attackResolved' && event.playerId === selfId && (event.attackDamage ?? 0) > 0) {
    const artifact = self.artifacts[1];
    const triggered = artifact?.counters?.lingnengmaichong_triggered ?? 0;
    if (triggered >= 1) {
      return cannotExecute('灵能脉冲·触发：本回合已触发过');
    }
    return canExecute([
      trueDamage('opponent', 1),
      setCounter('self', 1, 'lingnengmaichong_triggered', 1),
      msg('灵能脉冲·触发！造成1点真实伤害'),
    ]);
  }

  /* ── 启动：消耗攻击骰获得冥想骰 ── */
  const attackCount = self.zone.attack.length;

  if (attackCount < 1) {
    return cannotExecute('攻击骰不足，至少需要1个');
  }

  const consumeCount = Math.min(3, attackCount);
  return canExecute(
    [
      removeDice('self', 'attack', consumeCount),
      gainDice('self', 'meditation', consumeCount * 2),
      msg(`灵能脉冲！消耗${consumeCount}个攻击骰，获得${consumeCount * 2}个冥想骰`),
    ],
    { attack: consumeCount },
  );
};