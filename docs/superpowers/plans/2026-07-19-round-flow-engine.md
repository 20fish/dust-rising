# 回合流程引擎完善（Round Flow Engine）实施计划

> **For agentic workers:** REQUIRED SUBSKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善回合流程骨架中的缺失机制——补骰逻辑、充能系统（攻击后充能+onCharge触发）、阶段切换事件钩子、chargeCount 初始化修复。

**Architecture:** 在 `engine.ts` 中新增 `replenishDice`（补骰）和 `tickCharge`（充能递增+触发检查），在 `gameStore.ts` 的 `advancePhase` 中增加阶段事件钩子（replenish 时补骰、end 时充能检查），`doAttack` 后追加充能递增逻辑。所有新逻辑通过 EffectExecutor 统一执行效果。

**Tech Stack:** TypeScript, Vitest

**前置依赖:** A 阶段（Effect 系统）✅, B 阶段（属性计算器）✅

**验证标准（C 阶段完成条件）：**
1. `engine.ts` 中实现了 `replenishDice` 和 `tickCharge`
2. `advancePhase('replenish'→'reroll')` 时实际补充骰子
3. `doAttack` 攻击后第三列神器充能 +1
4. 充能满时自动触发 `onCharge` 技能
5. `PlayerState.chargeCount` 初始为 0（非 chargeRequirement）
6. 所有测试通过：`npx vitest run`
7. TypeScript 编译 + Vite 构建通过

**明确不做（留给后续）：**
- trigger 技能的事件细分（攻击前/攻击后/补充阶段等）—— 需要新的事件标签系统
- hasDustSeal 实际效果逻辑
- onActivate 技能系统
- 回合计数器 / 技能使用次数限制

---

## 文件结构总览

```
dust-rising/
├── client/
│   └── src/
│       ├── game/
│       │   ├── engine.ts                        # 修改: 新增 replenishDice, tickCharge
│       │   └── __tests__/
│       │       └── roundFlow.test.ts            # 新增: 回合流程测试
│       ├── store/
│       │   └── gameStore.ts                     # 修改: advancePhase 补骰, doAttack 充能, createPlayer 修复
└── shared/
    └── effects.ts                               # 修改: 新增 ChargeTickEffect 类型
```

---

### Task 0: 新增 chargeTick GameEffect 类型 + 测试

**Files:**
- Modify: `shared/effects.ts`
- Modify: `client/src/game/__tests__/effects.test.ts`
- Modify: `client/src/game/effects.ts`（辅助函数）
- Modify: `client/src/game/effectExecutor.ts`（执行器）

**设计说明：** `chargeTick` effect 不直接由 EffectExecutor 执行（因为充能触发 onCharge 需要两步：先+1，再检查并调用技能）。它是一个"信号"effect，由 gameStore 读取后手动执行充能逻辑。但为了保持 Effect 系统的一致性，我们仍然将其定义为 GameEffect 的一种，由 EffectExecutor 透传（不修改状态），gameStore 在 doAttack 后处理。

实际上更简洁的方案是：**不新增 effect 类型，而是在 gameStore 的 doAttack 中直接调用 engine.tickCharge()**。这样避免 Effect 系统中混入"信号"类型。

**最终方案：不新增 effect 类型。在 engine.ts 中新增 tickCharge 纯函数。**

- [ ] **Step 1: 写 tickCharge 和 replenishDice 的测试**

Create `client/src/game/__tests__/roundFlow.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import type { GameState, PlayerState } from '../../../../shared/types';
import type { SkillExecutionResult } from '../../../../shared/effects';
import {
  replenishDice,
  tickCharge,
  checkOnCharge,
} from '../engine';
import { executeEffects } from '../effectExecutor';

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

function makePlayer(id: string = 'p1', overrides: Partial<PlayerState> = {}): PlayerState {
  return {
    playerId: id, name: id,
    artifacts: [
      makeArtifact('c1', { speed: 4, will: 7 }),
      makeArtifact('c2'),
      makeArtifact('c3', { life: 50, chargeRequirement: 4 }),
    ],
    zone: { defense: [{ id: 'd1', type: 'defense', value: 3 }], attack: [{ id: 'a1', type: 'attack', value: 5 }], meditation: [] },
    speed: 4, will: 7, life: 50, attackBonus: 0,
    hasDustSeal: false, chargeCount: 0,
    ...overrides,
  };
}

function makeGame(overrides?: Partial<GameState>): GameState {
  return {
    player: makePlayer('p1'),
    opponent: makePlayer('p2'),
    currentPlayerId: 'p1',
    phase: 'main', round: 1,
    dustFallCounter: 0, selectedDiceIds: [],
    isGameOver: false, winnerId: null,
    ...overrides,
  };
}

describe('roundFlow — replenishDice', () => {
  it('should add 1 die based on will when zone has fewer dice', () => {
    const player = makePlayer('p1', {
      zone: { defense: [], attack: [], meditation: [] },
    });
    const newPlayer = replenishDice(player);
    // will = 7, zone empty → should add dice up to will total
    const totalDice = newPlayer.zone.defense.length + newPlayer.zone.attack.length + newPlayer.zone.meditation.length;
    expect(totalDice).toBe(7);
  });

  it('should not add dice when zone already has enough', () => {
    const player = makePlayer('p1', {
      will: 3,
      zone: {
        defense: [{ id: 'd1', type: 'defense', value: 3 }],
        attack: [{ id: 'a1', type: 'attack', value: 5 }],
        meditation: [{ id: 'm1', type: 'meditation', value: 2 }],
      },
    });
    const newPlayer = replenishDice(player);
    const totalDice = newPlayer.zone.defense.length + newPlayer.zone.attack.length + newPlayer.zone.meditation.length;
    expect(totalDice).toBe(3);
  });

  it('should add only missing dice count', () => {
    const player = makePlayer('p1', {
      will: 7,
      zone: { defense: [{ id: 'd1', type: 'defense', value: 3 }], attack: [], meditation: [] },
    });
    const newPlayer = replenishDice(player);
    const totalDice = newPlayer.zone.defense.length + newPlayer.zone.attack.length + newPlayer.zone.meditation.length;
    expect(totalDice).toBe(7);
  });
});

describe('roundFlow — tickCharge', () => {
  it('should increment artifact[2].chargeCount by 1', () => {
    const player = makePlayer('p1', {
      artifacts: [
        makeArtifact('c1'),
        makeArtifact('c2'),
        makeArtifact('c3', { chargeRequirement: 3 }),
      ],
    });
    const newPlayer = tickCharge(player);
    expect(newPlayer.artifacts[2]!.chargeCount).toBe(1);
  });

  it('should increment again on second call', () => {
    const player = makePlayer('p1', {
      artifacts: [
        makeArtifact('c1'),
        makeArtifact('c2'),
        makeArtifact('c3', { chargeRequirement: 3 }),
      ],
    });
    let p = tickCharge(player);
    p = tickCharge(p);
    expect(p.artifacts[2]!.chargeCount).toBe(2);
  });

  it('should return isCharged=true when chargeCount reaches chargeRequirement', () => {
    const player = makePlayer('p1', {
      artifacts: [
        makeArtifact('c1'),
        makeArtifact('c2'),
        makeArtifact('c3', { chargeRequirement: 2 }),
      ],
    });
    const p1 = tickCharge(player);
    expect(p1.artifacts[2]!.chargeCount).toBe(1);
    const p2 = tickCharge(p1);
    expect(p2.artifacts[2]!.chargeCount).toBe(2);
    expect(tickCharge(p2).isCharged).toBe(true);
  });
});

describe('roundFlow — checkOnCharge', () => {
  it('should return charged artifact when chargeCount >= chargeRequirement', () => {
    const artifact = makeArtifact('c3', {
      chargeRequirement: 2,
      skills: [{ skillId: 'test_skill', type: 'onCharge', name: '测试充能', description: '' }],
    });
    artifact.chargeCount = 2;
    const player = makePlayer('p1', {
      artifacts: [makeArtifact('c1'), makeArtifact('c2'), artifact],
    });
    const charged = checkOnCharge(player);
    expect(charged).not.toBeNull();
    expect(charged!.artifactIndex).toBe(2);
  });

  it('should return null when not charged', () => {
    const player = makePlayer('p1');
    const charged = checkOnCharge(player);
    expect(charged).toBeNull();
  });

  it('should return null when artifact[2] is null', () => {
    const player = makePlayer('p1', { artifacts: [makeArtifact('c1'), makeArtifact('c2'), null] });
    const charged = checkOnCharge(player);
    expect(charged).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/roundFlow.test.ts
```

Expected: FAIL — `Cannot find module '../engine'` exports `replenishDice`

- [ ] **Step 3: 在 engine.ts 中实现 replenishDice, tickCharge, checkOnCharge**

在 `client/src/game/engine.ts` 末尾追加：

```typescript
/* ═══════════════════════════════════════════════════════════
 *  补骰逻辑 — replenish 阶段使用
 * ═══════════════════════════════════════════════════════════ */

/**
 * 补充骰子：当前骰子总数 < will 时，补充到 will
 * 新骰子类型由第二列神器的 diceDistribution 决定
 */
export function replenishDice(player: PlayerState): PlayerState {
  const currentTotal =
    player.zone.defense.length +
    player.zone.attack.length +
    player.zone.meditation.length;

  const will = player.will;
  const missing = will - currentTotal;
  if (missing <= 0) return player;

  const secondArtifact = player.artifacts[1];
  const distribution = secondArtifact?.diceDistribution;

  // 生成新骰子
  const newDice = createDiceBatch(missing);
  let newZone: DiceZone;

  if (distribution) {
    const allDice = [
      ...player.zone.defense,
      ...player.zone.attack,
      ...player.zone.meditation,
      ...newDice,
    ];
    newZone = distributeDice(allDice, distribution);
  } else {
    newZone = {
      defense: [...player.zone.defense],
      attack: [...player.zone.attack, ...newDice.map(d => ({ ...d, type: 'attack' as const }))],
      meditation: [...player.zone.meditation],
    };
  }

  return { ...player, zone: newZone };
}

/* ═══════════════════════════════════════════════════════════
 *  充能系统
 * ═══════════════════════════════════════════════════════════ */

/** tickCharge 返回值 */
export interface TickChargeResult {
  player: PlayerState;
  /** 本次 tick 是否刚达到充能满 */
  isCharged: boolean;
}

/**
 * 充能递增：第三列神器 chargeCount +1
 */
export function tickCharge(player: PlayerState): TickChargeResult {
  const artifact = player.artifacts[2];
  if (!artifact) return { player, isCharged: false };

  const newCount = artifact.chargeCount + 1;
  const isCharged = newCount >= artifact.chargeRequirement;

  const newArtifact = { ...artifact, chargeCount: newCount };
  const newArtifacts = [...player.artifacts] as typeof player.artifacts;
  newArtifacts[2] = newArtifact;

  return { player: { ...player, artifacts: newArtifacts }, isCharged };
}

/** checkOnCharge 返回值 */
export interface ChargedArtifact {
  artifactIndex: number;
  artifact: Artifact;
}

/**
 * 检查第三列神器是否充能满
 */
export function checkOnCharge(player: PlayerState): ChargedArtifact | null {
  const artifact = player.artifacts[2];
  if (!artifact) return null;
  if (artifact.chargeCount >= artifact.chargeRequirement) {
    return { artifactIndex: 2, artifact };
  }
  return null;
}
```

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/roundFlow.test.ts
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
cd /workspace/dust-rising && git add client/src/game/engine.ts client/src/game/__tests__/roundFlow.test.ts && git commit -m "feat: 补骰逻辑和充能系统（replenishDice, tickCharge, checkOnCharge）"
```

---

### Task 1: 修复 chargeCount 初始化

**Files:**
- Modify: `client/src/store/gameStore.ts`

- [ ] **Step 1: 修改 createPlayer 中 chargeCount 初始值**

在 `gameStore.ts` 中找到 `createPlayer` 函数（约第 146 行）：

将：
```typescript
    chargeCount: c3.chargeRequirement,
```

改为：
```typescript
    chargeCount: 0,
```

- [ ] **Step 2: 运行全部测试 + 编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

Expected: 零错误，全部 PASS

- [ ] **Step 3: 提交**

```bash
cd /workspace/dust-rising && git add client/src/store/gameStore.ts && git commit -m "fix: chargeCount 初始值改为 0"
```

---

### Task 2: advancePhase 中补骰

**Files:**
- Modify: `client/src/store/gameStore.ts`

- [ ] **Step 1: 修改 advancePhase，在进入 replenish 时执行补骰**

在 `gameStore.ts` 顶部添加 import（如果尚未导入）：

确认 `import { switchPlayer, skipAwakening, checkGameOver, performInitialRoll, performInitialReroll } from '../game/engine';` 存在，然后追加 `replenishDice`：

将 import 改为：
```typescript
import { switchPlayer, skipAwakening, checkGameOver, performInitialRoll, performInitialReroll, replenishDice } from '../game/engine';
```

修改 `advancePhase` 方法，在 `replenish` 阶段对双方补骰：

```typescript
  advancePhase: () => {
    const state = get();
    const phaseOrder: GamePhase[] = ['replenish', 'reroll', 'awakening', 'main', 'end'];
    const idx = phaseOrder.indexOf(state.phase);
    if (idx >= 0 && idx < phaseOrder.length - 1) {
      const next = phaseOrder[idx + 1];

      /* replenish → reroll: 补骰 */
      if (state.phase === 'replenish') {
        const newPlayer = replenishDice(state.player);
        const newOpponent = replenishDice(state.opponent);
        set({ player: newPlayer, opponent: newOpponent, phase: 'reroll' });
        return;
      }

      if (next === 'end') {
        const switched = switchPlayer(state);

        // 执行新回合开始时的触发技能（如邪灵诅咒：尘落+1）
        const triggerResult = executeSkillsByType(switched, switched.currentPlayerId, 'trigger');
        const dustEffects = triggerResult.effects.filter(e => e.type === 'dustFall');
        const updatedState = dustEffects.length > 0
          ? executeEffects(switched, dustEffects, switched.currentPlayerId)
          : switched;

        set({ ...updatedState, phase: 'replenish' });
      } else {
        set({ phase: next });
      }
    }
  },
```

- [ ] **Step 2: 运行全部测试 + 编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

Expected: 零错误，全部 PASS

- [ ] **Step 3: 提交**

```bash
cd /workspace/dust-rising && git add client/src/store/gameStore.ts && git commit -m "feat: replenish 阶段执行补骰"
```

---

### Task 3: doAttack 中充能递增 + onCharge 触发

**Files:**
- Modify: `client/src/store/gameStore.ts`

- [ ] **Step 1: 修改 doAttack，攻击后执行充能逻辑**

在 `gameStore.ts` 顶部追加 import：

```typescript
import { tickCharge, checkOnCharge } from '../game/engine';
```

在 `doAttack` 方法的末尾（`executeEffects` 调用之后），追加充能逻辑：

将 doAttack 方法末尾从：
```typescript
    /* 通过 EffectExecutor 统一应用 */
    const newState = executeEffects(state, effects, attackerId);
    set({ player: newState.player, opponent: newState.opponent, selectedDiceIds: [] });
  },
```

改为：
```typescript
    /* 通过 EffectExecutor 统一应用 */
    let newState = executeEffects(state, effects, attackerId);

    /* 攻击后充能递增 */
    const attacker = newState.player.playerId === attackerId ? newState.player : newState.opponent;
    const chargeResult = tickCharge(attacker);
    if (chargeResult.isCharged) {
      /* 充能满 → 检查并触发 onCharge 技能 */
      const charged = checkOnCharge(chargeResult.player);
      if (charged) {
        const onChargeResult = executeSkillsByType(
          newState.player.playerId === attackerId ? newState : { ...newState, player: chargeResult.player },
          attackerId,
          'onCharge'
        );
        if (onChargeResult.canExecute && onChargeResult.effects.length > 0) {
          newState = executeEffects(
            newState.player.playerId === attackerId ? { ...newState, player: chargeResult.player } : { ...newState, opponent: chargeResult.player },
            onChargeResult.effects,
            attackerId
          );
          /* 触发后重置充能计数 */
          const resetPlayer = newState.player.playerId === attackerId ? newState.player : newState.opponent;
          const resetArtifact = { ...resetPlayer.artifacts[2]!, chargeCount: 0 };
          const resetArtifacts = [...resetPlayer.artifacts] as typeof resetPlayer.artifacts;
          resetArtifacts[2] = resetArtifact;
          const finalResetPlayer = { ...resetPlayer, artifacts: resetArtifacts };
          newState = newState.player.playerId === attackerId
            ? { ...newState, player: finalResetPlayer }
            : { ...newState, opponent: finalResetPlayer };
        }
      }
    } else {
      /* 未满充能 → 更新充能计数 */
      newState = newState.player.playerId === attackerId
        ? { ...newState, player: chargeResult.player }
        : { ...newState, opponent: chargeResult.player };
    }

    set({ player: newState.player, opponent: newState.opponent, selectedDiceIds: [] });
  },
```

- [ ] **Step 2: 运行全部测试 + 编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

Expected: 零错误，全部 PASS

- [ ] **Step 3: 提交**

```bash
cd /workspace/dust-rising && git add client/src/store/gameStore.ts && git commit -m "feat: 攻击后充能递增 + onCharge 触发"
```

---

### Task 4: 集成验证

- [ ] **Step 1: 运行全量测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: 全部 PASS（A: 53 + B: 13 + C: 8 = 74+）

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
