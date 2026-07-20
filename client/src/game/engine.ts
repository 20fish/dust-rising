/* ═══════════════════════════════════════════════════════════
 * 游戏引擎 - 回合流程控制
 * ═══════════════════════════════════════════════════════════ */

import type { Dice, GameState, PlayerState, DiceZone, Artifact } from '../types/game';
import { createDiceBatch, distributeDice } from './dice';
import { calcWill, calcSpeed } from './attributeCalculator';

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

/* ═══════════════════════════════════════════════════════════
 *  补骰逻辑 — replenish 阶段使用
 * ═══════════════════════════════════════════════════════════ */

/**
 * 补充骰子：从供应堆拿取等同于'速度'数量的能力骰
 * 新骰子与现有骰子一起，由第二列神器的 diceDistribution 重新分配
 */
export function replenishDice(player: PlayerState): PlayerState {
  const speed = calcSpeed(player);
  const secondArtifact = player.artifacts[1];
  const distribution = secondArtifact?.diceDistribution;

  const newDice = createDiceBatch(speed);

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
 *  重掷逻辑 — reroll 阶段使用
 * ═══════════════════════════════════════════════════════════ */

/**
 * 重掷阶段：选择自己区域中最多等同于'速度'数量的能力骰，重掷1次
 * 所有骰子（包括保留和重掷的）按第二列神器的 diceDistribution 重新分配
 */
export function performReroll(
  player: PlayerState,
  diceIdsToReroll: string[]
): { player: PlayerState } {
  const speed = calcSpeed(player);
  // 确保不超过速度上限
  const validIds = diceIdsToReroll.slice(0, speed);

  const allDice = [...player.zone.defense, ...player.zone.attack, ...player.zone.meditation];
  const secondArtifact = player.artifacts[1];
  const distribution = secondArtifact?.diceDistribution;

  const rerolled: Dice[] = [];
  const kept: Dice[] = [];
  for (const die of allDice) {
    if (validIds.includes(die.id)) {
      rerolled.push({ ...die, value: (Math.floor(Math.random() * 6) + 1) as Dice['value'] });
    } else {
      kept.push(die);
    }
  }

  if (distribution) {
    const zone = distributeDice([...kept, ...rerolled], distribution);
    return { player: { ...player, zone } };
  }

  // 无第二列神器时，默认全部分配到攻击
  const zone: DiceZone = {
    defense: [],
    attack: [...kept, ...rerolled].map(d => ({ ...d, type: 'attack' as const })),
    meditation: [],
  };
  return { player: { ...player, zone } };
}

/* ═══════════════════════════════════════════════════════════
 *  尘起逻辑 — awakening 阶段使用
 * ═══════════════════════════════════════════════════════════ */

/**
 * 尘起阶段
 * skip: 尘落+1，进入主阶段
 * activate: 尘落+1，消耗1个冥想骰，激活/切换/充能目标神器
 */
export function performAwakening(
  game: GameState,
  selfId: string,
  action: 'skip' | 'activate',
  artifactIndex?: number
): { game: GameState } {
  if (action === 'skip') {
    return {
      game: {
        ...game,
        dustFallCounter: game.dustFallCounter + 1,
        phase: 'main',
      },
    };
  }

  // action === 'activate'
  let player = game.player.playerId === selfId ? game.player : game.opponent;
  let opponent = game.player.playerId === selfId ? game.opponent : game.player;

  // 消耗1个冥想骰
  if (player.zone.meditation.length > 0) {
    player = {
      ...player,
      zone: {
        ...player.zone,
        meditation: player.zone.meditation.slice(0, -1),
      },
    };
  }

  // 目标神器处理
  if (artifactIndex !== undefined && artifactIndex >= 0 && artifactIndex <= 2) {
    const artifact = player.artifacts[artifactIndex];
    if (artifact) {
      const newArtifacts = [...player.artifacts] as typeof player.artifacts;
      if (artifact.column === 2) {
        // 第三列：充能
        const newChargeCount = artifact.chargeCount + 1;
        newArtifacts[artifactIndex] = {
          ...artifact,
          chargeCount: newChargeCount,
          isActive: newChargeCount >= artifact.chargeRequirement ? true : artifact.isActive,
        };
      } else {
        // 非第三列：激活/切换
        if (!artifact.isActive) {
          newArtifacts[artifactIndex] = { ...artifact, isActive: true };
        } else {
          // 已激活：切换侧面（当前仅保留激活状态，TODO: 实际切换逻辑）
          newArtifacts[artifactIndex] = { ...artifact, isActive: true };
        }
      }
      player = { ...player, artifacts: newArtifacts };
    }
  }

  const newGame: GameState = {
    ...game,
    dustFallCounter: game.dustFallCounter + 1,
    phase: 'main',
    player: game.player.playerId === selfId ? player : opponent,
    opponent: game.player.playerId === selfId ? opponent : player,
  };

  return { game: newGame };
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

/* ═══════════════════════════════════════════════════════════
 *  结束阶段 — end 阶段使用
 * ═══════════════════════════════════════════════════════════ */

/**
 * 结束阶段：当前区域能力骰总数是否超过'意志'上限？弃置多余
 * 弃置顺序：冥想 → 攻击 → 防御
 */
export function discardExcessDice(player: PlayerState): { player: PlayerState } {
  const total =
    player.zone.defense.length +
    player.zone.attack.length +
    player.zone.meditation.length;
  const will = calcWill(player);
  let excess = total - will;
  if (excess <= 0) return { player };

  const defense = [...player.zone.defense];
  const attack = [...player.zone.attack];
  const meditation = [...player.zone.meditation];

  while (excess > 0 && meditation.length > 0) {
    meditation.pop();
    excess--;
  }
  while (excess > 0 && attack.length > 0) {
    attack.pop();
    excess--;
  }
  while (excess > 0 && defense.length > 0) {
    defense.pop();
    excess--;
  }

  return {
    player: {
      ...player,
      zone: { defense, attack, meditation },
    },
  };
}

/* ═══════════════════════════════════════════════════════════
 *  游戏结束与切换玩家
 * ═══════════════════════════════════════════════════════════ */

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
