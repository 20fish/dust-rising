/* ═══════════════════════════════════════════════════════════
 * 技能系统 — 共享类型和辅助函数
 *
 * 提取为独立文件，避免 skills.ts 与 skills/*.ts 之间的循环依赖
 * ═══════════════════════════════════════════════════════════ */

import type { GameState, PlayerState } from '../types/game';
import type { SkillExecutionResult } from '../../../shared/effects';

/** 技能函数签名 */
export type SkillFn = (game: GameState, selfId: string) => SkillExecutionResult;

/** 根据 selfId 解析出自己和对手 */
export function resolvePlayers(game: GameState, selfId: string): { self: PlayerState; opponent: PlayerState } {
  return game.player.playerId === selfId
    ? { self: game.player, opponent: game.opponent }
    : { self: game.opponent, opponent: game.player };
}
