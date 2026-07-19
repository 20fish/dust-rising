/* ═══════════════════════════════════════════════════════════
 * 游戏引擎 - 回合流程控制
 * ═══════════════════════════════════════════════════════════ */

import type { Dice, GameState, PlayerState, DiceZone, Artifact } from '../types/game';
import { createDiceBatch, distributeDice } from './dice';
import { calcWill } from './attributeCalculator';

/**
 * 执行初始投掷
 * 投掷数量 = 玩家意志，骰点分布由第二列神器决定
 */
export function performInitialRoll(player: PlayerState): { player: PlayerState } {
  const will = calcWill(player);
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

/* ═══════════════════════════════════════════════════════════
 *  补骰逻辑 — replenish 阶段使用
 * ═══════════════════════════════════════════════════════════ */

/**
 * 补充骰子：当前骰子总数 < will 时，补充到 will
 * 新骰子类型由第二列神器的 diceDistribution 决定
 */
export function replenishDice(player: PlayerState): PlayerState {
  const currentTotal =
    player.zone.defense.length +
    player.zone.attack.length +
    player.zone.meditation.length;

  const missing = player.will - currentTotal;
  if (missing <= 0) return player;

  const secondArtifact = player.artifacts[1];
  const distribution = secondArtifact?.diceDistribution;

  const newDice = createDiceBatch(missing);

  if (distribution) {
    const allDice = [
      ...player.zone.defense,
      ...player.zone.attack,
      ...player.zone.meditation,
      ...newDice,
    ];
    const newZone = distributeDice(allDice, distribution);
    return { ...player, zone: newZone };
  }

  return {
    ...player,
    zone: {
      defense: [...player.zone.defense],
      attack: [...player.zone.attack, ...newDice.map(d => ({ ...d, type: 'attack' as const }))],
      meditation: [...player.zone.meditation],
    },
  };
}

/* ═══════════════════════════════════════════════════════════
 *  充能系统
 * ═══════════════════════════════════════════════════════════ */

/** tickCharge 返回值 */
export interface TickChargeResult {
  player: PlayerState;
  /** 本次 tick 是否刚达到充能满 */
  isCharged: boolean;
}

/**
 * 充能递增：第三列神器 chargeCount +1
 */
export function tickCharge(player: PlayerState): TickChargeResult {
  const artifact = player.artifacts[2];
  if (!artifact) return { player, isCharged: false };

  const newCount = artifact.chargeCount + 1;
  const isCharged = newCount >= artifact.chargeRequirement;

  const newArtifact = { ...artifact, chargeCount: newCount };
  const newArtifacts = [...player.artifacts] as typeof player.artifacts;
  newArtifacts[2] = newArtifact;

  return { player: { ...player, artifacts: newArtifacts }, isCharged };
}

/** checkOnCharge 返回值 */
export interface ChargedArtifact {
  artifactIndex: number;
  artifact: Artifact;
}

/**
 * 检查第三列神器是否充能满
 */
export function checkOnCharge(player: PlayerState): ChargedArtifact | null {
  const artifact = player.artifacts[2];
  if (!artifact) return null;
  if (artifact.chargeCount >= artifact.chargeRequirement) {
    return { artifactIndex: 2, artifact };
  }
  return null;
}