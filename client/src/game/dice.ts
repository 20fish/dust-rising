/* ═══════════════════════════════════════════════════════════
 * 骰子系统 - 创建、投掷、分配
 * ═══════════════════════════════════════════════════════════ */

import type { Dice, DiceType, DiceValue, DiceDistribution, DiceZone } from '../types/game';

let diceIdCounter = 0;

/** 生成唯一骰子ID */
export function generateDiceId(): string {
  return `dice_${Date.now()}_${++diceIdCounter}`;
}

/** 随机生成一个骰面值 (1-6) */
export function rollDiceValue(): DiceValue {
  return (Math.floor(Math.random() * 6) + 1) as DiceValue;
}

/** 创建一个骰子 */
export function createDice(value?: DiceValue, type?: DiceType): Dice {
  return {
    id: generateDiceId(),
    value: value ?? rollDiceValue(),
    type: type ?? 'attack',
  };
}

/** 批量创建骰子 */
export function createDiceBatch(count: number): Dice[] {
  return Array.from({ length: count }, () => createDice());
}

/** 根据骰点分布规则分配骰子到对应区域 */
export function distributeDice(
  dice: Dice[],
  distribution: DiceDistribution
): DiceZone {
  const zone: DiceZone = { defense: [], attack: [], meditation: [] };

  for (const die of dice) {
    const typeOrTypes = distribution[die.value];
    if (!typeOrTypes) {
      // 无映射时默认归入攻击区
      die.type = 'attack';
      zone.attack.push(die);
      continue;
    }
    if (Array.isArray(typeOrTypes)) {
      // 一点多类型：按骰子分配顺序轮流
      const idx = die.id.charCodeAt(0) % typeOrTypes.length;
      die.type = typeOrTypes[idx];
    } else {
      die.type = typeOrTypes;
    }
    zone[die.type].push(die);
  }

  return zone;
}

/** 按骰面值分组，返回 { [value]: count } */
export function groupDiceByValue(dice: Dice[]): Map<DiceValue, Dice[]> {
  const groups = new Map<DiceValue, Dice[]>();
  for (const die of dice) {
    const group = groups.get(die.value) || [];
    group.push(die);
    groups.set(die.value, group);
  }
  return groups;
}

/** 从区域中移除指定骰子 */
export function removeDiceFromZone(zone: DiceZone, diceIds: string[]): DiceZone {
  return {
    defense: zone.defense.filter(d => !diceIds.includes(d.id)),
    attack: zone.attack.filter(d => !diceIds.includes(d.id)),
    meditation: zone.meditation.filter(d => !diceIds.includes(d.id)),
  };
}