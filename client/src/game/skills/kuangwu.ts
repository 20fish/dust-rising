/* ═══════════════════════════════════════════════════════════
 * 希瓦 — 狂舞
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  moveDice,
  removeDice,
  gainDice,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/**
 * 凶弹夜舞（充能+必杀）
 * 充能：你可以选择1个能力骰。将其移动至你的另一个区域，保留原本的点数。
 * 必杀：弃置你的全部能力骰。获得X个随机点数的攻击骰，X为弃置的能力骰数量。
 *
 * 默认：充能时从攻击骰区移至冥想骰区。必杀时统计全部骰子。
 */
export const skillKuangwuXiongdanyewu: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 查找所属神器
  const artifactIndex = self.artifacts.findIndex(
    a => a && a.skills.some(s => s.skillId === 'kuangwu_xiongdanyewu')
  );
  const artifact = artifactIndex >= 0 ? self.artifacts[artifactIndex] : null;

  // 必杀：神器已激活
  if (artifact?.isActive) {
    const totalDice =
      self.zone.attack.length + self.zone.defense.length + self.zone.meditation.length;

    if (totalDice === 0) {
      return cannotExecute('凶弹夜舞·必杀：没有骰子可弃置');
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
    effects.push(msg(`凶弹夜舞·必杀！弃置${totalDice}个骰子，获得${totalDice}个攻击骰`));

    return canExecute(effects);
  }

  // 充能：移动1个骰子
  if (self.zone.attack.length === 0) {
    return cannotExecute('凶弹夜舞·充能：攻击骰区无骰子可移动');
  }

  return canExecute(
    [
      moveDice('self', 'attack', 'self', 'meditation', 1, true),
      msg('凶弹夜舞·充能：将1个攻击骰移至冥想骰区'),
    ],
    undefined,
  );
};