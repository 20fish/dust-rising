/* ═══════════════════════════════════════════════════════════
 * 艾娃 — 凋零
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { modifyStat, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 死亡亦逝（触发）
 * 当你的生命值减少后。将你的生命值设为最接近的5的倍数（向下取整）。
 */
export const skillDiaolingSiwangyishi: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);

  const targetLife = Math.floor(self.life / 5) * 5;
  if (self.life === targetLife) {
    return cannotExecute('死亡亦逝：生命值已是5的倍数，无需调整');
  }

  const delta = targetLife - self.life;
  return canExecute([
    modifyStat('self', 'life', delta),
    msg(`死亡亦逝！生命值从${self.life}调整为${targetLife}（向下取整至5的倍数）`),
  ]);
};