/* ═══════════════════════════════════════════════════════════
 * Effect 创建辅助函数 — 便捷构造 GameEffect 对象
 * ═══════════════════════════════════════════════════════════ */

import type { GameEffect, EffectTarget, ModifiableStat, DiceType, DiceValue } from '../../../shared/effects';
import type { SkillExecutionResult } from '../../../shared/effects';

export const damage = (target: EffectTarget, amount: number): GameEffect =>
  ({ type: 'damage', target, amount });

export const trueDamage = (target: EffectTarget, amount: number): GameEffect =>
  ({ type: 'trueDamage', target, amount });

export const heal = (target: EffectTarget, amount: number): GameEffect =>
  ({ type: 'heal', target, amount });

export const gainDice = (target: EffectTarget, zone: DiceType, count: number, values?: DiceValue[]): GameEffect =>
  ({ type: 'gainDice', target, zone, count, values });

export const removeDice = (target: EffectTarget, zone: DiceType, count: number, filters?: { maxValue?: DiceValue; minValue?: DiceValue; exactValue?: DiceValue }): GameEffect =>
  ({ type: 'removeDice', target, zone, count, ...filters });

export const moveDice = (fromTarget: EffectTarget, fromZone: DiceType, toTarget: EffectTarget, toZone: DiceType, count: number, keepValue?: boolean): GameEffect =>
  ({ type: 'moveDice', fromTarget, fromZone, toTarget, toZone, count, keepValue });

export const changeDiceValue = (target: EffectTarget, zone: DiceType, newValue: DiceValue, oldValue?: DiceValue): GameEffect =>
  ({ type: 'changeDiceValue', target, zone, newValue, oldValue });

export const modifyStat = (target: EffectTarget, stat: ModifiableStat, delta: number): GameEffect =>
  ({ type: 'modifyStat', target, stat, delta });

export const dustFall = (delta: number): GameEffect =>
  ({ type: 'dustFall', delta });

export const setCounter = (target: EffectTarget, artifactIndex: number, counter: string, value: number): GameEffect =>
  ({ type: 'setCounter', target, artifactIndex, counter, value });

export const ignoreDefense = (apply: boolean = true): GameEffect =>
  ({ type: 'ignoreDefense', apply });

export const bonusDamage = (delta: number): GameEffect =>
  ({ type: 'bonusDamage', delta });

export const damageReduction = (amount: number): GameEffect =>
  ({ type: 'damageReduction', amount });

export const message = (text: string): GameEffect =>
  ({ type: 'message', text });

/** 空结果 */
export const noEffect: GameEffect[] = [];

/** 不可执行结果 */
export const cannotExecute = (reason: string): SkillExecutionResult => ({
  effects: noEffect,
  canExecute: false,
  reason,
});

/** 可执行结果 */
export const canExecute = (effects: GameEffect[], cost?: { meditation?: number; attack?: number; defense?: number; life?: number }): SkillExecutionResult => ({
  effects,
  canExecute: true,
  cost,
});
