/* ═══════════════════════════════════════════════════════════
 * 李封（天殇的战鬼）— 寒光
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  gainDice,
  setCounter,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 寒光 ────────────────────────────────────────────────── */

/**
 * 凛冽之音（充能；必杀）
 * 充能：直到你的下个尘起阶段开始，在任何玩家重掷能力骰后，使其受到等同重掷数量的真实伤害。
 * 必杀：消耗1个攻击骰，1个防御骰，以及1个冥想骰。从供应堆中拿取1·2·3·4·5·6点的骰子各1个，
 *       当你将要使用1个攻击骰时，从以下两项中选择1项执行：
 *       ①将骰子根据其点数移动到对应区域。②弃置对方1个同点数能力骰。
 */
export const skillHanguangLinliezhiyin: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 必杀：已激活且充能充足时 ── */
  const artifact = self.artifacts[2];
  const chargeCount = artifact?.counters?.charge ?? 0;
  if (chargeCount >= 2 && artifact?.isActive) {
    const hasAtk = self.zone.attack.length >= 1;
    const hasDef = self.zone.defense.length >= 1;
    const hasMed = self.zone.meditation.length >= 1;
    if (!hasAtk || !hasDef || !hasMed) {
      return cannotExecute('凛冽之音·必杀：需要各1个攻击、防御、冥想骰');
    }

    // 消耗各1骰，获得1-6点各1个骰子
    return canExecute(
      [
        removeDice('self', 'attack', 1),
        removeDice('self', 'defense', 1),
        removeDice('self', 'meditation', 1),
        gainDice('self', 'attack', 6, [1, 2, 3, 4, 5, 6]),
        setCounter('self', 2, 'rerdamage', chargeCount),
        msg('凛冽之音·必杀！获得1-6点骰子各1个'),
      ],
      { attack: 1, defense: 1, meditation: 1 },
    );
  }

  /* ── 充能：设置重掷真实伤害计数 ── */
  if (chargeCount <= 0) {
    return cannotExecute('充能层数不足，无法充能');
  }

  return canExecute(
    [
      setCounter('self', 2, 'rerdamage', chargeCount),
      msg(`凛冽之音（充能）：设置重掷真实伤害计数为${chargeCount}`),
    ],
    undefined,
  );
};