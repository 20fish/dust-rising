/* ═══════════════════════════════════════════════════════════
 * 空（雨中剑圣）— 游龙
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  gainDice,
  modifyStat,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 游龙 ────────────────────────────────────────────────── */

/**
 * 龙游万象（启动）
 * 消耗X攻击骰(X≤意志)。选择①②③中的一个效果。
 * 默认选效果①：获得随机点数能力骰（攻击骰）。
 */
export const skillYoulongLongyouwanxiang: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const attackCount = self.zone.attack.length;

  if (attackCount < 1) {
    return cannotExecute('攻击骰不足，至少需要1个');
  }

  // 消耗数量 = min(攻击骰数, 意志)
  const consumeCount = Math.min(attackCount, self.will);

  // 默认选择效果①：获得随机点数能力骰
  return canExecute(
    [
      gainDice('self', 'attack', consumeCount),
      msg(`龙游万象！消耗${consumeCount}个攻击骰，获得${consumeCount}个随机攻击骰`),
    ],
    { attack: consumeCount },
  );
};

/**
 * 龙腾万丈（触发）
 * 当你使用攻击骰造成伤害后。对手意志-X(X=使用的攻击骰数)。
 */
export const skillYoulongLongtengwanzhang: SkillFn = (game, selfId) => {
  const { opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  if (!event || event.type !== 'attackResolved' || event.playerId !== selfId) {
    return cannotExecute('龙腾万丈：未满足触发条件（需要自身攻击造成伤害后）');
  }

  // X = 使用的攻击骰点数（attackDiceValue 代表使用的攻击骰值）
  const x = event.attackDiceValue ?? 1;

  return canExecute(
    [
      modifyStat('opponent', 'will', -x),
      msg(`龙腾万丈！对手意志-${x}（使用了${x}点攻击骰）`),
    ],
    undefined,
  );
};