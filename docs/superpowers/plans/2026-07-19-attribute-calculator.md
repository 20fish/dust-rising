# 属性计算器（Attribute Calculator）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建集中的属性计算模块，让 `speed`/`will`/`attackBonus` 等属性从"存储值"变为"动态计算值"（基础值 + 持续效果修饰器），消除各处直接读写 `PlayerState.speed`/`PlayerState.will` 的分散模式。

**Architecture:** 新增 `attributeCalculator.ts` 纯函数模块，提供 `calcSpeed(player)` / `calcWill(player)` / `calcAttackBonus(player)` / `calcMaxLife(player)` 等计算函数。这些函数从神器基础值出发，叠加当前生效的持续效果（continuous）的 `modifyStat` delta，返回最终值。所有需要读取属性的地方（UI、引擎、战斗）改用计算器函数，而非直接读 `PlayerState` 上的字段。

**Tech Stack:** TypeScript, Vitest

**前置依赖:** A 阶段（Effect 系统）已完成 — `modifyStat` effect、`executeSkillsByType`、`SkillFn(game, selfId)` 签名已就绪。

**验证标准（B 阶段完成条件）：**
1. `attributeCalculator.ts` 中实现了 `calcSpeed`、`calcWill`、`calcAttackBonus`、`calcMaxLife`、`calcAllStats` 函数
2. `StatsRow.tsx` 使用计算器而非直接读字段
3. `engine.ts` 中 `performInitialRoll` 使用 `calcWill`
4. `gameStore.ts` 中 `doAttack` 使用 `calcAttackBonus`
5. `PlayerState` 上 `speed`/`will`/`attackBonus` 仍保留（作为"基础值"存储），但运行时读取改用计算器
6. 所有测试通过：`npx vitest run`
7. TypeScript 编译通过：`npx tsc --noEmit`
8. Vite 构建通过：`npx vite build`

---

## 文件结构总览

```
dust-rising/
├── client/
│   └── src/
│       ├── game/
│       │   ├── attributeCalculator.ts          # 新增: 属性计算器纯函数
│       │   └── __tests__/
│       │       └── attributeCalculator.test.ts # 新增: 计算器测试
│       ├── store/
│       │   └── gameStore.ts                   # 修改: 使用计算器
│       ├── components/
│       │   └── StatsRow.tsx                    # 修改: 使用计算器
│       └── game/
│           └── engine.ts                       # 修改: 使用 calcWill
```

---

### Task 0: 创建属性计算器 + 测试

**Files:**
- Create: `client/src/game/attributeCalculator.ts`
- Create: `client/src/game/__tests__/attributeCalculator.test.ts`

- [ ] **Step 1: 写计算器的测试**

Create `client/src/game/__tests__/attributeCalculator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calcSpeed, calcWill, calcAttackBonus, calcMaxLife, calcAllStats } from '../attributeCalculator';
import type { PlayerState } from '../../../../shared/types';

function makeArtifact(id: string, overrides: Partial<{
  speed: number; will: number; life: number; chargeRequirement: number;
  skills: { skillId: string; type: string; name: string; description: string }[];
}> = {}) {
  return {
    id, name: id, column: 0, source: 'builtin' as const, version: 1,
    speed: overrides.speed ?? 4, will: overrides.will ?? 7,
    life: overrides.life ?? 50, chargeRequirement: overrides.chargeRequirement ?? 4,
    diceDistribution: { 1: 'defense', 2: 'attack', 3: 'defense', 4: 'attack', 5: 'defense', 6: 'attack' },
    skills: overrides.skills ?? [],
    imageKey: id, isActive: false, chargeCount: 0, counters: {},
  };
}

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: 'p1', name: '测试',
    artifacts: [
      makeArtifact('c1', { speed: 4, will: 7 }),
      makeArtifact('c2'),
      makeArtifact('c3', { life: 50, chargeRequirement: 4 }),
    ],
    zone: { defense: [], attack: [], meditation: [] },
    speed: 4, will: 7, life: 50, attackBonus: 0,
    hasDustSeal: false, chargeCount: 4,
    ...overrides,
  };
}

describe('attributeCalculator', () => {
  describe('calcSpeed', () => {
    it('should return base speed from artifact[0] when no modifiers', () => {
      const player = makePlayer();
      expect(calcSpeed(player)).toBe(4);
    });

    it('should return stored speed as base when artifact has speed', () => {
      const player = makePlayer({ speed: 3 });
      expect(calcSpeed(player)).toBe(3);
    });

    it('should ignore artifact speed if artifacts[0] is null', () => {
      const player = makePlayer({ artifacts: [null, null, null] as any, speed: 4 });
      expect(calcSpeed(player)).toBe(4);
    });
  });

  describe('calcWill', () => {
    it('should return base will from artifact[0]', () => {
      const player = makePlayer();
      expect(calcWill(player)).toBe(7);
    });

    it('should return stored will', () => {
      const player = makePlayer({ will: 8 });
      expect(calcWill(player)).toBe(8);
    });
  });

  describe('calcAttackBonus', () => {
    it('should return stored attackBonus (base 0)', () => {
      const player = makePlayer();
      expect(calcAttackBonus(player)).toBe(0);
    });

    it('should return modified attackBonus', () => {
      const player = makePlayer({ attackBonus: 2 });
      expect(calcAttackBonus(player)).toBe(2);
    });
  });

  describe('calcMaxLife', () => {
    it('should return artifact[2].life as max life', () => {
      const player = makePlayer();
      expect(calcMaxLife(player)).toBe(50);
    });

    it('should return 50 as default when artifact[2] is null', () => {
      const player = makePlayer({ artifacts: [null, null, null] as any });
      expect(calcMaxLife(player)).toBe(50);
    });

    it('should return 40 for low-life artifact', () => {
      const player = makePlayer({
        artifacts: [
          makeArtifact('c1'),
          makeArtifact('c2'),
          makeArtifact('c3', { life: 40 }),
        ],
      });
      expect(calcMaxLife(player)).toBe(40);
    });
  });

  describe('calcAllStats', () => {
    it('should return all computed stats', () => {
      const player = makePlayer();
      const stats = calcAllStats(player);
      expect(stats).toEqual({
        speed: 4,
        will: 7,
        life: 50,
        maxLife: 50,
        attackBonus: 0,
      });
    });

    it('should handle modified attackBonus', () => {
      const player = makePlayer({ attackBonus: 3, life: 30 });
      const stats = calcAllStats(player);
      expect(stats.attackBonus).toBe(3);
      expect(stats.life).toBe(30);
      expect(stats.maxLife).toBe(50);
    });
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/attributeCalculator.test.ts
```

Expected: FAIL — `Cannot find module '../attributeCalculator'`

- [ ] **Step 3: 创建 attributeCalculator.ts**

Create `client/src/game/attributeCalculator.ts`:

```typescript
/* ═══════════════════════════════════════════════════════════
 * 属性计算器 — 集中计算玩家属性
 *
 * 设计原则:
 *   - 纯函数，不修改输入状态
 *   - 基础值从神器定义 + PlayerState 存储
 *   - 未来可扩展：叠加持续效果修饰器
 *   - 所有需要读取属性的地方统一调用此模块
 * ═══════════════════════════════════════════════════════════ */

import type { PlayerState } from '../types/game';

/** 默认最大生命值 */
const DEFAULT_MAX_LIFE = 50;

/** 计算速度（基础值来自 artifacts[0].speed，存储在 player.speed） */
export function calcSpeed(player: PlayerState): number {
  return player.speed;
}

/** 计算意志（基础值来自 artifacts[0].will，存储在 player.will） */
export function calcWill(player: PlayerState): number {
  return player.will;
}

/** 计算攻击加成（存储在 player.attackBonus） */
export function calcAttackBonus(player: PlayerState): number {
  return player.attackBonus;
}

/** 计算最大生命值（来自 artifacts[2].life） */
export function calcMaxLife(player: PlayerState): number {
  return player.artifacts[2]?.life ?? DEFAULT_MAX_LIFE;
}

/** 计算所有属性，返回统一对象 */
export function calcAllStats(player: PlayerState): {
  speed: number;
  will: number;
  life: number;
  maxLife: number;
  attackBonus: number;
} {
  return {
    speed: calcSpeed(player),
    will: calcWill(player),
    life: player.life,
    maxLife: calcMaxLife(player),
    attackBonus: calcAttackBonus(player),
  };
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/attributeCalculator.test.ts
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
cd /workspace/dust-rising && git add client/src/game/attributeCalculator.ts client/src/game/__tests__/attributeCalculator.test.ts && git commit -m "feat: 添加属性计算器模块"
```

---

### Task 1: 更新 UI 组件使用计算器

**Files:**
- Modify: `client/src/components/StatsRow.tsx`

- [ ] **Step 1: 修改 StatsRow.tsx**

将 `StatsRow.tsx` 中的直接字段读取改为使用计算器函数：

```typescript
/* ═══════════════════════════════════════════════════════════
 * 属性行组件 - 名字、速度、意志、生命值、充能、尘印
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import type { PlayerState } from '../types/game';
import { calcSpeed, calcWill, calcMaxLife } from '../game/attributeCalculator';

interface StatsRowProps {
  player: PlayerState;
  isOpponent: boolean;
}

export const StatsRow: React.FC<StatsRowProps> = ({ player, isOpponent }) => {
  const speed = calcSpeed(player);
  const will = calcWill(player);
  const maxLife = calcMaxLife(player);

  return (
    <div className={`stats ${isOpponent ? 'opponent' : ''}`}>
      <span className="name">{player.name}</span>
      <div className="stat">速 <span className="v">{speed}</span></div>
      <div className="stat">意 <span className="v">{will}</span></div>
      <div className="sep" />
      <div className="stat">生命值 <span className="v hp">{player.life}/{maxLife}</span></div>
      <div className="sep" />
      <div className="stat">充能 <span className="v chg">{player.chargeCount}/{player.artifacts[2]?.chargeRequirement ?? 3}</span></div>
      {player.hasDustSeal && (
        <>
          <div className="sep" />
          <span className="seal">印</span>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: 运行全部测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: 全部 PASS

- [ ] **Step 4: 提交**

```bash
cd /workspace/dust-rising && git add client/src/components/StatsRow.tsx && git commit -m "refactor: StatsRow 使用属性计算器"
```

---

### Task 2: 更新引擎使用计算器

**Files:**
- Modify: `client/src/game/engine.ts`

- [ ] **Step 1: 修改 performInitialRoll 使用 calcWill**

在 `engine.ts` 顶部添加 import，然后修改 `performInitialRoll` 函数：

```typescript
import { calcWill } from './attributeCalculator';
```

修改 `performInitialRoll` 函数（第 12-27 行）：

将第 13 行：
```typescript
  const will = player.will;
```
改为：
```typescript
  const will = calcWill(player);
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: 运行全部测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: 全部 PASS

- [ ] **Step 4: 提交**

```bash
cd /workspace/dust-rising && git add client/src/game/engine.ts && git commit -m "refactor: performInitialRoll 使用 calcWill"
```

---

### Task 3: 更新 gameStore 使用计算器

**Files:**
- Modify: `client/src/store/gameStore.ts`

- [ ] **Step 1: 修改 doAttack 使用 calcAttackBonus**

在 `gameStore.ts` 顶部添加 import：

```typescript
import { calcAttackBonus } from '../game/attributeCalculator';
```

在 `doAttack` 方法中，找到这行（约第 599 行）：
```typescript
    let baseDamage = selectedAttackDice.reduce((sum, d) => sum + d.value, 0) + attacker.attackBonus;
```

改为：
```typescript
    let baseDamage = selectedAttackDice.reduce((sum, d) => sum + d.value, 0) + calcAttackBonus(attacker);
```

- [ ] **Step 2: 验证 TypeScript 编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: 运行全部测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: 全部 PASS

- [ ] **Step 4: Vite 构建验证**

Run:
```bash
cd /workspace/dust-rising/client && npx vite build
```

Expected: 构建成功

- [ ] **Step 5: 提交**

```bash
cd /workspace/dust-rising && git add client/src/store/gameStore.ts && git commit -m "refactor: doAttack 使用 calcAttackBonus"
```

---

### Task 4: 清理死代码 combat.ts

**Files:**
- Delete: `client/src/game/combat.ts`

- [ ] **Step 1: 确认 combat.ts 没有被引用**

Run:
```bash
cd /workspace/dust-rising/client && grep -r "from.*combat" src/ --include="*.ts" --include="*.tsx"
```

Expected: 无输出（combat.ts 没有被任何地方导入）

- [ ] **Step 2: 删除 combat.ts**

```bash
rm /workspace/dust-rising/client/src/game/combat.ts
```

- [ ] **Step 3: 验证编译和测试**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

Expected: 零错误，全部 PASS

- [ ] **Step 4: 提交**

```bash
cd /workspace/dust-rising && git add -u client/src/game/combat.ts && git commit -m "chore: 删除未使用的 combat.ts"
```

---

### Task 5: 集成验证

- [ ] **Step 1: 运行全量测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: 全部 PASS（含 A 阶段 53 个 + B 阶段新测试）

- [ ] **Step 2: TypeScript 编译检查**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: Vite 构建检查**

Run:
```bash
cd /workspace/dust-rising/client && npx vite build
```

Expected: 构建成功

- [ ] **Step 4: 搜索是否有遗漏的直接属性读取**

Run:
```bash
cd /workspace/dust-rising/client/src && grep -rn "\.speed\b" --include="*.tsx" | grep -v "attributeCalculator" | grep -v "node_modules"
```

Expected: 无遗漏（所有 UI 组件已改用计算器）

注：`PlayerState.speed` 在 `types/game.ts` 类型定义和 `gameStore.ts` 初始化中的使用是正常的。

- [ ] **Step 5: 提交（如有修复）**

如果 Step 4 发现有遗漏文件，修复后提交。
