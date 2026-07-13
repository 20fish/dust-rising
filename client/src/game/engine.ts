/* ═══════════════════════════════════════════════════════════
 * 游戏引擎 - 回合流程控制
 * ═══════════════════════════════════════════════════════════ */

import type { Dice, GameState, PlayerState, DiceZone, Artifact } from '../types/game';
import { createDiceBatch, distributeDice } from './dice';

/**
 * 执行初始投掷
 * 投掷数量 = 玩家意志，骰点分布由第二列神器决定
 */
export function performInitialRoll(player: PlayerState): { player: PlayerState } {
  const will = player.will;
  const dice = createDiceBatch(will);

  // 由第二列神器提供骰点分布
  const secondArtifact = player.artifacts[1];
  const distribution = secondArtifact?.diceDistribution;
  if (!distribution) {
    // 无第二列神器时，默认全部分配到攻击
    const zone: DiceZone = { defense: [], attack: dice.map(d => ({ ...d, type: 'attack' as const })), meditation: [] };
    return { player: { ...player, zone } };
  }

  const zone = distributeDice(dice, distribution);
  return { player: { ...player, zone } };
}

/**
 * 初始重掷：可以重掷任意数量的骰子（仅一次）
 */
export function performInitialReroll(
  player: PlayerState,
  diceIdsToReroll: string[]
): { player: PlayerState } {
  const allDice = [...player.zone.defense, ...player.zone.attack, ...player.zone.meditation];
  const secondArtifact = player.artifacts[1];
  const distribution = secondArtifact?.diceDistribution;

  // 重掷选中的骰子
  const rerolled: Dice[] = [];
  const kept: Dice[] = [];
  for (const die of allDice) {
    if (diceIdsToReroll.includes(die.id)) {
      rerolled.push({ ...die, value: (Math.floor(Math.random() * 6) + 1) as Dice['value'] });
    } else {
      kept.push(die);
    }
  }

  // 重新分配
  if (distribution) {
    const zone = distributeDice([...kept, ...rerolled], distribution);
    return { player: { ...player, zone } };
  }

  return { player };
}

/**
 * 跳过尘起阶段 → 尘落+1
 */
export function skipAwakening(game: GameState): GameState {
  return {
    ...game,
    dustFallCounter: game.dustFallCounter + 1,
    phase: 'main',
  };
}

/**
 * 检查游戏是否结束（尘落≥10）
 */
export function checkGameOver(game: GameState): GameState {
  if (game.dustFallCounter >= 10) {
    const playerLife = game.player.life;
    const opponentLife = game.opponent.life;
    const winnerId = playerLife > opponentLife ? game.player.playerId
      : opponentLife > playerLife ? game.opponent.playerId
      : game.currentPlayerId; // 生命相同，当前回合玩家获胜

    return { ...game, isGameOver: true, winnerId };
  }
  return game;
}

/**
 * 切换当前玩家
 */
export function switchPlayer(game: GameState): GameState {
  return {
    ...game,
    currentPlayerId: game.currentPlayerId === game.player.playerId
      ? game.opponent.playerId
      : game.player.playerId,
    round: game.currentPlayerId === game.opponent.playerId ? game.round + 1 : game.round,
  };
}