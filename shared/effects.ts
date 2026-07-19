/* ═══════════════════════════════════════════════════════════
 * GameEffect — 技能效果的数据描述
 *
 * 设计原则:
 *   - 技能函数返回 GameEffect[]，不直接修改状态
 *   - EffectExecutor 统一解析和执行所有 Effect
 *   - 每种 Effect 是一个不可变的数据对象
 * ═══════════════════════════════════════════════════════════ */

import type { DiceType, DiceValue } from './types';

/** Effect 作用目标 */
export type EffectTarget = 'self' | 'opponent';

/** 可修改的玩家属性 */
export type ModifiableStat = 'speed' | 'will' | 'life' | 'attackBonus';

/** ═══════════════════════════════════════════════════════════
 *  基础效果（14种）
 * ═══════════════════════════════════════════════════════════ */

/** 造成伤害（可被防御骰抵挡） */
export interface DamageEffect {
  type: 'damage';
  target: EffectTarget;
  amount: number;
}

/** 造成真实伤害（无视防御） */
export interface TrueDamageEffect {
  type: 'trueDamage';
  target: EffectTarget;
  amount: number;
}

/** 回复生命 */
export interface HealEffect {
  type: 'heal';
  target: EffectTarget;
  amount: number;
}

/** 获得骰子 */
export interface GainDiceEffect {
  type: 'gainDice';
  target: EffectTarget;
  zone: DiceType;
  count: number;
  /** 指定点数（可选，不指定则随机） */
  values?: DiceValue[];
}

/** 移除骰子 */
export interface RemoveDiceEffect {
  type: 'removeDice';
  target: EffectTarget;
  zone: DiceType;
  count: number;
  /** 过滤: 仅移除点数 <= 此值的骰子 */
  maxValue?: DiceValue;
  /** 过滤: 仅移除点数 >= 此值的骰子 */
  minValue?: DiceValue;
  /** 过滤: 仅移除指定点数的骰子 */
  exactValue?: DiceValue;
}

/** 移动骰子（跨区域或跨玩家） */
export interface MoveDiceEffect {
  type: 'moveDice';
  fromTarget: EffectTarget;
  fromZone: DiceType;
  toTarget: EffectTarget;
  toZone: DiceType;
  count: number;
  /** 保留原点数（默认 true） */
  keepValue?: boolean;
}

/** 改变骰子点数 */
export interface ChangeDiceValueEffect {
  type: 'changeDiceValue';
  target: EffectTarget;
  zone: DiceType;
  newValue: DiceValue;
  /** 仅改变指定旧点数（可选，不指定则改变全部） */
  oldValue?: DiceValue;
}

/** 修改玩家属性 */
export interface ModifyStatEffect {
  type: 'modifyStat';
  target: EffectTarget;
  stat: ModifiableStat;
  delta: number;
}

/** 修改尘落计数 */
export interface DustFallEffect {
  type: 'dustFall';
  delta: number;
}

/** 设置神器计数器 */
export interface SetCounterEffect {
  type: 'setCounter';
  target: EffectTarget;
  /** 神器在 artifacts 数组中的索引 (0/1/2) */
  artifactIndex: number;
  /** 计数器名称（如 'charge', 'stack' 等） */
  counter: string;
  /** 设置的值 */
  value: number;
}

/** 本次攻击无视防御 */
export interface IgnoreDefenseEffect {
  type: 'ignoreDefense';
  apply: boolean;
}

/** 本次攻击伤害增减 */
export interface BonusDamageEffect {
  type: 'bonusDamage';
  delta: number;
}

/** 本次攻击伤害减免 */
export interface DamageReductionEffect {
  type: 'damageReduction';
  amount: number;
}

/** 显示消息（UI 用） */
export interface MessageEffect {
  type: 'message';
  text: string;
}

/** ═══════════════════════════════════════════════════════════
 *  联合类型
 * ═══════════════════════════════════════════════════════════ */

export type GameEffect =
  | DamageEffect
  | TrueDamageEffect
  | HealEffect
  | GainDiceEffect
  | RemoveDiceEffect
  | MoveDiceEffect
  | ChangeDiceValueEffect
  | ModifyStatEffect
  | DustFallEffect
  | SetCounterEffect
  | IgnoreDefenseEffect
  | BonusDamageEffect
  | DamageReductionEffect
  | MessageEffect;

/** 技能执行结果 */
export interface SkillExecutionResult {
  /** 产生的效果列表 */
  effects: GameEffect[];
  /** 是否可执行 */
  canExecute: boolean;
  /** 不可执行时的原因 */
  reason?: string;
  /** 消耗的资源（用于 UI 展示） */
  cost?: {
    meditation?: number;
    attack?: number;
    defense?: number;
    life?: number;
  };
}
