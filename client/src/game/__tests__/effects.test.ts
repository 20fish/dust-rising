import { describe, it, expect } from 'vitest';
import type { GameEffect } from '../../../../shared/effects';

describe('GameEffect type', () => {
  it('should accept damage effect', () => {
    const effect: GameEffect = { type: 'damage', target: 'opponent', amount: 5 };
    expect(effect.type).toBe('damage');
    expect(effect.amount).toBe(5);
  });

  it('should accept trueDamage effect', () => {
    const effect: GameEffect = { type: 'trueDamage', target: 'opponent', amount: 3 };
    expect(effect.type).toBe('trueDamage');
  });

  it('should accept heal effect', () => {
    const effect: GameEffect = { type: 'heal', target: 'self', amount: 3 };
    expect(effect.type).toBe('heal');
  });

  it('should accept gainDice effect with specified values', () => {
    const effect: GameEffect = { type: 'gainDice', target: 'self', zone: 'meditation', count: 2, values: [3, 5] };
    expect(effect.zone).toBe('meditation');
    expect(effect.values).toEqual([3, 5]);
  });

  it('should accept removeDice effect with filter', () => {
    const effect: GameEffect = { type: 'removeDice', target: 'opponent', zone: 'defense', count: 1, maxValue: 3 };
    expect(effect.maxValue).toBe(3);
  });

  it('should accept moveDice effect', () => {
    const effect: GameEffect = { type: 'moveDice', fromTarget: 'self', fromZone: 'meditation', toTarget: 'self', toZone: 'attack', count: 1 };
    expect(effect.fromZone).toBe('meditation');
    expect(effect.toZone).toBe('attack');
  });

  it('should accept changeDiceValue effect', () => {
    const effect: GameEffect = { type: 'changeDiceValue', target: 'opponent', zone: 'defense', newValue: 1 };
    expect(effect.newValue).toBe(1);
  });

  it('should accept modifyStat effect', () => {
    const effect: GameEffect = { type: 'modifyStat', target: 'self', stat: 'speed', delta: 2 };
    expect(effect.stat).toBe('speed');
    expect(effect.delta).toBe(2);
  });

  it('should accept dustFall effect', () => {
    const effect: GameEffect = { type: 'dustFall', delta: 1 };
    expect(effect.delta).toBe(1);
  });

  it('should accept setCounter effect', () => {
    const effect: GameEffect = { type: 'setCounter', target: 'self', artifactIndex: 0, counter: 'blood', value: 3 };
    expect(effect.counter).toBe('blood');
  });

  it('should accept ignoreDefense effect', () => {
    const effect: GameEffect = { type: 'ignoreDefense', apply: true };
    expect(effect.apply).toBe(true);
  });

  it('should accept bonusDamage effect', () => {
    const effect: GameEffect = { type: 'bonusDamage', delta: 2 };
    expect(effect.delta).toBe(2);
  });

  it('should accept damageReduction effect', () => {
    const effect: GameEffect = { type: 'damageReduction', amount: 1 };
    expect(effect.amount).toBe(1);
  });

  it('should accept message effect', () => {
    const effect: GameEffect = { type: 'message', text: '技能发动' };
    expect(effect.text).toBe('技能发动');
  });

  it('should accept SkillExecutionResult', () => {
    const result = { effects: [{ type: 'damage' as const, target: 'opponent' as const, amount: 5 }], canExecute: true };
    expect(result.canExecute).toBe(true);
    expect(result.effects).toHaveLength(1);
  });
});
