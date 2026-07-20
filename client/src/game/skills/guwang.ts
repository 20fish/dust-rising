/* ═══════════════════════════════════════════════════════════
 * 巴顿二世 — 孤王
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, changeDiceValue, trueDamage, damageReduction, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 高塔铁幕（触发；充能；必杀）
 * 触发：当你受到来自对方的真实伤害时，消耗1个防御骰，取消该真实伤害。
 * 充能：将对方1个攻击骰改为[1]。
 * 必杀：弃置你的全部能力骰。弃置对方与你弃置的能力骰对应种类、对应数量的能力骰。
 *       造成X点真实伤害，X为以此法弃置的双方能力骰数量总和。之后，你获得3个随机点数的防御骰。
 */
export const skillGuwangGaotatiemu: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 触发：受到伤害时消耗1防御骰取消伤害 ── */
  if (event && event.type === 'attackResolved' && event.targetId === selfId && (event.attackDamage ?? 0) > 0) {
    if (self.zone.defense.length < 1) {
      return cannotExecute('高塔铁幕·触发：防御骰不足');
    }
    return canExecute(
      [
        removeDice('self', 'defense', 1),
        damageReduction(event.attackDamage ?? 0),
        msg('高塔铁幕·触发！消耗1防御骰，取消伤害'),
      ],
      { defense: 1 },
    );
  }

  /* ── 必杀：充能达到要求且已激活时 ── */
  const artifact = self.artifacts[2];
  const chargeCount = artifact?.counters?.charge ?? 0;
  if (chargeCount >= 3 && artifact?.isActive) {
    const selfAtk = self.zone.attack.length;
    const selfDef = self.zone.defense.length;
    const selfMed = self.zone.meditation.length;
    const totalSelf = selfAtk + selfDef + selfMed;

    const oppAtk = Math.min(opponent.zone.attack.length, selfAtk);
    const oppDef = Math.min(opponent.zone.defense.length, selfDef);
    const oppMed = Math.min(opponent.zone.meditation.length, selfMed);
    const totalOpp = oppAtk + oppDef + oppMed;
    const totalX = totalSelf + totalOpp;

    const effects: any[] = [];
    if (selfAtk > 0) effects.push(removeDice('self', 'attack', selfAtk));
    if (selfDef > 0) effects.push(removeDice('self', 'defense', selfDef));
    if (selfMed > 0) effects.push(removeDice('self', 'meditation', selfMed));
    if (oppAtk > 0) effects.push(removeDice('opponent', 'attack', oppAtk));
    if (oppDef > 0) effects.push(removeDice('opponent', 'defense', oppDef));
    if (oppMed > 0) effects.push(removeDice('opponent', 'meditation', oppMed));
    effects.push(trueDamage('opponent', totalX));
    effects.push(gainDice('self', 'defense', 3));
    effects.push(msg(`高塔铁幕·必杀！弃置双方${totalX}个骰子，造成${totalX}点真实伤害，获得3个防御骰`));

    return canExecute(effects);
  }

  /* ── 充能：将对方1个攻击骰改为[1] ── */
  if (opponent.zone.attack.length < 1) {
    return cannotExecute('对方没有攻击骰可修改');
  }

  return canExecute([
    changeDiceValue('opponent', 'attack', 1),
    msg('高塔铁幕·充能：将对方1个攻击骰改为[1]'),
  ]);
};