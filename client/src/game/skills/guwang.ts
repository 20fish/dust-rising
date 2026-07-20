/* ═══════════════════════════════════════════════════════════
 * 巴顿二世 — 孤王
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, changeDiceValue, damageReduction, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 高塔铁幕（触发；充能；必杀）
 * 触发：当你受到来自对方的真实伤害时，消耗1个防御骰，取消该真实伤害。
 * 充能：将对方1个攻击骰改为[1]。
 * 必杀：效果复杂，暂未实现。
 */
export const skillGuwangGaotatiemu: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 触发：受到真实伤害时消耗1防御骰取消伤害 ── */
  if (event && event.type === 'attackResolved' && event.targetId === selfId && (event.attackDamage ?? 0) > 0) {
    if (self.zone.defense.length < 1) {
      return cannotExecute('高塔铁幕·触发：防御骰不足');
    }
    return canExecute(
      [
        removeDice('self', 'defense', 1),
        damageReduction(event.attackDamage ?? 0),
        msg('高塔铁幕·触发！消耗1防御骰，取消真实伤害'),
      ],
      { defense: 1 },
    );
  }

  /* ── 必杀：效果复杂，暂未实现 ── */
  // 必杀判断：如果 artifact chargeCount 达到要求，但暂时返回不能执行
  // 这里通过检查是否是充能/必杀调用（无匹配事件）来决定

  /* ── 充能：将对方1个攻击骰改为[1] ── */
  if (opponent.zone.attack.length < 1) {
    return cannotExecute('对方没有攻击骰可修改');
  }

  return canExecute([
    changeDiceValue('opponent', 'attack', 1),
    msg('高塔铁幕·充能：将对方1个攻击骰改为[1]'),
  ]);
};