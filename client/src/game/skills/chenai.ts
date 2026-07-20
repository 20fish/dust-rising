/* ═══════════════════════════════════════════════════════════
 * 尼萨 — 尘哀
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import {
  trueDamage,
  removeDice,
  dustFall,
  message as msg,
  cannotExecute,
  canExecute,
} from '../effects';

/**
 * 尘起（激活）
 * 你可以立即再次进行1次需要正常使用冥想骰的额外"尘起行动"。
 *
 * 通过 dustFall(-1) 表示获得额外行动机会。
 */
export const skillChenaiChenqi: SkillFn = (_game, _selfId) => {
  return canExecute([
    msg('尘起：可以进行一次额外尘起行动'),
    dustFall(-1),
  ]);
};

/**
 * 蛮王之牙（充能+必杀）
 * 充能：造成X点真实伤害，X为你的意志。
 * 必杀：消耗你的全部攻击骰。造成X点真实伤害，X为消耗的攻击骰数量。
 */
export const skillChenaiManwangzhiya: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  // 查找所属神器
  const artifactIndex = self.artifacts.findIndex(
    a => a && a.skills.some(s => s.skillId === 'chenai_manwangzhiya')
  );
  const artifact = artifactIndex >= 0 ? self.artifacts[artifactIndex] : null;

  // 必杀：神器已激活
  if (artifact?.isActive) {
    const attackCount = self.zone.attack.length;

    if (attackCount === 0) {
      return cannotExecute('蛮王之牙·必杀：攻击骰区无骰子可消耗');
    }

    return canExecute(
      [
        removeDice('self', 'attack', attackCount),
        trueDamage('opponent', attackCount),
        msg(`蛮王之牙·必杀！消耗${attackCount}个攻击骰，造成${attackCount}点真实伤害`),
      ],
      { attack: attackCount },
    );
  }

  // 充能：造成意志点真实伤害
  if (self.will <= 0) {
    return cannotExecute('蛮王之牙·充能：意志为0，无法造成伤害');
  }

  return canExecute(
    [
      trueDamage('opponent', self.will),
      msg(`蛮王之牙·充能：造成${self.will}点真实伤害`),
    ],
    undefined,
  );
};