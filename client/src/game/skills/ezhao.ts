/* ═══════════════════════════════════════════════════════════
 * 艾娃 — 恶兆
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, trueDamage, setCounter, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 血祭（持续）
 * 每次攻击后计数+1（上限7），攻击造成伤害后受X真实伤害。
 * 需要攻击上下文来递增计数和自伤，暂未实现。
 */
export const skillEzhaoXueji: SkillFn = (_game, _selfId) => {
  return cannotExecute('血祭需要攻击上下文来递增计数和自伤，暂未实现');
};

/**
 * 清算（激活）
 * 弃置对方X个骰（X = 计数值 stack），不足则每少1个造成3真实伤害，计数-1。
 * 按攻击 > 防御 > 冥想的顺序依次弃置。
 */
export const skillEzhaoQingsuan: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const stack = self.artifacts[0]?.counters?.stack ?? 0;

  if (stack < 1) {
    return cannotExecute('计数不足，无法发动清算');
  }

  const totalOpponent =
    opponent.zone.attack.length +
    opponent.zone.defense.length +
    opponent.zone.meditation.length;

  if (totalOpponent === 0) {
    // 对方无骰，全部转化为伤害
    return canExecute(
      [
        trueDamage('opponent', stack * 3),
        setCounter('self', 0, 'stack', Math.max(0, stack - 1)),
        msg(`清算：对方无骰可弃，造成${stack * 3}真实伤害`),
      ],
    );
  }

  const actualRemove = Math.min(stack, totalOpponent);
  const effects: ReturnType<typeof canExecute>['effects'] = [];

  // 按攻击 > 防御 > 冥想的顺序依次弃置
  let remaining = actualRemove;

  const aRemove = Math.min(remaining, opponent.zone.attack.length);
  if (aRemove > 0) {
    effects.push(removeDice('opponent', 'attack', aRemove));
    remaining -= aRemove;
  }

  const dRemove = Math.min(remaining, opponent.zone.defense.length);
  if (dRemove > 0) {
    effects.push(removeDice('opponent', 'defense', dRemove));
    remaining -= dRemove;
  }

  const mRemove = Math.min(remaining, opponent.zone.meditation.length);
  if (mRemove > 0) {
    effects.push(removeDice('opponent', 'meditation', mRemove));
    remaining -= mRemove;
  }

  // 不足部分转化为真实伤害
  const shortage = stack - actualRemove;
  if (shortage > 0) {
    effects.push(trueDamage('opponent', shortage * 3));
  }

  effects.push(setCounter('self', 0, 'stack', Math.max(0, stack - 1)));
  effects.push(msg(
    `清算！弃置对方${actualRemove}个骰` +
    (shortage > 0 ? `，不足部分造成${shortage * 3}真实伤害` : '') +
    `，计数-1`,
  ));

  return canExecute(effects);
};
