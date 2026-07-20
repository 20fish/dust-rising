/* ═══════════════════════════════════════════════════════════
 * 修 — 至黑
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, gainDice, trueDamage, setCounter, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 漆黑绽放（触发；充能；必杀）
 * 触发：当你受到伤害后。→本神器计数+1。
 * 充能：获得1个随机点数的防御骰。
 * 必杀：消耗你的全部冥想骰。造成X点真实伤害，X等同于消耗的冥想骰数量的2倍。
 */
export const skillZhiheiQiheizhanfang: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);
  const event = game.lastEvent;

  /* ── 触发：受到伤害后计数+1 ── */
  if (event && event.type === 'attackResolved' && event.targetId === selfId && (event.attackDamage ?? 0) > 0) {
    const artifact = self.artifacts[2];
    const currentCount = artifact?.counters?.dark ?? 0;
    return canExecute([
      setCounter('self', 2, 'dark', currentCount + 1),
      msg(`漆黑绽放·触发：计数+1（当前${currentCount + 1}）`),
    ]);
  }

  /* ── 充能/必杀 ── */
  const artifact = self.artifacts[2];
  const currentCount = artifact?.counters?.dark ?? 0;
  const meditationCount = self.zone.meditation.length;

  // 必杀：消耗全部冥想骰，造成 count*2 真实伤害
  if (meditationCount >= 1) {
    return canExecute(
      [
        removeDice('self', 'meditation', meditationCount),
        trueDamage('opponent', currentCount * 2),
        msg(`漆黑绽放·必杀！消耗${meditationCount}冥想骰，造成${currentCount * 2}真实伤害`),
      ],
      { meditation: meditationCount },
    );
  }

  // 充能：获得1个防御骰
  return canExecute([
    gainDice('self', 'defense', 1),
    msg('漆黑绽放·充能：获得1个防御骰'),
  ]);
};