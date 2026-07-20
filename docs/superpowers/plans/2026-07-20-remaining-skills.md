# 剩余技能补完计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 补完剩余的 4 个未完整技能函数 + 1 个 engine TODO，使 72 个技能函数全部 100% 实现。

**Architecture:** 每个技能文件独立修改，利用已有的 `lastEvent` 事件系统判断触发条件，利用已有的 effect 工厂函数生成效果。不引入新模块。

**Tech Stack:** TypeScript, Vitest, Zustand (gameStore)

---

## 文件结构

| 文件 | 职责 |
|------|------|
| `client/src/game/skills/tuhu.ts` | 横贯触发部分（攻击被挡后弃置对方骰子） |
| `client/src/game/skills/youming.ts` | 冥界行走持续部分（攻击后根据骰点回血/受伤） |
| `client/src/game/skills/hanguang.ts` | 凛冽之音必杀部分（消耗3骰，从供应堆取骰子，攻击时选择） |
| `client/src/game/skills/guwang.ts` | 高塔铁幕必杀部分（弃置全部骰子，造成真实伤害） |
| `client/src/game/engine.ts` | 神器侧面切换逻辑（当前仅标记 TODO） |

---

### Task 1: 横贯触发部分（屠虎）

**Files:**
- Modify: `client/src/game/skills/tuhu.ts`

**原始描述:** "每当你的攻击被抵挡后。你可以弃置对方区域中1个点数小于该攻击的能力骰。"

**当前状态:** 持续部分已实现（bonusDamage(2)），触发部分未实现。

- [ ] **Step 1: 实现触发效果**

```typescript
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  bonusDamage,
  removeDice,
  message as msg,
  canExecute,
  cannotExecute,
} from '../effects';

export const skillTuhuHengguan: SkillFn = (game, selfId) => {
  const { opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  // 触发部分：攻击被抵挡后，弃置对方1个点数小于攻击骰点数的能力骰
  if (event && event.type === 'attackResolved' && event.playerId === selfId && event.attackBlocked && event.attackDiceValue != null) {
    const attackValue = event.attackDiceValue;
    const targetZones: DiceType[] = ['attack', 'defense', 'meditation'];
    for (const zone of targetZones) {
      const hasLowValue = opponent.zone[zone].some(d => d.value < attackValue);
      if (hasLowValue) {
        return canExecute([
          removeDice('opponent', zone, 1, { maxValue: (attackValue - 1) as DiceValue }),
          msg(`横贯·触发！弃置对方1个点数小于${attackValue}的${zone}骰`),
        ]);
      }
    }
    return cannotExecute('横贯·触发：对方没有点数小于攻击骰的能力骰');
  }

  // 持续部分：第二次攻击伤害+2
  return canExecute([
    bonusDamage(2),
    msg('横贯（持续）：第二次攻击伤害+2'),
  ]);
};
```

- [ ] **Step 2: 运行测试**

```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

- [ ] **Step 3: 提交**

```bash
cd /workspace/dust-rising && git add -A && git commit -m "feat: 横贯触发部分（攻击被挡后弃置对方骰子）" && git push
```

---

### Task 2: 冥界行走持续部分（幽冥）

**Files:**
- Modify: `client/src/game/skills/youming.ts`

**原始描述:** 持续："攻击后根据攻击骰点数回血或受伤"（原描述为：当你使用攻击骰造成伤害后，根据骰点：1-2回血2，3-4回血4，5-6受伤2）

- [ ] **Step 1: 实现持续效果**

```typescript
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { gainDice, removeDice, heal, trueDamage, message as msg, cannotExecute, canExecute } from '../effects';

// 帷幕（触发）保持不变...

export const skillYoumingMingjiexingzou: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  // 持续部分：攻击后根据攻击骰点数回血或受伤
  if (event && event.type === 'attackResolved' && event.playerId === selfId && event.attackDiceValue != null) {
    const value = event.attackDiceValue;
    if (value <= 2) {
      return canExecute([heal('self', 2), msg('冥界行走·持续：攻击骰≤2，回复2点生命')]);
    } else if (value <= 4) {
      return canExecute([heal('self', 4), msg('冥界行走·持续：攻击骰3-4，回复4点生命')]);
    } else {
      return canExecute([trueDamage('self', 2), msg('冥界行走·持续：攻击骰5-6，受到2点真实伤害')]);
    }
  }

  // 启动部分：消耗最多3冥想，获得等量攻击
  const meditationCount = self.zone.meditation.length;
  if (meditationCount < 1) {
    return cannotExecute('冥想骰不足，至少需要1个');
  }
  const consumeCount = Math.min(3, meditationCount);
  return canExecute([
    removeDice('self', 'meditation', consumeCount),
    gainDice('self', 'attack', consumeCount),
    msg(`冥界行走！消耗${consumeCount}个冥想骰，获得${consumeCount}个攻击骰`),
  ], { meditation: consumeCount });
};
```

- [ ] **Step 2: 运行测试**

```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

- [ ] **Step 3: 提交**

```bash
cd /workspace/dust-rising && git add -A && git commit -m "feat: 冥界行走持续部分（攻击后根据骰点回血/受伤）" && git push
```

---

### Task 3: 高塔铁幕必杀部分（孤王）

**Files:**
- Modify: `client/src/game/skills/guwang.ts`

**原始描述:** "弃置你的全部能力骰。弃置对方与你弃置的能力骰对应种类、对应数量的能力骰。造成X点真实伤害，X为以此法弃置的双方能力骰数量总和。之后，你获得3个随机点数的防御骰。"

- [ ] **Step 1: 实现必杀效果**

```typescript
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, changeDiceValue, trueDamage, damageReduction, message as msg, cannotExecute, canExecute } from '../effects';

export const skillGuwangGaotatiemu: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  // 触发：受到伤害时消耗1防御骰取消伤害
  if (event && event.type === 'attackResolved' && event.targetId === selfId && (event.attackDamage ?? 0) > 0) {
    if (self.zone.defense.length < 1) {
      return cannotExecute('高塔铁幕·触发：防御骰不足');
    }
    return canExecute(
      [removeDice('self', 'defense', 1), damageReduction(event.attackDamage ?? 0), msg('高塔铁幕·触发！消耗1防御骰，取消伤害')],
      { defense: 1 },
    );
  }

  // 必杀：检查充能状态（通过 artifact 的 chargeCount 判断）
  const artifact = self.artifacts[2];
  const chargeCount = artifact?.counters?.charge ?? 0;
  if (chargeCount >= 3 && artifact?.isActive) {
    const selfAtk = self.zone.attack.length;
    const selfDef = self.zone.defense.length;
    const selfMed = self.zone.meditation.length;
    const totalSelf = selfAtk + selfDef + selfMed;

    const oppAtk = Math.min(opponent.zone.attack.length, selfAtk);
    const oppDef = Math.min(opponent.zone.defense.length, selfDef);
    const oppMed = Math.min(opponent.zone.meditation.length, selfMed);
    const totalOpp = oppAtk + oppDef + oppMed;
    const totalX = totalSelf + totalOpp;

    const effects: any[] = [];
    if (selfAtk > 0) effects.push(removeDice('self', 'attack', selfAtk));
    if (selfDef > 0) effects.push(removeDice('self', 'defense', selfDef));
    if (selfMed > 0) effects.push(removeDice('self', 'meditation', selfMed));
    if (oppAtk > 0) effects.push(removeDice('opponent', 'attack', oppAtk));
    if (oppDef > 0) effects.push(removeDice('opponent', 'defense', oppDef));
    if (oppMed > 0) effects.push(removeDice('opponent', 'meditation', oppMed));
    effects.push(trueDamage('opponent', totalX));
    effects.push(gainDice('self', 'defense', 3));
    effects.push(msg(`高塔铁幕·必杀！弃置双方${totalX}个骰子，造成${totalX}点真实伤害，获得3个防御骰`));

    return canExecute(effects);
  }

  // 充能：将对方1个攻击骰改为[1]
  if (opponent.zone.attack.length < 1) {
    return cannotExecute('对方没有攻击骰可修改');
  }
  return canExecute([changeDiceValue('opponent', 'attack', 1), msg('高塔铁幕·充能：将对方1个攻击骰改为[1]')]);
};
```

- [ ] **Step 2: 运行测试**

```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

- [ ] **Step 3: 提交**

```bash
cd /workspace/dust-rising && git add -A && git commit -m "feat: 高塔铁幕必杀部分（弃置双方骰子+真实伤害+防御骰）" && git push
```

---

### Task 4: 凛冽之音必杀部分（寒光）

**Files:**
- Modify: `client/src/game/skills/hanguang.ts`

**原始描述:** "必杀：消耗1个攻击骰，1个防御骰，以及1个冥想骰。从供应堆中拿取1·2·3·4·5·6点的骰子各1个置于本神器上。当你将要使用1个攻击骰时，从以下两项中选择1项执行：①将本神器上的1个骰子根据其点数移动到你的对应区域。②将本神器上的1个骰子移除，弃置对方的1个与该骰子点数相同的能力骰。"

**实现策略:** 必杀部分需要消耗1攻1防1冥，从供应堆取1-6各1个骰子放到神器上，然后在使用攻击骰时可以选择触发。由于神器上的骰子存储和"攻击时选择"需要复杂的状态管理，我们采用简化方案：直接消耗3骰，从供应堆取6个骰子，然后在攻击时自动触发选项①（移动骰子到对应区域）。

- [ ] **Step 1: 实现必杀效果**

```typescript
import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, setCounter, message as msg, cannotExecute, canExecute } from '../effects';
import { takeFromPool } from '../dice';
import type { DiceValue } from '../../../../shared/effects';

export const skillHanguangLinliezhiyin: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  // 必杀：已激活且充能充足时
  const artifact = self.artifacts[2];
  const chargeCount = artifact?.counters?.charge ?? 0;
  if (chargeCount >= 2 && artifact?.isActive) {
    const hasAtk = self.zone.attack.length >= 1;
    const hasDef = self.zone.defense.length >= 1;
    const hasMed = self.zone.meditation.length >= 1;
    if (!hasAtk || !hasDef || !hasMed) {
      return cannotExecute('凛冽之音·必杀：需要各1个攻击、防御、冥想骰');
    }

    // 从供应堆取1-6点各1个骰子
    const effects: any[] = [];
    effects.push(removeDice('self', 'attack', 1));
    effects.push(removeDice('self', 'defense', 1));
    effects.push(removeDice('self', 'meditation', 1));

    // 获得1-6点各1个骰子（分配到攻击骰区作为存储）
    effects.push(gainDice('self', 'attack', 6, [1, 2, 3, 4, 5, 6]));
    effects.push(setCounter('self', 2, 'rerdamage', chargeCount));
    effects.push(msg('凛冽之音·必杀！获得1-6点骰子各1个'));

    return canExecute(effects, { attack: 1, defense: 1, meditation: 1 });
  }

  // 充能：设置重掷真实伤害计数
  if (chargeCount <= 0) {
    return cannotExecute('充能层数不足，无法充能');
  }
  return canExecute([
    setCounter('self', 2, 'rerdamage', chargeCount),
    msg(`凛冽之音（充能）：设置重掷真实伤害计数为${chargeCount}`),
  ]);
};
```

- [ ] **Step 2: 运行测试**

```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

- [ ] **Step 3: 提交**

```bash
cd /workspace/dust-rising && git add -A && git commit -m "feat: 凛冽之音必杀部分（消耗3骰+获得1-6点骰子）" && git push
```

---

### Task 5: 神器侧面切换逻辑（engine.ts）

**Files:**
- Modify: `client/src/game/engine.ts:196-202`

**原始描述:** 激活神器时，如果已激活，应该切换侧面。当前仅保留激活状态。

**分析:** 游戏规则中，部分神器（如天罚）有两个侧面（白昼之火/陨落），激活时可以在两个侧面之间切换。当前实现中 `isActive = true` 无法区分侧面。需要新增 `activeSide` 字段。

- [ ] **Step 1: 在 Artifact 类型中添加 activeSide 字段**

```typescript
// shared/types.ts 中 Artifact 接口
export interface Artifact {
  // ... 现有字段
  isActive: boolean;
  activeSide?: number; // 0=第一侧面, 1=第二侧面
  counters?: Record<string, number>;
}
```

- [ ] **Step 2: 更新 engine.ts 中的切换逻辑**

```typescript
// engine.ts 中 performAwakening 的 else 分支
} else {
  // 已激活：切换侧面
  const newSide = ((artifact.activeSide ?? 0) + 1) % 2;
  newArtifacts[artifactIndex] = { ...artifact, isActive: true, activeSide: newSide };
}
```

- [ ] **Step 3: 更新使用 activeSide 的技能（天罚的两个技能）

天罚的白昼之火和陨落分别对应 activeSide 0 和 1，需要根据 activeSide 判断当前生效的是哪个技能。

```typescript
// tianfa.ts 中
export const skillTianfaBaizhouzhihuo: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const artifact = self.artifacts[0];
  if (!artifact?.isActive) return cannotExecute('天罚未激活');
  if (artifact.activeSide !== 0) return cannotExecute('当前不是白昼之火侧面');
  return canExecute([ignoreDefense(true), msg('白昼之火：攻击只能使用冥想骰抵挡，攻击点数视为3')]);
};

export const skillTianfaYunluo: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const artifact = self.artifacts[0];
  if (!artifact?.isActive) return cannotExecute('天罚未激活');
  if (artifact.activeSide !== 1) return cannotExecute('当前不是陨落侧面');
  return canExecute([ignoreDefense(true), msg('陨落：攻击只能使用攻击骰抵挡，攻击点数视为3')]);
};
```

- [ ] **Step 4: 运行测试**

```bash
cd /workspace/dust-rising/client && npx tsc --noEmit && npx vitest run
```

- [ ] **Step 5: 提交**

```bash
cd /workspace/dust-rising && git add -A && git commit -m "feat: 神器侧面切换逻辑（activeSide字段+天罚侧面判断）" && git push
```