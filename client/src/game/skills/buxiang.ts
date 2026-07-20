/* ═══════════════════════════════════════════════════════════
 * 影（永暗之刃）— 不详
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  setCounter,
  bonusDamage,
  trueDamage,
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
 * 触发：当你的攻击被防御骰抵挡后，消耗1攻击骰+1冥想骰，取消该防御骰效果，再额外追加2点真实伤害。
 */
export const skillBuxiangFengmang: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const currentStack = (self.artifacts[0]?.counters?.stack as number) ?? 0;
  const event = game.lastEvent;

  // 触发部分：当攻击被防御骰抵挡后
  if (
    event &&
    event.type === 'attackResolved' &&
    event.playerId === selfId &&
    event.attackBlocked === true
  ) {
    // 检查是否有足够的攻击骰和冥想骰
    if (self.zone.attack.length < 1) {
      return cannotExecute('锋芒触发：攻击骰不足，至少需要1个');
    }
    if (self.zone.meditation.length < 1) {
      return cannotExecute('锋芒触发：冥想骰不足，至少需要1个');
    }

    return canExecute(
      [
        removeDice('self', 'attack', 1),
        removeDice('self', 'meditation', 1),
        trueDamage('opponent', 2),
        msg('锋芒触发！消耗1攻击骰+1冥想骰，取消防御效果，追加2点真实伤害'),
      ],
      { attack: 1, meditation: 1 },
    );
  }

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

  // 无计数且无触发条件
  return cannotExecute('锋芒：无计数叠加，且未满足触发条件');
};