/* ═══════════════════════════════════════════════════════════
 * 属性计算器 — 集中计算玩家属性
 *
 * 设计原则:
 *   - 纯函数，不修改输入状态
 *   - 基础值从 PlayerState 存储 + 神器定义
 *   - 未来可扩展：叠加持续效果修饰器（continuous modifyStat）
 *   - 所有需要读取属性的地方统一调用此模块
 * ═══════════════════════════════════════════════════════════ */

import type { PlayerState } from '../types/game';

/** 默认最大生命值 */
const DEFAULT_MAX_LIFE = 50;

/** 计算速度（存储在 player.speed，由 artifacts[0] 初始化） */
export function calcSpeed(player: PlayerState): number {
  return player.speed;
}

/** 计算意志（存储在 player.will，由 artifacts[0] 初始化） */
export function calcWill(player: PlayerState): number {
  return player.will;
}

/** 计算攻击加成（存储在 player.attackBonus，初始为 0） */
export function calcAttackBonus(player: PlayerState): number {
  return player.attackBonus;
}

/** 计算最大生命值（来自 artifacts[2].life） */
export function calcMaxLife(player: PlayerState): number {
  return player.artifacts[2]?.life ?? DEFAULT_MAX_LIFE;
}

/** 计算所有属性，返回统一对象 */
export function calcAllStats(player: PlayerState): {
  speed: number;
  will: number;
  life: number;
  maxLife: number;
  attackBonus: number;
} {
  return {
    speed: calcSpeed(player),
    will: calcWill(player),
    life: player.life,
    maxLife: calcMaxLife(player),
    attackBonus: calcAttackBonus(player),
  };
}
