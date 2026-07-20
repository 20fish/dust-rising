/* ═══════════════════════════════════════════════════════════
 * 希瓦 — 蛇蝎
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/**
 * 畏惧（启动）
 * 双方各选择1个能力骰。比较点数。若你的点数较大，弃置对方选择的骰子。
 *
 * 默认：从自身攻击骰区取最大点数骰子，从对方防御骰区取第一个骰子。
 * 若自身点数较大，弃置对方骰子。
 */
export const skillShexieWeiju: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);

  if (self.zone.attack.length === 0) {
    return cannotExecute('畏惧：攻击骰区无骰子');
  }

  if (opponent.zone.defense.length === 0) {
    return cannotExecute('畏惧：对方防御骰区无骰子');
  }

  // 从自身攻击骰区取最大点数
  const selfDie = [...self.zone.attack].sort((a, b) => b.value - a.value)[0];
  const opponentDie = opponent.zone.defense[0];

  if (selfDie.value <= opponentDie.value) {
    return cannotExecute(`畏惧：自身点数(${selfDie.value})不大于对方点数(${opponentDie.value})`);
  }

  return canExecute(
    [
      removeDice('opponent', 'defense', 1),
      msg(`畏惧！自身${selfDie.value}点 > 对方${opponentDie.value}点，弃置对方防御骰`),
    ],
    { attack: 1 },
  );
};

/**
 * 共振（启动）
 * 选择你的1个能力骰。选择一项：
 * ①根据其点数，弃置对方1个同点数的能力骰。
 * ②根据其点数，获得1个同点数的能力骰。
 *
 * 默认选①。从自身攻击骰区取第一个骰子，弃置对方同点数攻击骰。
 */
export const skillShexieGongzhen: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);

  if (self.zone.attack.length === 0) {
    return cannotExecute('共振：攻击骰区无骰子');
  }

  const die = self.zone.attack[0];

  // 检查对方是否有同点数攻击骰
  if (!opponent.zone.attack.some(d => d.value === die.value)) {
    return cannotExecute(`共振：对方无${die.value}点攻击骰`);
  }

  return canExecute(
    [
      removeDice('opponent', 'attack', 1, { exactValue: die.value }),
      msg(`共振！根据${die.value}点骰子，弃置对方同点数攻击骰`),
    ],
    { attack: 1 },
  );
};