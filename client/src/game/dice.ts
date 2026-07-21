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
    const type = distribution[die.value];
    if (!type) {
      // 无映射时默认归入攻击区
      die.type = 'attack';
      zone.attack.push(die);
      continue;
    }
    die.type = type;
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

/* ═══════════════════════════════════════════════════════════
 *  供应堆 — 骰子池操作
 * ═══════════════════════════════════════════════════════════ */

/** 初始化供应堆：每种点数1个（共6个） */
export function createDicePool(): Dice[] {
  return ([1, 2, 3, 4, 5, 6] as DiceValue[]).map(v => createDice(v));
}

/** 从供应堆取指定点数的骰子，返回 { 取出的骰子, 新的供应堆 } */
export function takeFromPool(pool: Dice[], value: DiceValue): { die: Dice | null; pool: Dice[] } {
  const idx = pool.findIndex(d => d.value === value);
  if (idx === -1) return { die: null, pool };
  const die = pool[idx];
  return { die, pool: [...pool.slice(0, idx), ...pool.slice(idx + 1)] };
}

/** 从供应堆取任意数量的骰子（按点数升序），返回 { 取出的骰子, 新的供应堆 } */
export function takeFromPoolByCount(pool: Dice[], count: number): { dice: Dice[]; pool: Dice[] } {
  const taken: Dice[] = [];
  let remaining = [...pool];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    taken.push(remaining[0]);
    remaining = remaining.slice(1);
  }
  return { dice: taken, pool: remaining };
}

/** 归还骰子到供应堆 */
export function returnToPool(pool: Dice[], dice: Dice[]): Dice[] {
  return [...pool, ...dice];
}