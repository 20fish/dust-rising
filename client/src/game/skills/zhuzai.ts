/* ═══════════════════════════════════════════════════════════
 * 巴顿二世 — 主宰
 * ═══════════════════════════════════════════════════════════ */

import type { SkillFn } from '../skillHelpers';
import { resolvePlayers } from '../skillHelpers';
import { removeDice, trueDamage, message as msg, cannotExecute, canExecute } from '../effects';

/**
 * 战争扫荡（启动）
 * 消耗1攻击+1防御+1冥想，弃置对方各1个，
 * 真实伤害 = 自身消耗的三颗骰点数之和 / 2（向下取整）。
 */
export const skillZhuzaiZhanzhengsaodang: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);

  // 检查自身各区域至少有1个骰
  if (
    self.zone.attack.length < 1 ||
    self.zone.defense.length < 1 ||
    self.zone.meditation.length < 1
  ) {
    return cannotExecute('需要至少各1个攻击、防御、冥想骰');
  }

  // 读取消耗骰的点数（取每区域第一个骰）
  const atkDice = self.zone.attack[0];
  const defDice = self.zone.defense[0];
  const medDice = self.zone.meditation[0];
  const sum = atkDice.value + defDice.value + medDice.value;
  const dmg = Math.floor(sum / 2);

  const effects: ReturnType<typeof canExecute>['effects'] = [
    removeDice('self', 'attack', 1),
    removeDice('self', 'defense', 1),
    removeDice('self', 'meditation', 1),
  ];

  // 弃置对方各1个（不足时跳过）
  if (opponent.zone.attack.length > 0) {
    effects.push(removeDice('opponent', 'attack', 1));
  }
  if (opponent.zone.defense.length > 0) {
    effects.push(removeDice('opponent', 'defense', 1));
  }
  if (opponent.zone.meditation.length > 0) {
    effects.push(removeDice('opponent', 'meditation', 1));
  }

  effects.push(trueDamage('opponent', dmg));
  effects.push(msg(
    `战争扫荡！消耗攻击[${atkDice.value}]+防御[${defDice.value}]+冥想[${medDice.value}]，` +
    `弃置对方各1个骰，造成${dmg}真实伤害`,
  ));

  return canExecute(effects, { attack: 1, defense: 1, meditation: 1 });
};

/**
 * 震荡战击（启动）
 * 消耗4个同类型骰，弃置对方4个同类型骰，
 * 真实伤害 = 消耗骰点数之和 / 2（向下取整）。
 * 默认优先消耗攻击骰，其次防御骰，最后冥想骰。
 */
export const skillZhuzaiZhendangzhanji: SkillFn = (game, selfId) => {
  const { self, opponent } = resolvePlayers(game, selfId);

  // 优先选择有至少4个骰子的类型
  type ZoneType = 'attack' | 'defense' | 'meditation';
  const zoneOrder: ZoneType[] = ['attack', 'defense', 'meditation'];

  let chosenZone: ZoneType | null = null;
  for (const zone of zoneOrder) {
    if (self.zone[zone].length >= 4) {
      chosenZone = zone;
      break;
    }
  }

  if (!chosenZone) {
    return cannotExecute('震荡战击：需要至少4个同类型的能力骰');
  }

  // 计算消耗骰子点数总和
  const consumedDice = self.zone[chosenZone].slice(0, 4);
  const sum = consumedDice.reduce((acc, d) => acc + d.value, 0);
  const dmg = Math.floor(sum / 2);

  const effects: ReturnType<typeof canExecute>['effects'] = [
    removeDice('self', chosenZone, 4),
    removeDice('opponent', chosenZone, 4),
    trueDamage('opponent', dmg),
    msg(
      `震荡战击！消耗4个${chosenZone === 'attack' ? '攻击' : chosenZone === 'defense' ? '防御' : '冥想'}骰` +
      `（点数总和${sum}），弃置对方4个同类型骰，造成${dmg}真实伤害`,
    ),
  ];

  const cost: Record<string, number> = {};
  cost[chosenZone] = 4;

  return canExecute(effects, cost);
};