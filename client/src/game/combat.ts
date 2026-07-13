/* ═══════════════════════════════════════════════════════════
 * 战斗系统 - 攻击、防御、伤害计算
 * ═══════════════════════════════════════════════════════════ */

import type { Dice, PlayerState } from '../types/game';

/**
 * 计算多骰攻击的总伤害
 * 多个攻击骰的点数相加，再加攻击加成
 */
export function calculateAttackDamage(
  attackDice: Dice[],
  attackBonus: number = 0
): number {
  return attackDice.reduce((sum, d) => sum + d.value, 0) + attackBonus;
}

/**
 * 处理一次攻击
 * @param attacker - 攻击方
 * @param defender - 防御方
 * @param attackDice - 攻击使用的骰子数组（可多个，点数相加）
 * @param useDefenseDiceId - 防御方使用的防御骰ID（一个防御骰抵挡全部伤害）
 * @returns 处理结果
 */
export function processAttack(
  attacker: PlayerState,
  defender: PlayerState,
  attackDice: Dice[],
  useDefenseDiceId: string | null
): { attacker: PlayerState; defender: PlayerState; damage: number; blocked: boolean } {
  const totalDamage = calculateAttackDamage(attackDice, attacker.attackBonus);

  // 移除攻击使用的骰子
  const newAttacker = { ...attacker };
  const attackIds = new Set(attackDice.map(d => d.id));
  newAttacker.zone = {
    ...newAttacker.zone,
    attack: newAttacker.zone.attack.filter(d => !attackIds.has(d.id)),
  };

  // 防御方使用了一个防御骰抵挡 → 全部伤害归零
  if (useDefenseDiceId) {
    const newDefender = { ...defender };
    newDefender.zone = {
      ...newDefender.zone,
      defense: newDefender.zone.defense.filter(d => d.id !== useDefenseDiceId),
    };
    return { attacker: newAttacker, defender: newDefender, damage: 0, blocked: true };
  }

  // 无人抵挡，扣除生命
  const newDefender = { ...defender, life: Math.max(0, defender.life - totalDamage) };
  return { attacker: newAttacker, defender: newDefender, damage: totalDamage, blocked: false };
}

/**
 * 处理真实伤害（无视防御）
 */
export function processTrueDamage(
  target: PlayerState,
  damage: number
): PlayerState {
  return { ...target, life: Math.max(0, target.life - damage) };
}