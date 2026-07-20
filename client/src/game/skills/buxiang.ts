/* ═══════════════════════════════════════════════════════════
 * 影（永暗之刃）— 不详
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  setCounter,
  bonusDamage,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/* ── 不详 ────────────────────────────────────────────────── */

/**
 * 翠莲（启动）
 * 消耗1个攻击骰。本神器计数+1（最高叠加至3层）。
 */
export const skillBuxiangCuilian: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const attackCount = self.zone.attack.length;

  if (attackCount < 1) {
    return cannotExecute('攻击骰不足，至少需要1个');
  }

  const currentStack = (self.artifacts[0]?.counters?.stack as number) ?? 0;
  const newStack = Math.min(currentStack + 1, 3);

  return canExecute(
    [
      removeDice('self', 'attack', 1),
      setCounter('self', 0, 'stack', newStack),
      msg(`翠莲！消耗1个攻击骰，不详计数+1（当前：${newStack}/3）`),
    ],
    { attack: 1 },
  );
};

/**
 * 锋芒（持续；触发）
 * 持续：攻击伤害+X，X为本神器计数。
 * 触发：消耗1攻击骰+1冥想骰，取消防御效果，额外2点真实伤害。
 *
 * 注意：此技能包含持续效果和触发效果两部分。
 * 持续部分已实现（bonusDamage），触发部分需要玩家选择，暂未实现。
 */
export const skillBuxiangFengmang: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  const currentStack = (self.artifacts[0]?.counters?.stack as number) ?? 0;

  // 持续效果：攻击伤害+X
  if (currentStack > 0) {
    return canExecute(
      [
        bonusDamage(currentStack),
        msg(`锋芒（持续）：攻击伤害+${currentStack}`),
      ],
      undefined,
    );
  }

  // 无计数时仍可返回空持续效果
  return cannotExecute('触发效果需要玩家选择是否触发，暂未实现');
};
