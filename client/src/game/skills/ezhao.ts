/* ═══════════════════════════════════════════════════════════
 * 艾娃 — 恶兆
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, trueDamage, setCounter, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 血祭（触发）
 * 当你使用攻击骰造成伤害后。本神器计数+1，你受到1点真实伤害。
 */
export const skillEzhaoXueji: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  if (!event || event.type !== 'attackResolved' || event.playerId !== selfId || (event.attackDamage ?? 0) <= 0) {
    return cannotExecute('血祭：未满足触发条件（需要自身攻击造成伤害后）');
  }

  const artifact = self.artifacts[0];
  const currentCount = artifact?.counters?.blood ?? 0;
  const newCount = currentCount + 1;

  return canExecute([
    setCounter('self', 0, 'blood', newCount),
    trueDamage('self', 1),
    msg(`血祭！计数+1（当前${newCount}），受到1点真实伤害`),
  ]);
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