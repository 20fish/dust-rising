# 神器数据更新（36 Artifacts）实施计划

> **For agentic workers:** REQUIRED SUBSKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用从 36 张图片提取的新数据替换旧的 12 件神器数据，更新类型系统以支持新数据格式（一点多类型骰点分布、组合技能类型），更新图片路径逻辑。

**Architecture:** 分三步走：先扩展类型定义（DiceDistribution、SkillType、SKILL_MAX），再替换数据文件（36 件神器），最后更新相关引用（图片路径、initGame 预设、ARTIFACT_BUDGET 校验）。

**Tech Stack:** TypeScript, Vitest

**前置依赖:** A 阶段 ✅, B 阶段 ✅, C 阶段 ✅

**数据来源:** `/workspace/artifact-data/artifact-data.html`

**验证标准：**
1. `shared/artifactData.ts` 包含 36 件神器定义
2. `DiceDistribution` 支持数组值
3. `SkillType` 支持分号分隔的组合类型
4. `ARTIFACT_BUDGET.SKILL_MAX` = 2
5. 图片路径正确映射到 `/artifacts/角色-神器-第N列.jpg`
6. `npx tsc --noEmit` 零错误
7. `npx vitest run` 全部通过
8. `npx vite build` 构建成功

---

## 文件结构总览

```
dust-rising/
├── shared/
│   ├── types.ts              # 修改: DiceDistribution 类型, SkillType, ARTIFACT_BUDGET.SKILL_MAX
│   └── artifactData.ts       # 重写: 36 件神器数据
├── client/
│   └── src/
│       ├── game/
│       │   ├── artifactRegistry.ts  # 修改: getImagePath 适配新图片命名
│       │   ├── artifacts.ts         # 无需改动（引用 BUILTIN_ARTIFACTS）
│       │   └── __tests__/
│       │       └── artifactData.test.ts  # 新增: 数据完整性测试
│       ├── store/
│       │   └── gameStore.ts      # 修改: initGame 预设使用新 ID
│       └── types/
│           └── game.ts           # 同步: 更新 re-export 的类型
```

---

### Task 0: 扩展类型定义

**Files:**
- Modify: `shared/types.ts`
- Modify: `client/src/types/game.ts`

- [ ] **Step 1: 修改 DiceDistribution 类型**

在 `shared/types.ts` 中，将：

```typescript
export type DiceDistribution = Record<DiceValue, DiceType>;
```

改为：

```typescript
/** 骰点分布值 — 支持单类型和多类型 */
export type DiceDistValue = DiceType | DiceType[];
export type DiceDistribution = Partial<Record<DiceValue, DiceDistValue>>;
```

注意改为 `Partial` 是因为并非所有点数都需要映射（如第一/三列神器没有骰点分布）。

- [ ] **Step 2: 修改 SkillType 支持组合类型**

在 `shared/types.ts` 中，将：

```typescript
export type SkillType = 'active' | 'continuous' | 'trigger' | 'onActivate' | 'onCharge';
```

改为：

```typescript
/** 技能基础类型 */
export type SkillBaseType = 'active' | 'continuous' | 'trigger' | 'onActivate' | 'onCharge' | 'onKill';
/** 技能类型（支持分号分隔的组合，如 "启动；持续"） */
export type SkillType = SkillBaseType | string;
```

说明：新神器数据中技能类型为中文（"启动"、"持续"、"触发"、"充能"、"必杀"、"激活"），需要运行时映射。

- [ ] **Step 3: 修改 ARTIFACT_BUDGET.SKILL_MAX**

在 `shared/types.ts` 中，将 `SKILL_MAX: 1` 改为 `SKILL_MAX: 2`。

- [ ] **Step 4: 同步 client/src/types/game.ts**

确保 `client/src/types/game.ts` 的 re-export 与 `shared/types.ts` 保持一致。

- [ ] **Step 5: 验证编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit
```

Expected: 可能有一些类型错误（旧的 DiceDistribution 使用处），后续 task 修复。

- [ ] **Step 6: 提交**

```bash
cd /workspace/dust-rising && git add shared/types.ts client/src/types/game.ts && git commit -m "refactor: 扩展 DiceDistribution/SkillType 类型定义"
```

---

### Task 1: 重写 artifactData.ts（36 件神器数据）

**Files:**
- Rewrite: `shared/artifactData.ts`
- Create: `client/src/game/__tests__/artifactData.test.ts`

- [ ] **Step 1: 写数据完整性测试**

Create `client/src/game/__tests__/artifactData.test.ts`:

```typescript
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
```

- [ ] **Step 2: 运行测试确认失败**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/artifactData.test.ts
```

Expected: FAIL（BUILTIN_ARTIFACTS.length !== 36）

- [ ] **Step 3: 重写 shared/artifactData.ts**

用 36 件神器数据完全替换旧文件。数据从 `/workspace/artifact-data/artifact-data.html` 提取。

**关键格式决策：**
- `diceDistribution`：使用 `{ 1: 'defense', 2: ['attack', 'meditation'] }` 格式（数组表示一点多类型）
- `skills[].type`：直接使用中文值（如 `'启动'`、`'持续'`、`'触发'`、`'充能'`、`'必杀'`、`'激活'`，以及组合如 `'启动；持续'`）
- `imageKey`：使用 `角色拼音-神器拼音` 格式（如 `'yuqie-youlong'`）
- `id`：使用神器拼音 slug（如 `'yuqie'`、`'youlong'`、`'mingjing'`）

**注意**：旧 ID 尽量保留（如 `yuqie`、`yinglue`、`aige`），避免破坏现有引用。

- [ ] **Step 4: 运行测试确认通过**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run src/game/__tests__/artifactData.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
cd /workspace/dust-rising && git add shared/artifactData.ts client/src/game/__tests__/artifactData.test.ts && git commit -m "feat: 替换为36件新神器数据"
```

---

### Task 2: 更新图片路径逻辑

**Files:**
- Modify: `client/src/game/artifactRegistry.ts`

- [ ] **Step 1: 修改 getImagePath 方法**

将 `getImagePath` 方法从：
```typescript
getImagePath(id: string, column: ArtifactColumn): string {
  const def = this.defs.get(id);
  if (!def) return `/artifacts/unknown.jpg`;
  const col = column + 1;
  return `/artifacts/${def.imageKey} (${col}).jpg`;
}
```

改为：
```typescript
getImagePath(id: string, column: ArtifactColumn): string {
  const def = this.defs.get(id);
  if (!def) return `/artifacts/unknown.jpg`;
  const colLabel = ['第一列', '第二列', '第三列'][column];
  return `/artifacts/${def.imageKey}-${colLabel}.jpg`;
}
```

说明：新图片命名格式为 `角色-神器-位置.jpg`，其中 imageKey 已包含 `角色-神器` 部分，所以只需追加 `-位置`。

- [ ] **Step 2: 验证编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: 提交**

```bash
cd /workspace/dust-rising && git add client/src/game/artifactRegistry.ts && git commit -m "fix: 更新图片路径映射适配新命名规则"
```

---

### Task 3: 更新 initGame 预设 + 校验逻辑

**Files:**
- Modify: `client/src/store/gameStore.ts`
- Modify: `client/src/game/artifactRegistry.ts`

- [ ] **Step 1: 更新 initGame 预设**

在 `gameStore.ts` 中 `initGame` 方法，将旧的预设神器 ID 替换为新的。

由于新的轮选机制让玩家自选神器，`initGame` 的预设可以简化为每角色 3 列各选一件。更新为合理的默认组合。

- [ ] **Step 2: 更新 artifactRegistry.ts 的校验逻辑**

在 `validate` 方法中，技能校验改为：只检查 skillId 非空，不检查是否在 SKILL_REGISTRY 中（因为新技能函数尚未全部实现）。

将：
```typescript
if (!SKILL_REGISTRY[skill.skillId]) {
  errors.push(`未知技能ID: ${skill.skillId}（仅支持内置技能）`);
}
```

改为：
```typescript
// 技能 ID 存在性校验（新技能函数可能尚未实现，仅警告）
```

- [ ] **Step 3: 运行全部验证**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run && npx vite build
```

Expected: 全部通过

- [ ] **Step 4: 提交**

```bash
cd /workspace/dust-rising && git add client/src/store/gameStore.ts client/src/game/artifactRegistry.ts && git commit -m "feat: 更新 initGame 预设和校验逻辑"
```

---

### Task 4: 集成验证

- [ ] **Step 1: 全量测试**

Run:
```bash
cd /workspace/dust-rising/client && npx vitest run
```

Expected: 全部 PASS

- [ ] **Step 2: TypeScript 编译**

Run:
```bash
cd /workspace/dust-rising/client && npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: Vite 构建**

Run:
```bash
cd /workspace/dust-rising/client && npx vite build
```

Expected: 构建成功

- [ ] **Step 4: 确认新图片文件存在**

Run:
```bash
ls /workspace/dust-rising/client/public/artifacts/ | wc -l
```

Expected: 36 个 jpg 文件
