# Effect 系统重构 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将技能效果从"函数直接改状态"重构为"函数返回 Effect 数据 → 统一执行器应用"，实现技能逻辑与状态变更解耦。

**Architecture:** 技能函数（SkillFn）不再直接返回 `Partial<PlayerState>`，而是返回 `GameEffect[]`（纯数据描述）。新增 `EffectExecutor` 纯函数，接收 `GameState` + `GameEffect[]`，返回新 `GameState`。所有状态变更集中在执行器中处理。

**Tech Stack:** TypeScript, Vitest (测试框架), 现有 Zustand Store

**验证标准（A 阶段完成条件）：**
1. `shared/effects.ts` 中定义了完整的 `GameEffect` 联合类型
2. `effectExecutor.ts` 中所有 effect 类型都有对应的处理逻辑
3. 现有 12 个旧技能全部重构为返回 `GameEffect[]`
4. `gameStore.ts` 中 `useSkill` / `doAttack` 通过 `EffectExecutor` 应用效果
5. 所有测试通过：`npx vitest run`
6. Vite 编译通过：`npx vite build` 无错误
7. 游戏可在浏览器中正常运行（创建房间、轮选、对战流程不被破坏）

---

## 文件结构总览

```
dust-rising/
├── shared/
│   ├── types.ts                    # 修改: 新增 SkillType, 修改 Skill 接口
│   └── effects.ts                  # 新增: GameEffect 联合类型定义
├── client/
│   ├── package.json                # 修改: 添加 vitest + 依赖
│   ├── tsconfig.app.json           # 确认 includes 包含 tests
│   ├── vitest.config.ts            # 新增: vitest 配置
│   └── src/
│       ├── game/
│       │   ├── effects.ts          # 新增: Effect 创建辅助函数
│       │   ├── effectExecutor.ts  # 新增: Effect 执行器（纯函数）
│       │   ├── skills.ts           # 重写: 所有技能返回 GameEffect[]
│       │   └── __tests__/
│       │       ├── effects.test.ts       # 新增: Effect 类型测试
│       │       ├── effectExecutor.test.ts # 新增: 执行器测试
│       │       └── skills.test.ts        # 新增: 技能 → Effect 测试
│       └── store/
│           └── gameStore.ts        # 修改: useSkill/doAttack 改用 EffectExecutor
```

---

### Task 0: 搭建 Vitest 测试框架

**Files:**
- Modify: `client/package.json`
- Create: `client/vitest.config.ts`

- [ ] **Step 1: 安装 vitest**

Run:
```bash
cd /workspace/dust-rising/client && npm install -D vitest @types/node 2>&1 | tail -5
```

Expected: `added X packages` 无报错

- [ ] **Step 2: 创建 vitest 配置**

Create `client/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';
import tsconfigApp from './tsconfig.app.json';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 3: 在 package.json 添加 test 脚本**

在 `client/package.json` 的 `scripts` 中添加：

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 写一个空测试验证框架可用**

Create `client/src/game/__tests__/setup.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: 运行测试验证框架**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: `PASS src/game/__tests__/setup.test.ts`

- [ ] **Step 6: 提交**

```bash
cd /workspace/dust-rising && git add client/package.json client/package-lock.json client/vitest.config.ts client/src/game/__tests__/setup.test.ts && git commit -m "chore: 添加 vitest 测试框架"
```

---

### Task 1: 定义 GameEffect 联合类型

**Files:**
- Create: `shared/effects.ts`
- Modify: `shared/types.ts` — 更新 `SkillType` 和 `Skill` 接口

- [ ] **Step 1: 写 Effect 类型的测试**

Create `client/src/game/__tests__/effects.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { GameEffect } from '../../../../shared/effects';

describe('GameEffect type', () => {
  it('should accept damage effect', () => {
    const effect: GameEffect = {
      type: 'damage',
      target: 'opponent',
      amount: 5,
    };
    expect(effect.type).toBe('damage');
    expect(effect.amount).toBe(5);
  });

  it('should accept heal effect', () => {
    const effect: GameEffect = {
      type: 'heal',
      target: 'self',
      amount: 3,
    };
    expect(effect.type).toBe('heal');
  });

  it('should accept gainDice effect with specified values', () => {
    const effect: GameEffect = {
      type: 'gainDice',
      target: 'self',
      zone: 'meditation',
      count: 2,
      values: [3, 5],
    };
    expect(effect.zone).toBe('meditation');
    expect(effect.values).toEqual([3, 5]);
  });

  it('should accept removeDice effect with filter', () => {
    const effect: GameEffect = {
      type: 'removeDice',
      target: 'opponent',
      zone: 'defense',
      count: 1,
      maxValue: 3,
    };
    expect(effect.maxValue).toBe(3);
  });

  it('should accept moveDice effect', () => {
    const effect: GameEffect = {
      type: 'moveDice',
      fromTarget: 'self',
      fromZone: 'meditation',
      toTarget: 'self',
      toZone: 'attack',
      count: 1,
    };
    expect(effect.fromZone).toBe('meditation');
    expect(effect.toZone).toBe('attack');
  });

  it('should accept changeDiceValue effect', () => {
    const effect: GameEffect = {
      type: 'changeDiceValue',
      target: 'opponent',
      zone: 'defense',
      newValue: 1,
    };
    expect(effect.newValue).toBe(1);
  });

  it('should accept modifyStat effect', () => {
    const effect: GameEffect = {
      type: 'modifyStat',
      target: 'self',
      stat: 'speed',
      delta: 2,
    };
    expect(effect.stat).toBe('speed');
    expect(effect.delta).toBe(2);
  });

  it('should accept dustFall effect', () => {
    const effect: GameEffect = {
      type: 'dustFall',
      delta: 1,
    };
    expect(effect.delta).toBe(1);
  });

  it('should accept setCounter effect', () => {
    const effect: GameEffect = {
      type: 'setCounter',
      target: 'self',
      artifactIndex: 0,
      counter: 'blood',
      value: 3,
    };
    expect(effect.counter).toBe('blood');
  });

  it('should accept ignoreDefense effect', () => {
    const effect: GameEffect = {
      type: 'ignoreDefense',
      apply: true,
    };
    expect(effect.apply).toBe(true);
  });

  it('should accept message effect', () => {
    const effect: GameEffect = {
      type: 'message',
      text: '技能发动',
    };
    expect(effect.text).toBe('技能发动');
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/effects.test.ts
```

Expected: FAIL — `Cannot find module '../../../../shared/effects'`

- [ ] **Step 3: 创建 shared/effects.ts**

Create `shared/effects.ts`:

```typescript
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
  /** 保留原点数（默认 true，新区域按骰点分布重分配时设 false） */
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
  /** 计数器名称（如 'charge', 'blood', 'stack' 等） */
  counter: string;
  /** 设置的值（若为负数则减少） */
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

/** 技能执行结果 — 替代旧的 SkillResult */
export interface SkillExecutionResult {
  /** 产生的效果列表 */
  effects: GameEffect[];
  /** 是否可执行（前置条件是否满足） */
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
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/effects.test.ts
```

Expected: PASS — 全部 11 个测试通过

- [ ] **Step 5: 提交**

```bash
cd /workspace/dust-rising && git add shared/effects.ts client/src/game/__tests__/effects.test.ts && git commit -m "feat: 定义 GameEffect 联合类型（14种效果）"
```

---

### Task 2: 实现 EffectExecutor 纯函数

**Files:**
- Create: `client/src/game/effectExecutor.ts`
- Create: `client/src/game/effects.ts`
- Create: `client/src/game/__tests__/effectExecutor.test.ts`

- [ ] **Step 1: 写 EffectExecutor 的测试**

Create `client/src/game/__tests__/effectExecutor.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { executeEffects } from '../effectExecutor';
import type { GameState, PlayerState } from '../../../../shared/types';
import type { GameEffect } from '../../../../shared/effects';

/** 创建最小可用的测试 GameState */
function createTestGame(): GameState {
  const player: PlayerState = {
    playerId: 'p1',
    name: '玩家',
    artifacts: [
      { id: 'a1', name: 'test', column: 0, source: 'builtin', version: 1,
        speed: 4, will: 7, life: 50, chargeRequirement: 4,
        diceDistribution: { 1: 'defense', 2: 'attack', 3: 'defense', 4: 'attack', 5: 'defense', 6: 'attack' },
        skills: [], imageKey: 'test', isActive: false, chargeCount: 0,
      },
      null, null,
    ],
    zone: { defense: [{ id: 'd1', type: 'defense', value: 3 }], attack: [{ id: 'a1', type: 'attack', value: 5 }], meditation: [{ id: 'm1', type: 'meditation', value: 2 }] },
    speed: 4, will: 7, life: 50, attackBonus: 0,
    hasDustSeal: false, chargeCount: 4,
  };
  const opponent: PlayerState = {
    ...player,
    playerId: 'p2', name: '对手',
    zone: { defense: [{ id: 'd2', type: 'defense', value: 4 }], attack: [{ id: 'a2', type: 'attack', value: 3 }], meditation: [] },
    life: 50,
  };
  return {
    player, opponent,
    currentPlayerId: 'p1', phase: 'main', round: 1,
    dustFallCounter: 0, selectedDiceIds: [],
    isGameOver: false, winnerId: null,
  };
}

/** 判断 target 是 self 时返回 player，opponent 时返回 opponent */
function resolveTarget(game: GameState, target: 'self' | 'opponent', selfId: string): PlayerState {
  return target === 'self'
    ? game.player.playerId === selfId ? game.player : game.opponent
    : game.player.playerId === selfId ? game.opponent : game.player;
}

describe('EffectExecutor', () => {
  const selfId = 'p1';

  describe('damage effect', () => {
    it('should reduce opponent life by amount', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'damage', target: 'opponent', amount: 8 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.opponent.life).toBe(42); // 50 - 8
    });

    it('should not go below 0', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'damage', target: 'opponent', amount: 999 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.opponent.life).toBe(0);
    });

    it('should damage self when target is self', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'damage', target: 'self', amount: 10 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.player.life).toBe(40);
    });
  });

  describe('trueDamage effect', () => {
    it('should reduce opponent life ignoring defense', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'trueDamage', target: 'opponent', amount: 5 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.opponent.life).toBe(45);
    });
  });

  describe('heal effect', () => {
    it('should restore self life', () => {
      const game = { ...createTestGame(), player: { ...createTestGame().player, life: 30 } };
      const effects: GameEffect[] = [{ type: 'heal', target: 'self', amount: 10 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.player.life).toBe(40);
    });

    it('should not exceed initial life', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'heal', target: 'self', amount: 999 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.player.life).toBe(50);
    });
  });

  describe('gainDice effect', () => {
    it('should add random dice to self meditation zone', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'gainDice', target: 'self', zone: 'meditation', count: 2 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.player.zone.meditation.length).toBe(3); // was 1, gained 2
    });

    it('should add dice with specified values', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'gainDice', target: 'self', zone: 'attack', count: 2, values: [5, 6] }];
      const result = executeEffects(game, effects, selfId);
      expect(result.player.zone.attack.length).toBe(3);
      const newDice = result.player.zone.attack.filter(d => d.value === 5 || d.value === 6);
      expect(newDice.length).toBe(2);
    });
  });

  describe('removeDice effect', () => {
    it('should remove dice from opponent defense zone', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'removeDice', target: 'opponent', zone: 'defense', count: 1 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.opponent.zone.defense.length).toBe(0); // was 1, removed 1
    });

    it('should remove dice with maxValue filter', () => {
      const game = {
        ...createTestGame(),
        player: {
          ...createTestGame().player,
          zone: {
            defense: [
              { id: 'x1', type: 'defense', value: 2 },
              { id: 'x2', type: 'defense', value: 5 },
              { id: 'x3', type: 'defense', value: 1 },
            ],
            attack: [],
            meditation: [],
          },
        },
      };
      const effects: GameEffect[] = [{ type: 'removeDice', target: 'self', zone: 'defense', count: 10, maxValue: 3 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.player.zone.defense.length).toBe(1); // only value:5 remains
      expect(result.player.zone.defense[0].value).toBe(5);
    });
  });

  describe('modifyStat effect', () => {
    it('should increase self speed', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'modifyStat', target: 'self', stat: 'speed', delta: 2 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.player.speed).toBe(6); // 4 + 2
    });

    it('should decrease opponent attackBonus', () => {
      const game = { ...createTestGame(), opponent: { ...createTestGame().opponent, attackBonus: 3 } };
      const effects: GameEffect[] = [{ type: 'modifyStat', target: 'opponent', stat: 'attackBonus', delta: -1 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.opponent.attackBonus).toBe(2);
    });
  });

  describe('dustFall effect', () => {
    it('should increase dustFallCounter', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'dustFall', delta: 1 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.dustFallCounter).toBe(1);
    });
  });

  describe('setCounter effect', () => {
    it('should set counter on self artifact', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'setCounter', target: 'self', artifactIndex: 0, counter: 'stack', value: 3 }];
      const result = executeEffects(game, effects, selfId);
      expect(result.player.artifacts[0]?.counters?.stack).toBe(3);
    });
  });

  describe('message effect', () => {
    it('should collect messages in meta', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [{ type: 'message', text: 'hello' }, { type: 'message', text: 'world' }];
      const result = executeEffects(game, effects, selfId);
      expect(result._meta.messages).toEqual(['hello', 'world']);
    });
  });

  describe('multiple effects', () => {
    it('should apply effects in order', () => {
      const game = createTestGame();
      const effects: GameEffect[] = [
        { type: 'damage', target: 'opponent', amount: 10 },
        { type: 'heal', target: 'self', amount: 5 },
        { type: 'dustFall', delta: 1 },
      ];
      const result = executeEffects(game, effects, selfId);
      expect(result.opponent.life).toBe(40);
      expect(result.player.life).toBe(50); // already full, no change
      expect(result.dustFallCounter).toBe(1);
    });
  });

  describe('immutability', () => {
    it('should not mutate the original game state', () => {
      const game = createTestGame();
      const originalLife = game.opponent.life;
      const effects: GameEffect[] = [{ type: 'damage', target: 'opponent', amount: 10 }];
      executeEffects(game, effects, selfId);
      expect(game.opponent.life).toBe(originalLife); // unchanged
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/effectExecutor.test.ts
```

Expected: FAIL — `Cannot find module '../effectExecutor'`

- [ ] **Step 3: 更新 types.ts 支持 counters**

在 `shared/types.ts` 的 `Artifact` 接口中添加 `counters` 字段：

在 `Artifact` 接口（第 94-98 行）中，在 `chargeCount: number;` 后面添加：

```typescript
  /** 通用计数器（技能使用的各种叠加层数等） */
  counters: Record<string, number>;
```

同时更新 `createArtifactInstance` 函数：

```typescript
export function createArtifactInstance(def: ArtifactDef): Artifact {
  return {
    ...def,
    isActive: false,
    chargeCount: 0,
    counters: {},
  };
}
```

- [ ] **Step 4: 创建 effects.ts 辅助函数**

Create `client/src/game/effects.ts`:

```typescript
/* ═══════════════════════════════════════════════════════════
 * Effect 创建辅助函数 — 便捷构造 GameEffect 对象
 * ═══════════════════════════════════════════════════════════ */

import type { GameEffect, EffectTarget, ModifiableStat, DiceType, DiceValue } from '../../../shared/effects';

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
export const cannotExecute = (reason: string) => ({
  effects: noEffect,
  canExecute: false,
  reason,
});

/** 可执行结果 */
export const canExecute = (effects: GameEffect[], cost?: { meditation?: number; attack?: number; defense?: number; life?: number }) => ({
  effects,
  canExecute: true,
  cost,
});
```

- [ ] **Step 5: 创建 effectExecutor.ts**

Create `client/src/game/effectExecutor.ts`:

```typescript
/* ═══════════════════════════════════════════════════════════
 * EffectExecutor — 统一执行 GameEffect[]
 *
 * 设计原则:
 *   - 纯函数，不修改输入状态
 *   - 按顺序逐个执行 effect
 *   - 返回新 GameState + 元信息（消息等）
 * ═══════════════════════════════════════════════════════════ */

import type { GameState, PlayerState, Dice, DiceValue } from '../../../shared/types';
import type { GameEffect } from '../../../shared/effects';
import { rollDiceValue, generateDiceId } from './dice';

/** 执行器元信息（不存入 GameState，仅用于 UI 展示） */
export interface EffectMeta {
  messages: string[];
  totalDamageToOpponent: number;
  totalDamageToSelf: number;
  totalHealToSelf: number;
}

const EMPTY_META: EffectMeta = {
  messages: [],
  totalDamageToOpponent: 0,
  totalDamageToSelf: 0,
  totalHealToSelf: 0,
};

/** 执行结果 */
export interface EffectResult {
  game: GameState;
  meta: EffectMeta;
}

/** 执行一组 Effect，返回新的 GameState */
export function executeEffects(
  game: GameState,
  effects: GameEffect[],
  selfId: string
): GameState & { _meta: EffectMeta } {
  let current = { ...game, _meta: { ...EMPTY_META } };

  for (const effect of effects) {
    current = applyOneEffect(current, effect, selfId);
  }

  // 将 _meta 从 game 中剥离用于返回
  const { _meta, ...finalGame } = current;
  return { ...finalGame, _meta };
}

/** 应用单个 Effect */
function applyOneEffect(
  state: GameState & { _meta: EffectMeta },
  effect: GameEffect,
  selfId: string
): GameState & { _meta: EffectMeta } {
  switch (effect.type) {
    case 'damage':
      return applyDamage(state, effect, selfId);
    case 'trueDamage':
      return applyTrueDamage(state, effect, selfId);
    case 'heal':
      return applyHeal(state, effect, selfId);
    case 'gainDice':
      return applyGainDice(state, effect, selfId);
    case 'removeDice':
      return applyRemoveDice(state, effect, selfId);
    case 'moveDice':
      return applyMoveDice(state, effect, selfId);
    case 'changeDiceValue':
      return applyChangeDiceValue(state, effect, selfId);
    case 'modifyStat':
      return applyModifyStat(state, effect, selfId);
    case 'dustFall':
      return { ...state, dustFallCounter: state.dustFallCounter + effect.delta };
    case 'setCounter':
      return applySetCounter(state, effect, selfId);
    case 'ignoreDefense':
    case 'bonusDamage':
    case 'damageReduction':
      // 战斗修饰器：在攻击流程中由 gameStore 读取
      return state;
    case 'message':
      return { ...state, _meta: { ...state._meta, messages: [...state._meta.messages, effect.text] } };
    default:
      return state;
  }
}

/** 获取目标玩家，返回 [新 state, 新目标玩家] */
function targetPair(
  state: GameState,
  target: 'self' | 'opponent',
  selfId: string
): [GameState & { _meta: EffectMeta }, PlayerState, PlayerState] {
  const isPlayer = state.player.playerId === selfId;
  if (target === 'self') {
    return isPlayer
      ? [state, state.player, state.opponent]
      : [state, state.opponent, state.player];
  }
  return isPlayer
    ? [state, state.opponent, state.player]
    : [state, state.player, state.opponent];
}

function setPlayer(state: GameState, selfId: string, who: 'self' | 'opponent', player: PlayerState): GameState {
  const isPlayer = state.player.playerId === selfId;
  if (who === 'self') {
    return isPlayer ? { ...state, player } : { ...state, opponent: player };
  }
  return isPlayer ? { ...state, opponent: player } : { ...state, player };
}

/* ── 各 Effect 处理函数 ── */

function applyDamage(state: GameState & { _meta: EffectMeta }, effect: { type: 'damage'; target: 'self' | 'opponent'; amount: number }, selfId: string) {
  const [s, target, _] = targetPair(state, effect.target, selfId);
  const newTarget = { ...target, life: Math.max(0, target.life - effect.amount) };
  const updated = setPlayer(s, selfId, effect.target, newTarget);
  const meta = { ...updated._meta };
  if (effect.target === 'opponent' && s.player.playerId === selfId) meta.totalDamageToOpponent += effect.amount;
  else meta.totalDamageToSelf += effect.amount;
  return { ...updated, _meta: meta };
}

function applyTrueDamage(state: GameState & { _meta: EffectMeta }, effect: { type: 'trueDamage'; target: 'self' | 'opponent'; amount: number }, selfId: string) {
  // 真实伤害逻辑与普通伤害相同（区别在于战斗流程中是否被防御骰抵消）
  return applyDamage({ ...state }, { type: 'damage', target: effect.target, amount: effect.amount }, selfId);
}

function applyHeal(state: GameState & { _meta: EffectMeta }, effect: { type: 'heal'; target: 'self' | 'opponent'; amount: number }, selfId: string) {
  const [s, target, _] = targetPair(state, effect.target, selfId);
  const [_, other] = targetPair(state, effect.target === 'self' ? 'opponent' : 'self', selfId);
  // 生命上限 = artifacts[2].life（第三列神器的生命值）
  const maxLife = target.artifacts[2]?.life ?? 50;
  const newLife = Math.min(maxLife, target.life + effect.amount);
  const newTarget = { ...target, life: newLife };
  const updated = setPlayer(s, selfId, effect.target, newTarget);
  const meta = { ...updated._meta };
  if (effect.target === 'self') meta.totalHealToSelf += Math.min(effect.amount, maxLife - target.life);
  return { ...updated, _meta: meta };
}

function applyGainDice(state: GameState & { _meta: EffectMeta }, effect: { type: 'gainDice'; target: 'self' | 'opponent'; zone: 'defense' | 'attack' | 'meditation'; count: number; values?: DiceValue[] }, selfId: string) {
  const [s, target, _] = targetPair(state, effect.target, selfId);
  const newDice: Dice[] = Array.from({ length: effect.count }, (_, i) => ({
    id: generateDiceId(),
    value: effect.values?.[i] ?? rollDiceValue(),
    type: effect.zone,
  }));
  const newTarget = {
    ...target,
    zone: { ...target.zone, [effect.zone]: [...target.zone[effect.zone], ...newDice] },
  };
  return setPlayer(s, selfId, effect.target, newTarget);
}

function applyRemoveDice(state: GameState & { _meta: EffectMeta }, effect: { type: 'removeDice'; target: 'self' | 'opponent'; zone: 'defense' | 'attack' | 'meditation'; count: number; maxValue?: number; minValue?: number; exactValue?: number }, selfId: string) {
  const [s, target, _] = targetPair(state, effect.target, selfId);
  let pool = [...target.zone[effect.zone]];

  // 按过滤条件排序：优先移除匹配条件的
  pool.sort((a, b) => {
    const aMatch = matchesFilter(a.value, effect);
    const bMatch = matchesFilter(b.value, effect);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });

  const toRemove = new Set(pool.slice(0, effect.count).map(d => d.id));
  const remaining = pool.filter(d => !toRemove.has(d.id));
  const newTarget = {
    ...target,
    zone: { ...target.zone, [effect.zone]: remaining },
  };
  return setPlayer(s, selfId, effect.target, newTarget);
}

function matchesFilter(value: number, filter: { maxValue?: number; minValue?: number; exactValue?: number }): boolean {
  if (filter.exactValue !== undefined) return value === filter.exactValue;
  if (filter.maxValue !== undefined && filter.minValue !== undefined) return value >= filter.minValue && value <= filter.maxValue;
  if (filter.maxValue !== undefined) return value <= filter.maxValue;
  if (filter.minValue !== undefined) return value >= filter.minValue;
  return true; // 无过滤条件
}

function applyMoveDice(state: GameState & { _meta: EffectMeta }, effect: { type: 'moveDice'; fromTarget: 'self' | 'opponent'; fromZone: 'defense' | 'attack' | 'meditation'; toTarget: 'self' | 'opponent'; toZone: 'defense' | 'attack' | 'meditation'; count: number; keepValue?: boolean }, selfId: string) {
  // 1. 从来源移除
  const [s1, fromPlayer, _] = targetPair(state, effect.fromTarget, selfId);
  const sourcePool = [...fromPlayer.zone[effect.fromZone]];
  const toMove = sourcePool.slice(0, effect.count);
  const remainingSource = sourcePool.slice(effect.count);
  const updatedFrom = {
    ...fromPlayer,
    zone: { ...fromPlayer.zone, [effect.fromZone]: remainingSource },
  };
  let stateAfter = setPlayer(s1, selfId, effect.fromTarget, updatedFrom);

  // 2. 放到目标（保留或修改点数）
  const [s2, toPlayer, __] = targetPair(stateAfter, effect.toTarget, selfId);
  const movedDice: Dice[] = toMove.map(d => ({
    ...d,
    type: effect.toZone,
    value: effect.keepValue !== false ? d.value : rollDiceValue(),
  }));
  const updatedTo = {
    ...toPlayer,
    zone: { ...toPlayer.zone, [effect.toZone]: [...toPlayer.zone[effect.toZone], ...movedDice] },
  };
  return setPlayer(s2, selfId, effect.toTarget, updatedTo);
}

function applyChangeDiceValue(state: GameState & { _meta: EffectMeta }, effect: { type: 'changeDiceValue'; target: 'self' | 'opponent'; zone: 'defense' | 'attack' | 'meditation'; newValue: number; oldValue?: number }, selfId: string) {
  const [s, target, _] = targetPair(state, effect.target, selfId);
  const updated = target.zone[effect.zone].map(d => {
    if (effect.oldValue !== undefined && d.value !== effect.oldValue) return d;
    return { ...d, value: effect.newValue as DiceValue };
  });
  const newTarget = { ...target, zone: { ...target.zone, [effect.zone]: updated } };
  return setPlayer(s, selfId, effect.target, newTarget);
}

function applyModifyStat(state: GameState & { _meta: EffectMeta }, effect: { type: 'modifyStat'; target: 'self' | 'opponent'; stat: string; delta: number }, selfId: string) {
  const [s, target, _] = targetPair(state, effect.target, selfId);
  const stat = effect.stat as keyof Pick<PlayerState, 'speed' | 'will' | 'life' | 'attackBonus'>;
  const current = typeof target[stat] === 'number' ? (target[stat] as number) : 0;
  const newTarget = { ...target, [stat]: current + effect.delta };
  return setPlayer(s, selfId, effect.target, newTarget);
}

function applySetCounter(state: GameState & { _meta: EffectMeta }, effect: { type: 'setCounter'; target: 'self' | 'opponent'; artifactIndex: number; counter: string; value: number }, selfId: string) {
  const [s, target, _] = targetPair(state, effect.target, selfId);
  const artifact = target.artifacts[effect.artifactIndex];
  if (!artifact) return s;
  const newArtifact = {
    ...artifact,
    counters: { ...artifact.counters, [effect.counter]: effect.value },
  };
  const newArtifacts = [...target.artifacts] as typeof target.artifacts;
  newArtifacts[effect.artifactIndex] = newArtifact;
  const newTarget = { ...target, artifacts: newArtifacts };
  return setPlayer(s, selfId, effect.target, newTarget);
}
```

- [ ] **Step 6: 运行测试确认通过**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/effectExecutor.test.ts
```

Expected: PASS — 全部测试通过

- [ ] **Step 7: 提交**

```bash
cd /workspace/dust-rising && git add shared/types.ts shared/effects.ts client/src/game/effects.ts client/src/game/effectExecutor.ts client/src/game/__tests__/effectExecutor.test.ts && git commit -m "feat: 实现 EffectExecutor 纯函数（14种效果处理）"
```

---

### Task 3: 重构 skills.ts — 返回 GameEffect[]

**Files:**
- Modify: `client/src/game/skills.ts`
- Create: `client/src/game/__tests__/skills.test.ts`

- [ ] **Step 1: 写技能重构的测试**

Create `client/src/game/__tests__/skills.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { GameState } from '../../../../shared/types';
import { skillYuqieZhanji, skillJingangJingangShen } from '../skills';

function createTestContext(): GameState {
  return {
    player: {
      playerId: 'p1', name: '玩家',
      artifacts: [] as any,
      zone: { defense: [], attack: [], meditation: [{ id: 'm1', type: 'meditation', value: 3 }] },
      speed: 4, will: 7, life: 50, attackBonus: 0,
      hasDustSeal: false, chargeCount: 4,
    },
    opponent: {
      playerId: 'p2', name: '对手',
      artifacts: [] as any,
      zone: { defense: [{ id: 'd1', type: 'defense', value: 4 }], attack: [], meditation: [] },
      speed: 4, will: 7, life: 50, attackBonus: 0,
      hasDustSeal: false, chargeCount: 4,
    },
    currentPlayerId: 'p1', phase: 'main', round: 1,
    dustFallCounter: 0, selectedDiceIds: [],
    isGameOver: false, winnerId: null,
  };
}

describe('重构后的技能返回 Effect', () => {
  it('skillYuqieZhanji: 消耗1冥想骰，造成2点额外伤害', () => {
    const ctx = createTestContext();
    const result = skillYuqieZhanji(ctx);
    expect(result.canExecute).toBe(true);
    expect(result.effects).toBeDefined();
    // 应该有 removeDice (消耗冥想) + bonusDamage 或 damage
    const hasDamageOrBonus = result.effects.some(e => e.type === 'bonusDamage' || e.type === 'damage');
    expect(hasDamageOrBonus).toBe(true);
  });

  it('skillYuqieZhanji: 无冥想骰时不可执行', () => {
    const ctx = createTestContext();
    ctx.player.zone.meditation = []; // 清空冥想骰
    const result = skillYuqieZhanji(ctx);
    expect(result.canExecute).toBe(false);
  });

  it('skillJingangJingangShen: 持续减伤效果', () => {
    const ctx = createTestContext();
    const result = skillJingangJingangShen(ctx);
    expect(result.canExecute).toBe(true);
    expect(result.effects).toBeDefined();
    const hasDmgReduction = result.effects.some(e => e.type === 'damageReduction');
    expect(hasDmgReduction).toBe(true);
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/skills.test.ts
```

Expected: FAIL — 导入的函数签名不匹配

- [ ] **Step 3: 重构 skills.ts**

重写 `client/src/game/skills.ts` 的核心接口和所有技能函数。保留旧的导出名称但改签名。

**关键改动：**
1. 删除旧的 `SkillResult` 接口
2. 删除旧的 `SkillContext` 接口
3. 新的 `SkillFn` 签名：`(game: GameState, selfId: string, triggerData?: TriggerData) => SkillExecutionResult`
4. 每个技能函数返回 `{ effects: GameEffect[], canExecute: boolean, reason?: string, cost?: {...} }`
5. 保留 `SKILL_REGISTRY` 但值类型更新
6. 保留 `getSkillFn` 和 `executeSkillsByType` 但实现改用 EffectExecutor

由于此文件改动量大（每个技能都需要重写），执行时参考 `shared/effects.ts` 和 `client/src/game/effects.ts` 中的辅助函数。每个技能重构模式：

```typescript
// 旧模式：
export const skillYuqieZhanji: SkillFn = (ctx) => {
  if (!hasMeditation(ctx.owner)) return { canExecute: false };
  return { bonusDamage: 2, meditationCost: 1, canExecute: true };
};

// 新模式：
export const skillYuqieZhanji = (game: GameState, selfId: string): SkillExecutionResult => {
  const player = resolveSelf(game, selfId);
  if (player.zone.meditation.length < 1) return cannotExecute('冥想骰不足');
  return canExecute([
    removeDice('self', 'meditation', 1),
    bonusDamage(2),
  ], { meditation: 1 });
};
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/skills.test.ts
```

Expected: PASS

- [ ] **Step 5: 运行全部测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: 全部 PASS

- [ ] **Step 6: 提交**

```bash
cd /workspace/dust-rising && git add client/src/game/skills.ts client/src/game/__tests__/skills.test.ts && git commit -m "refactor: 技能函数重构为返回 GameEffect[]"
```

---

### Task 4: 更新 gameStore.ts — 使用 EffectExecutor

**Files:**
- Modify: `client/src/store/gameStore.ts`

- [ ] **Step 1: 修改 useSkill 方法**

将 `gameStore.ts` 中的 `useSkill` 方法从直接展开 `SkillResult` 改为通过 `executeEffects` 应用：

旧代码（约第 700-730 行）:
```typescript
useSkill: (skillId: string) => {
  // ...
  const result = fn(ctx);
  if (!result.canExecute) return result;
  const updatedOwner = result.owner ? { ...owner, ...result.owner } : owner;
  const updatedOpponent = result.opponent ? { ...opponent, ...result.opponent } : opponent;
  // ...
},
```

新代码:
```typescript
useSkill: (skillId: string) => {
  const state = get();
  const isPlayer = state.currentPlayerId === state.player.playerId;
  const selfId = isPlayer ? state.player.playerId : state.opponent.playerId;

  const fn = getSkillFn(skillId);
  if (!fn) return { canExecute: false, reason: '未知技能', effects: [] };

  const result = fn(state, selfId);
  if (!result.canExecute) return result;

  // 通过 EffectExecutor 统一应用效果
  const newState = executeEffects(state, result.effects, selfId);
  const { _meta, ...gameState } = newState;
  set(gameState);
  return { ...result, _meta };
},
```

- [ ] **Step 2: 修改 doAttack 方法**

将 `doAttack` 方法中的技能调用改用 EffectExecutor。攻击流程中读取 `bonusDamage`/`ignoreDefense`/`damageReduction` 类型的效果：

在执行技能后，从效果列表中提取战斗修饰器：
```typescript
// 替代旧的 bonusDamage / damageReduction 逻辑
const attackModifiers = [
  ...triggerResult.effects.filter(e => e.type === 'bonusDamage' || e.type === 'ignoreDefense'),
  ...continuousResult.effects.filter(e => e.type === 'damageReduction'),
];
const bonusDelta = attackModifiers
  .filter(e => e.type === 'bonusDamage')
  .reduce((sum, e) => sum + (e as any).delta, 0);
const isIgnored = attackModifiers.some(e => e.type === 'ignoreDefense');
const reduction = attackModifiers
  .filter(e => e.type === 'damageReduction')
  .reduce((sum, e) => sum + (e as any).amount, 0);
```

- [ ] **Step 3: 运行全部测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: PASS

- [ ] **Step 4: Vite 编译验证**

Run:
```bash
cd /workspace/dust-rising/client && npx vite build 2>&1 | tail -10
```

Expected: 无 TypeScript 错误，构建成功

- [ ] **Step 5: 提交**

```bash
cd /workspace/dust-rising && git add client/src/store/gameStore.ts && git commit -m "refactor: gameStore 使用 EffectExecutor 应用技能效果"
```

---

### Task 5: 集成验证 + 清理

- [ ] **Step 1: 运行全部测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run --reporter=verbose
```

Expected: 全部 PASS，无警告

- [ ] **Step 2: Vite 编译验证**

Run:
```bash
cd /workspace/dust-rising/client && npx vite build 2>&1 | tail -15
```

Expected: 无错误

- [ ] **Step 3: 清理旧代码**

确认 `skills.ts` 中已无旧的 `SkillResult` 接口和旧的函数签名。如果有残留类型导出但不再使用，保留导出以避免破坏外部引用，但标记 `@deprecated`。

- [ ] **Step 4: 最终提交**

```bash
cd /workspace/dust-rising && git add -A && git commit -m "chore: Effect 系统重构完成 - A阶段集成验证"
```

---

## A 阶段完成检查清单

- [ ] `shared/effects.ts` — 14 种 `GameEffect` 类型定义
- [ ] `client/src/game/effectExecutor.ts` — 所有 14 种效果的处理逻辑
- [ ] `client/src/game/effects.ts` — 便捷构造函数
- [ ] `client/src/game/skills.ts` — 12 个旧技能全部返回 `GameEffect[]`
- [ ] `client/src/store/gameStore.ts` — `useSkill` / `doAttack` 使用 `EffectExecutor`
- [ ] `shared/types.ts` — `Artifact` 接口新增 `counters` 字段
- [ ] `npx vitest run` — 全部通过
- [ ] `npx vite build` — 编译通过
- [ ] 游戏在浏览器中可正常运行
