/* ═══════════════════════════════════════════════════════════
 * 弥云 — 无相
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  removeDice,
  gainDice,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/**
 * 万象俱灭（充能+必杀）
 * 充能：你可以弃置你的最多3个能力骰。
 * 必杀：弃置你的全部能力骰。获得X个随机点数的能力骰，X为弃置的能力骰数量。
 *
 * 默认：充能时优先弃置攻击骰，最多3个。必杀时统计全部骰子。
 */
export const skillWuxiangWanxiangjumie: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 查找所属神器
  const artifactIndex = self.artifacts.findIndex(
    a => a && a.skills.some(s => s.skillId === 'wuxiang_wanxiangjumie')
  );
  const artifact = artifactIndex >= 0 ? self.artifacts[artifactIndex] : null;

  // 必杀：神器已激活
  if (artifact?.isActive) {
    const totalDice =
      self.zone.attack.length + self.zone.defense.length + self.zone.meditation.length;

    if (totalDice === 0) {
      return cannotExecute('万象俱灭·必杀：没有骰子可弃置');
    }

    const effects: ReturnType<typeof canExecute>['effects'] = [];
    if (self.zone.attack.length > 0) {
      effects.push(removeDice('self', 'attack', self.zone.attack.length));
    }
    if (self.zone.defense.length > 0) {
      effects.push(removeDice('self', 'defense', self.zone.defense.length));
    }
    if (self.zone.meditation.length > 0) {
      effects.push(removeDice('self', 'meditation', self.zone.meditation.length));
    }
    effects.push(gainDice('self', 'attack', totalDice));
    effects.push(msg(`万象俱灭·必杀！弃置${totalDice}个骰子，获得${totalDice}个攻击骰`));

    return canExecute(effects);
  }

  // 充能：弃置最多3个骰子（优先攻击骰）
  const removeCount = Math.min(3, self.zone.attack.length);

  if (removeCount === 0) {
    return cannotExecute('万象俱灭·充能：攻击骰区无骰子可弃置');
  }

  return canExecute(
    [
      removeDice('self', 'attack', removeCount),
      msg(`万象俱灭·充能：弃置${removeCount}个攻击骰`),
    ],
    { attack: removeCount },
  );
};