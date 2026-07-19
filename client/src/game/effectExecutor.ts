/* ═══════════════════════════════════════════════════════════
 * EffectExecutor — 统一执行 GameEffect[]
 *
 * 设计原则:
 *   - 纯函数，不修改输入状态
 *   - 按顺序逐个执行 effect
 *   - 返回新 GameState + 元信息（消息等）
 * ═══════════════════════════════════════════════════════════ */

import type { GameState, PlayerState, Dice, DiceValue } from '../../../shared/types';
import type { GameEffect } from '../../../shared/effects';
import { rollDiceValue, generateDiceId } from './dice';

/** 执行器元信息（不存入 GameState，仅用于 UI 展示） */
export interface EffectMeta {
  messages: string[];
  totalDamageToOpponent: number;
  totalDamageToSelf: number;
  totalHealToSelf: number;
}

const EMPTY_META: EffectMeta = {
  messages: [],
  totalDamageToOpponent: 0,
  totalDamageToSelf: 0,
  totalHealToSelf: 0,
};

/** 执行一组 Effect，返回新的 GameState */
export function executeEffects(
  game: GameState,
  effects: GameEffect[],
  selfId: string
): GameState & { _meta: EffectMeta } {
  let current = { ...game, _meta: { ...EMPTY_META } };

  for (const effect of effects) {
    current = applyOneEffect(current, effect, selfId);
  }

  // 将 _meta 从 game 中剥离用于返回
  const { _meta, ...finalGame } = current;
  return { ...finalGame, _meta };
}

/** 应用单个 Effect */
function applyOneEffect(
  state: GameState & { _meta: EffectMeta },
  effect: GameEffect,
  selfId: string
): GameState & { _meta: EffectMeta } {
  switch (effect.type) {
    case 'damage':
      return applyDamage(state, effect, selfId);
    case 'trueDamage':
      return applyTrueDamage(state, effect, selfId);
    case 'heal':
      return applyHeal(state, effect, selfId);
    case 'gainDice':
      return applyGainDice(state, effect, selfId);
    case 'removeDice':
      return applyRemoveDice(state, effect, selfId);
    case 'moveDice':
      return applyMoveDice(state, effect, selfId);
    case 'changeDiceValue':
      return applyChangeDiceValue(state, effect, selfId);
    case 'modifyStat':
      return applyModifyStat(state, effect, selfId);
    case 'dustFall':
      return { ...state, dustFallCounter: state.dustFallCounter + effect.delta };
    case 'setCounter':
      return applySetCounter(state, effect, selfId);
    case 'ignoreDefense':
    case 'bonusDamage':
    case 'damageReduction':
      // 战斗修饰器：在攻击流程中由 gameStore 读取，此处直接透传
      return state;
    case 'message':
      return { ...state, _meta: { ...state._meta, messages: [...state._meta.messages, effect.text] } };
    default:
      return state;
  }
}

/** 获取目标玩家，返回 [state, 目标玩家, 另一方玩家] */
function targetPair(
  state: GameState,
  target: 'self' | 'opponent',
  selfId: string
): [GameState & { _meta: EffectMeta }, PlayerState, PlayerState] {
  const isPlayer = state.player.playerId === selfId;
  if (target === 'self') {
    return isPlayer
      ? [state, state.player, state.opponent]
      : [state, state.opponent, state.player];
  }
  return isPlayer
    ? [state, state.opponent, state.player]
    : [state, state.player, state.opponent];
}

/** 将修改后的玩家状态写回 GameState（不可变） */
function setPlayer(state: GameState, selfId: string, who: 'self' | 'opponent', player: PlayerState): GameState {
  const isPlayer = state.player.playerId === selfId;
  if (who === 'self') {
    return isPlayer ? { ...state, player } : { ...state, opponent: player };
  }
  return isPlayer ? { ...state, opponent: player } : { ...state, player };
}

/* ── 各 Effect 处理函数 ── */

function applyDamage(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'damage'; target: 'self' | 'opponent'; amount: number },
  selfId: string
) {
  const [s, target] = targetPair(state, effect.target, selfId);
  const newTarget = { ...target, life: Math.max(0, target.life - effect.amount) };
  const updated = setPlayer(s, selfId, effect.target, newTarget);
  const meta = { ...updated._meta };
  if (effect.target === 'opponent' && s.player.playerId === selfId) {
    meta.totalDamageToOpponent += effect.amount;
  } else {
    meta.totalDamageToSelf += effect.amount;
  }
  return { ...updated, _meta: meta };
}

function applyTrueDamage(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'trueDamage'; target: 'self' | 'opponent'; amount: number },
  selfId: string
) {
  // 真实伤害逻辑与普通伤害相同（区别在于战斗流程中是否被防御骰抵消）
  return applyDamage(state, { type: 'damage', target: effect.target, amount: effect.amount }, selfId);
}

function applyHeal(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'heal'; target: 'self' | 'opponent'; amount: number },
  selfId: string
) {
  const [s, target] = targetPair(state, effect.target, selfId);
  // 生命上限 = artifacts[2].life（第三列神器的生命值）
  const maxLife = target.artifacts[2]?.life ?? 50;
  const actualHeal = Math.min(effect.amount, maxLife - target.life);
  const newLife = target.life + actualHeal;
  const newTarget = { ...target, life: newLife };
  const updated = setPlayer(s, selfId, effect.target, newTarget);
  const meta = { ...updated._meta };
  if (effect.target === 'self') {
    meta.totalHealToSelf += actualHeal;
  }
  return { ...updated, _meta: meta };
}

function applyGainDice(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'gainDice'; target: 'self' | 'opponent'; zone: 'defense' | 'attack' | 'meditation'; count: number; values?: DiceValue[] },
  selfId: string
) {
  const [s, target] = targetPair(state, effect.target, selfId);
  const newDice: Dice[] = Array.from({ length: effect.count }, (_, i) => ({
    id: generateDiceId(),
    value: effect.values?.[i] ?? rollDiceValue(),
    type: effect.zone,
  }));
  const newTarget = {
    ...target,
    zone: { ...target.zone, [effect.zone]: [...target.zone[effect.zone], ...newDice] },
  };
  return setPlayer(s, selfId, effect.target, newTarget);
}

function applyRemoveDice(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'removeDice'; target: 'self' | 'opponent'; zone: 'defense' | 'attack' | 'meditation'; count: number; maxValue?: number; minValue?: number; exactValue?: number },
  selfId: string
) {
  const [s, target] = targetPair(state, effect.target, selfId);
  const pool = [...target.zone[effect.zone]];
  const hasFilter = effect.maxValue !== undefined || effect.minValue !== undefined || effect.exactValue !== undefined;

  let toRemove: Set<string>;
  if (hasFilter) {
    // 有过滤条件：只从匹配的骰子中移除
    const matching = pool.filter(d => matchesFilter(d.value, effect));
    toRemove = new Set(matching.slice(0, effect.count).map(d => d.id));
  } else {
    // 无过滤条件：从全部骰子中移除
    toRemove = new Set(pool.slice(0, effect.count).map(d => d.id));
  }

  const remaining = pool.filter(d => !toRemove.has(d.id));
  const newTarget = {
    ...target,
    zone: { ...target.zone, [effect.zone]: remaining },
  };
  return setPlayer(s, selfId, effect.target, newTarget);
}

function matchesFilter(value: number, filter: { maxValue?: number; minValue?: number; exactValue?: number }): boolean {
  if (filter.exactValue !== undefined) return value === filter.exactValue;
  if (filter.maxValue !== undefined && filter.minValue !== undefined) return value >= filter.minValue && value <= filter.maxValue;
  if (filter.maxValue !== undefined) return value <= filter.maxValue;
  if (filter.minValue !== undefined) return value >= filter.minValue;
  return true; // 无过滤条件
}

function applyMoveDice(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'moveDice'; fromTarget: 'self' | 'opponent'; fromZone: 'defense' | 'attack' | 'meditation'; toTarget: 'self' | 'opponent'; toZone: 'defense' | 'attack' | 'meditation'; count: number; keepValue?: boolean },
  selfId: string
) {
  // 1. 从来源移除
  const [s1, fromPlayer] = targetPair(state, effect.fromTarget, selfId);
  const sourcePool = [...fromPlayer.zone[effect.fromZone]];
  const toMove = sourcePool.slice(0, effect.count);
  const remainingSource = sourcePool.slice(effect.count);
  const updatedFrom = {
    ...fromPlayer,
    zone: { ...fromPlayer.zone, [effect.fromZone]: remainingSource },
  };
  let stateAfter = setPlayer(s1, selfId, effect.fromTarget, updatedFrom);

  // 2. 放到目标（保留或修改点数）
  const [s2, toPlayer] = targetPair(stateAfter, effect.toTarget, selfId);
  const movedDice: Dice[] = toMove.map(d => ({
    ...d,
    type: effect.toZone,
    value: effect.keepValue !== false ? d.value : rollDiceValue(),
  }));
  const updatedTo = {
    ...toPlayer,
    zone: { ...toPlayer.zone, [effect.toZone]: [...toPlayer.zone[effect.toZone], ...movedDice] },
  };
  return setPlayer(s2, selfId, effect.toTarget, updatedTo);
}

function applyChangeDiceValue(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'changeDiceValue'; target: 'self' | 'opponent'; zone: 'defense' | 'attack' | 'meditation'; newValue: number; oldValue?: number },
  selfId: string
) {
  const [s, target] = targetPair(state, effect.target, selfId);
  const updated = target.zone[effect.zone].map(d => {
    if (effect.oldValue !== undefined && d.value !== effect.oldValue) return d;
    return { ...d, value: effect.newValue as DiceValue };
  });
  const newTarget = { ...target, zone: { ...target.zone, [effect.zone]: updated } };
  return setPlayer(s, selfId, effect.target, newTarget);
}

function applyModifyStat(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'modifyStat'; target: 'self' | 'opponent'; stat: string; delta: number },
  selfId: string
) {
  const [s, target] = targetPair(state, effect.target, selfId);
  const stat = effect.stat as keyof Pick<PlayerState, 'speed' | 'will' | 'life' | 'attackBonus'>;
  const current = typeof target[stat] === 'number' ? (target[stat] as number) : 0;
  const newTarget = { ...target, [stat]: current + effect.delta };
  return setPlayer(s, selfId, effect.target, newTarget);
}

function applySetCounter(
  state: GameState & { _meta: EffectMeta },
  effect: { type: 'setCounter'; target: 'self' | 'opponent'; artifactIndex: number; counter: string; value: number },
  selfId: string
) {
  const [s, target] = targetPair(state, effect.target, selfId);
  const artifact = target.artifacts[effect.artifactIndex];
  if (!artifact) return s;
  const newArtifact = {
    ...artifact,
    counters: { ...artifact.counters, [effect.counter]: effect.value },
  };
  const newArtifacts = [...target.artifacts] as typeof target.artifacts;
  newArtifacts[effect.artifactIndex] = newArtifact;
  const newTarget = { ...target, artifacts: newArtifacts };
  return setPlayer(s, selfId, effect.target, newTarget);
}
