import { describe, it, expect } from 'vitest';
import { BUILTIN_ARTIFACTS } from '../../../../shared/artifactData';

describe('artifactData — 36件神器数据完整性', () => {
  it('should have 36 artifacts', () => {
    expect(BUILTIN_ARTIFACTS.length).toBe(36);
  });

  it('should have 12 artifacts per column', () => {
    const col0 = BUILTIN_ARTIFACTS.filter(a => a.column === 0);
    const col1 = BUILTIN_ARTIFACTS.filter(a => a.column === 1);
    const col2 = BUILTIN_ARTIFACTS.filter(a => a.column === 2);
    expect(col0.length).toBe(12);
    expect(col1.length).toBe(12);
    expect(col2.length).toBe(12);
  });

  it('should have unique IDs', () => {
    const ids = BUILTIN_ARTIFACTS.map(a => a.id);
    expect(new Set(ids).size).toBe(36);
  });

  it('all column 0 artifacts should have speed+will>0', () => {
    for (const a of BUILTIN_ARTIFACTS.filter(a => a.column === 0)) {
      expect(a.speed + a.will).toBeGreaterThan(0);
    }
  });

  it('all column 2 artifacts should have life>0 and chargeRequirement>0', () => {
    for (const a of BUILTIN_ARTIFACTS.filter(a => a.column === 2)) {
      expect(a.life).toBeGreaterThan(0);
      expect(a.chargeRequirement).toBeGreaterThan(0);
    }
  });

  it('all column 1 artifacts should have non-empty diceDistribution', () => {
    for (const a of BUILTIN_ARTIFACTS.filter(a => a.column === 1)) {
      expect(Object.keys(a.diceDistribution).length).toBeGreaterThan(0);
    }
  });

  it('all artifacts should have at least 1 skill', () => {
    for (const a of BUILTIN_ARTIFACTS) {
      expect(a.skills.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('all skills should have non-empty skillId', () => {
    for (const a of BUILTIN_ARTIFACTS) {
      for (const s of a.skills) {
        expect(s.skillId).toBeTruthy();
      }
    }
  });
});
