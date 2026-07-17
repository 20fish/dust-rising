/* ═══════════════════════════════════════════════════════════
 * Zustand 游戏状态管理 - 游戏逻辑 + UI 页面状态 + 轮选
 * ═══════════════════════════════════════════════════════════ */

import { create } from 'zustand';
import type { GameState, GamePhase, PlayerState, RoomState, Artifact, ArtifactColumn, ArtifactDef } from '../../shared/types';
import { createArtifactInstance } from '../types/game';
import { ALL_ARTIFACTS, getArtifactById } from '../game/artifacts';
import { artifactRegistry } from '../game/artifactRegistry';
import { performInitialRoll, performInitialReroll, skipAwakening, checkGameOver, switchPlayer } from '../game/engine';
import { executeSkillsByType, getSkillFn, buildSkillContext, type SkillContext, type SkillResult } from '../game/skills';

/* ── UI 页面类型 ── */
export type Screen = 'home' | 'lobby' | 'room' | 'draft' | 'game';
export type ModalType = 'multiplayer' | 'join' | 'create' | 'single' | null;

/* ── 轮选状态 ──
 * 规则: 3列各随机选3件(共9件) → 随机决定先后手 → 后手得尘起标记
 *   1. 先手 ban 1件
 *   2. 后手从同列选1件, 先手得另一件 (同列双方各得1件)
 *   3. 先手场上选1件
 *   4. 后手从剩余两列各选1件
 *   5. 先手从自身缺少的列选最后1件
 *   6. 多余2件 ban 掉
 * ─────────────────────────────────────────────────────────── */
export interface DraftState {
  /** 随机选出的9件神器池（3列 × 3件） */
  pool: ArtifactDef[];
  /** 子步骤 (0-6)，0=先手ban, 1=后手选同列, 2=先手选, 3=后手选列A, 4=后手选列B, 5=先手选最后, 6=完成 */
  subStep: number;
  /** 先手玩家 */
  firstPlayer: 'player' | 'opponent';
  /** 步骤1中被ban的神器 */
  bannedArtifact: ArtifactDef | null;
  /** 玩家已选神器 */
  playerPicks: ArtifactDef[];
  /** 对手已选神器 */
  opponentPicks: ArtifactDef[];
  /** 最终被ban的2件 */
  finalBanned: ArtifactDef[];
}

/* ── 辅助: 随机打乱数组 ── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── 辅助: 获取玩家缺失的列 ── */
function getMissingColumns(picks: ArtifactDef[]): ArtifactColumn[] {
  const have = new Set(picks.map((a) => a.column));
  return ([0, 1, 2] as ArtifactColumn[]).filter((c) => !have.has(c));
}

interface GameStore extends GameState {
  /* ── 网络状态 ── */
  isConnected: boolean;
  roomId: string | null;

  /* ── UI 页面管理 ── */
  screen: Screen;
  activeModal: ModalType;
  roomList: RoomState[];
  currentRoom: RoomState | null;
  playerName: string;
  joinRoomCode: string;

  /* ── 轮选状态 ── */
  draft: DraftState;

  // UI 操作
  setScreen: (screen: Screen) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setRoomList: (rooms: RoomState[]) => void;
  setCurrentRoom: (room: RoomState | null) => void;
  setPlayerName: (name: string) => void;
  setJoinRoomCode: (code: string) => void;

  // 轮选操作
  initDraft: () => void;
  /** 当前轮选动作：ban或pick */
  draftAction: (artifactId: string) => void;
  /** 获取所有已选/ban神器ID集合 */
  getUsedIds: () => Set<string>;

  // 游戏操作
  initGame: (preset?: string) => void;
  setGameState: (state: Partial<GameState>) => void;
  setIsConnected: (connected: boolean) => void;
  setRoomId: (roomId: string | null) => void;
  doInitialRoll: () => void;
  doInitialReroll: (diceIds: string[]) => void;
  setPhase: (phase: GamePhase) => void;
  skipAwakeningPhase: () => void;
  selectDice: (diceId: string) => void;
  deselectDice: (diceId: string) => void;
  clearSelection: () => void;
  doAttack: (defenseDiceId?: string) => void;
  advancePhase: () => void;

  // 技能系统操作
  /** 执行一个主动技能 */
  useSkill: (skillId: string) => SkillResult;
  /** 获取当前玩家可用的技能列表 */
  getAvailableSkills: () => { skillId: string; name: string; description: string; canExecute: boolean }[];
  /** 构建技能上下文，用于技能函数调用 */
  getSkillContext: () => SkillContext;
}

/** 创建默认玩家 */
function createPlayer(
  id: string,
  name: string,
  col1Id: string,
  col2Id: string,
  col3Id: string,
  hasDustSeal: boolean = false
): PlayerState {
  const c1 = getArtifactById(col1Id);
  const c2 = getArtifactById(col2Id);
  const c3 = getArtifactById(col3Id);
  if (!c1 || !c2 || !c3) throw new Error(`神器不存在: ${col1Id}, ${col2Id}, ${col3Id}`);

  return {
    playerId: id,
    name,
    artifacts: [
      createArtifactInstance(c1),
      createArtifactInstance(c2),
      createArtifactInstance(c3),
    ] as [Artifact, Artifact, Artifact],
    zone: { defense: [], attack: [], meditation: [] },
    speed: c1.speed,
    will: c1.will,
    life: c3.life,
    attackBonus: 0,
    hasDustSeal,
    chargeCount: c3.chargeRequirement,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  // ── 初始游戏状态 ──
  player: createPlayer('player', '玩家', 'yuqie', 'yinglue', 'aige', false),
  opponent: createPlayer('opponent', '对手', 'jingang', 'youming', 'dunwu', true),
  currentPlayerId: 'player',
  phase: 'initialRoll',
  round: 1,
  dustFallCounter: 0,
  selectedDiceIds: [],
  isGameOver: false,
  winnerId: null,

  // ── 网络状态 ──
  isConnected: false,
  roomId: null,

  // ── UI 页面状态 ──
  screen: 'home',
  activeModal: null,
  roomList: [],
  currentRoom: null,
  playerName: '',
  joinRoomCode: '',

  // ── 轮选初始状态 ──
  draft: {
    pool: [],
    subStep: 0,
    firstPlayer: 'player',
    bannedArtifact: null,
    playerPicks: [],
    opponentPicks: [],
    finalBanned: [],
  },

  // ── UI 操作 ──
  setScreen: (screen) => set({ screen }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setRoomList: (rooms) => set({ roomList: rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setPlayerName: (name) => set({ playerName: name }),
  setJoinRoomCode: (code) => set({ joinRoomCode: code }),

  // ── 轮选操作 ──

  /** 初始化轮选：每列随机选3件，随机决定先后手 */
  initDraft: () => {
    // 从3列中每列随机选3件
    const pool: Artifact[] = [];
    for (const col of [0, 1, 2] as ArtifactColumn[]) {
      const colArtifacts = ALL_ARTIFACTS.filter((a) => a.column === col);
      const selected = shuffle(colArtifacts).slice(0, 3);
      pool.push(...selected);
    }
    // 随机先后手
    const firstPlayer: 'player' | 'opponent' = Math.random() < 0.5 ? 'player' : 'opponent';

    set({
      draft: {
        pool,
        subStep: 0,
        firstPlayer,
        bannedArtifact: null,
        playerPicks: [],
        opponentPicks: [],
        finalBanned: [],
      },
    });
  },

  /** 获取所有不可选神器ID */
  getUsedIds: () => {
    const { draft } = get();
    const ids = new Set<string>();
    if (draft.bannedArtifact) ids.add(draft.bannedArtifact.id);
    draft.playerPicks.forEach((a) => ids.add(a.id));
    draft.opponentPicks.forEach((a) => ids.add(a.id));
    draft.finalBanned.forEach((a) => ids.add(a.id));
    return ids;
  },

  /** 轮选动作：根据当前 subStep 自动判断是 ban 还是 pick */
  draftAction: (artifactId: string) => {
    const { draft } = get();
    const artifact = draft.pool.find((a) => a.id === artifactId);
    if (!artifact) return;

    // 已使用的不可再选
    const used = get().getUsedIds();
    if (used.has(artifactId)) return;

    const isFirst = draft.firstPlayer === 'player';
    const firstPicks = isFirst ? draft.playerPicks : draft.opponentPicks;
    const secondPicks = isFirst ? draft.opponentPicks : draft.playerPicks;

    switch (draft.subStep) {
      /* ── 步骤1: 先手 ban 1件 ── */
      case 0: {
        set({
          draft: {
            ...draft,
            bannedArtifact: artifact,
            subStep: 1,
          },
        });
        break;
      }

      /* ── 步骤2: 后手从同列选1件 → 先手自动得另一件 ── */
      case 1: {
        if (artifact.column !== draft.bannedArtifact!.column) return;
        // 同列剩下的另一件
        const other = draft.pool.find(
          (a) =>
            a.column === draft.bannedArtifact!.column &&
            a.id !== artifactId &&
            a.id !== draft.bannedArtifact!.id
        );
        if (!other) return;

        // 后手选 artifact, 先手得 other
        const newFirst = [...firstPicks, other];
        const newSecond = [...secondPicks, artifact];

        set({
          draft: {
            ...draft,
            playerPicks: isFirst ? newFirst : newSecond,
            opponentPicks: isFirst ? newSecond : newFirst,
            subStep: 2,
          },
        });
        break;
      }

      /* ── 步骤3: 先手从场上选1件 ── */
      case 2: {
        // 先手已有一列(banned列)，可选任意列但不能重复已选列
        if (firstPicks.some((a) => a.column === artifact.column)) return;

        const newFirst = [...firstPicks, artifact];
        set({
          draft: {
            ...draft,
            playerPicks: isFirst ? newFirst : draft.playerPicks,
            opponentPicks: isFirst ? draft.opponentPicks : newFirst,
            subStep: 3,
          },
        });
        break;
      }

      /* ── 步骤4a: 后手从剩余列选第一件 ── */
      case 3: {
        // 后手只能选自己缺少的列，且不能和被ban列相同
        const secondMissing = getMissingColumns(secondPicks);
        if (!secondMissing.includes(artifact.column)) return;

        const newSecond = [...secondPicks, artifact];
        set({
          draft: {
            ...draft,
            playerPicks: isFirst ? draft.playerPicks : newSecond,
            opponentPicks: isFirst ? newSecond : draft.opponentPicks,
            subStep: 4,
          },
        });
        break;
      }

      /* ── 步骤4b: 后手从剩余列选第二件 ── */
      case 4: {
        const secondMissing = getMissingColumns(secondPicks);
        if (!secondMissing.includes(artifact.column)) return;

        const newSecond = [...secondPicks, artifact];
        set({
          draft: {
            ...draft,
            playerPicks: isFirst ? draft.playerPicks : newSecond,
            opponentPicks: isFirst ? newSecond : draft.opponentPicks,
            subStep: 5,
          },
        });
        break;
      }

      /* ── 步骤5: 先手选最后一件（从缺失列） ── */
      case 5: {
        const firstMissing = getMissingColumns(firstPicks);
        if (!firstMissing.includes(artifact.column)) return;

        const newFirst = [...firstPicks, artifact];

        // 收集剩余2件作为最终ban
        const allUsed = new Set<string>([
          ...(draft.bannedArtifact ? [draft.bannedArtifact.id] : []),
          ...newFirst.map((a) => a.id),
          ...secondPicks.map((a) => a.id),
        ]);
        const finalBanned = draft.pool.filter((a) => !allUsed.has(a.id));

        const playerPicksFinal = isFirst ? newFirst : secondPicks;
        const opponentPicksFinal = isFirst ? secondPicks : newFirst;

        // 按列排序：第一列/第二列/第三列
        const sortByCol = (arr: ArtifactDef[]) => [...arr].sort((a, b) => a.column - b.column);
        const p = sortByCol(playerPicksFinal);
        const o = sortByCol(opponentPicksFinal);

        // 后手得尘起标记
        const secondIsDustSeal = draft.firstPlayer === 'player' ? 'opponent' : 'player';
        const playerHasSeal = secondIsDustSeal === 'player';

        set({
          draft: {
            ...draft,
            playerPicks: playerPicksFinal,
            opponentPicks: opponentPicksFinal,
            finalBanned,
            subStep: 6,
          },
          player: createPlayer('player', get().playerName || '玩家', p[0].id, p[1].id, p[2].id, playerHasSeal),
          opponent: createPlayer('opponent', '对手', o[0].id, o[1].id, o[2].id, !playerHasSeal),
          currentPlayerId: 'player',
          phase: 'initialRoll',
          round: 1,
          dustFallCounter: 0,
          selectedDiceIds: [],
          isGameOver: false,
          winnerId: null,
          screen: 'game',
        });
        break;
      }
    }
  },

  // ── 游戏操作 ──
  initGame: (preset) => {
    set({
      player: createPlayer('player', '玩家', 'yuqie', 'yinglue', 'aige', false),
      opponent: createPlayer('opponent', '对手', 'jingang', 'youming', 'dunwu', true),
      currentPlayerId: 'player',
      phase: 'initialRoll',
      round: 1,
      dustFallCounter: 0,
      selectedDiceIds: [],
      isGameOver: false,
      winnerId: null,
    });
  },

  setGameState: (partial) => set(partial),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setRoomId: (roomId) => set({ roomId }),

  doInitialRoll: () => {
    const state = get();
    const { player: newPlayer } = performInitialRoll(state.player);
    const { player: newOpponent } = performInitialRoll(state.opponent);
    set({ player: newPlayer, opponent: newOpponent, phase: 'awakening' });
  },

  doInitialReroll: (diceIds) => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    if (isPlayer) {
      const { player: newPlayer } = performInitialReroll(state.player, diceIds);
      set({ player: newPlayer });
    } else {
      const { player: newOpponent } = performInitialReroll(state.opponent, diceIds);
      set({ opponent: newOpponent });
    }
  },

  setPhase: (phase) => set({ phase }),

  skipAwakeningPhase: () => {
    const state = get();
    const newState = skipAwakening(state);
    const checked = checkGameOver(newState);
    set(checked);
  },

  selectDice: (diceId) => {
    set((s) => ({
      selectedDiceIds: s.selectedDiceIds.includes(diceId)
        ? s.selectedDiceIds
        : [...s.selectedDiceIds, diceId],
    }));
  },

  deselectDice: (diceId) => {
    set((s) => ({
      selectedDiceIds: s.selectedDiceIds.filter((id) => id !== diceId),
    }));
  },

  clearSelection: () => set({ selectedDiceIds: [] }),

  doAttack: (defenseDiceId) => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    const attacker = isPlayer ? state.player : state.opponent;
    const defender = isPlayer ? state.opponent : state.player;

    const allAttackDice = attacker.zone.attack;
    const selectedAttackDice = allAttackDice.filter((d) =>
      state.selectedDiceIds.includes(d.id)
    );

    if (selectedAttackDice.length === 0) return;

    /* 移除攻击骰子 */
    const attackIds = new Set(selectedAttackDice.map((d) => d.id));
    const updatedAttacker = {
      ...attacker,
      zone: {
        ...attacker.zone,
        attack: attacker.zone.attack.filter((d) => !attackIds.has(d.id)),
      },
    };

    /* 防御判定 */
    let updatedDefender = { ...defender };
    let baseDamage = selectedAttackDice.reduce((sum, d) => sum + d.value, 0) + attacker.attackBonus;
    let blocked = false;

    if (defenseDiceId) {
      updatedDefender = {
        ...updatedDefender,
        zone: {
          ...updatedDefender.zone,
          defense: updatedDefender.zone.defense.filter((d) => d.id !== defenseDiceId),
        },
      };
      baseDamage = 0;
      blocked = true;
    }

    /* 构建技能上下文 */
    const skillCtx = buildSkillContext(state, updatedAttacker, updatedDefender, {
      attackDice: selectedAttackDice,
      damage: baseDamage,
      defenseDiceId: defenseDiceId || undefined,
    });

    /* 执行攻击方的触发技能（如影掠：额外伤害） */
    const triggerResult = executeSkillsByType(skillCtx, 'trigger');

    /* 执行防御方的持续技能（如金刚：减伤，孤塔：额外护盾） */
    const continuousResult = executeSkillsByType(
      { ...skillCtx, owner: updatedDefender, opponent: updatedAttacker },
      'continuous'
    );

    /* 应用技能加成 */
    const bonusDamage = (triggerResult.bonusDamage || 0);
    const damageReduction = (continuousResult.damageReduction || 0);
    const finalDamage = Math.max(0, baseDamage + bonusDamage - damageReduction);

    /* 应用伤害 */
    updatedDefender = {
      ...updatedDefender,
      life: Math.max(0, updatedDefender.life - finalDamage),
    };

    const newState: Partial<GameState> = isPlayer
      ? { player: updatedAttacker, opponent: updatedDefender }
      : { player: updatedDefender, opponent: updatedAttacker };

    set({ ...newState, selectedDiceIds: [] });
  },

  advancePhase: () => {
    const state = get();
    const phaseOrder: GamePhase[] = ['replenish', 'reroll', 'awakening', 'main', 'end'];
    const idx = phaseOrder.indexOf(state.phase);
    if (idx >= 0 && idx < phaseOrder.length - 1) {
      const next = phaseOrder[idx + 1];
      if (next === 'end') {
        const switched = switchPlayer(state);

        /* 回合结束 → 切换玩家 → 新回合开始，触发回合开始技能 */
        const newPlayer = switched.currentPlayerId === switched.player.playerId
          ? switched.player
          : switched.opponent;
        const newOpponent = switched.currentPlayerId === switched.player.playerId
          ? switched.opponent
          : switched.player;

        const skillCtx = buildSkillContext(
          switched as GameState,
          newPlayer,
          newOpponent
        );

        /* 新回合开始的触发技能（如邪灵：敌方尘落+1） */
        const roundStartResult = executeSkillsByType(skillCtx, 'trigger');
        let updatedSwitched = { ...switched };

        if (roundStartResult.dustFallDelta) {
          updatedSwitched.dustFallCounter = (switched.dustFallCounter || 0) + roundStartResult.dustFallDelta;
        }

        set({ ...updatedSwitched, phase: 'replenish' });
      } else {
        set({ phase: next });
      }
    }
  },

  /* ── 技能系统操作 ── */

  /** 构建技能上下文 */
  getSkillContext: () => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    return buildSkillContext(
      state,
      isPlayer ? state.player : state.opponent,
      isPlayer ? state.opponent : state.player
    );
  },

  /** 执行一个主动技能 */
  useSkill: (skillId: string) => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    const owner = isPlayer ? state.player : state.opponent;
    const opponent = isPlayer ? state.opponent : state.player;

    const fn = getSkillFn(skillId);
    if (!fn) {
      return { canExecute: false, message: '未知技能' };
    }

    const ctx = buildSkillContext(state, owner, opponent);
    const result = fn(ctx);

    if (!result.canExecute) {
      return result;
    }

    /* 应用技能结果到状态 */
    const updatedOwner = result.owner
      ? { ...owner, ...result.owner }
      : owner;
    const updatedOpponent = result.opponent
      ? { ...opponent, ...result.opponent }
      : opponent;

    const newState: Partial<GameState> = isPlayer
      ? { player: updatedOwner, opponent: updatedOpponent }
      : { player: updatedOpponent, opponent: updatedOwner };

    set(newState);
    return result;
  },

  /** 获取当前玩家可用的主动技能列表 */
  getAvailableSkills: () => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    const owner = isPlayer ? state.player : state.opponent;
    const opponent = isPlayer ? state.opponent : state.player;
    const ctx = buildSkillContext(state, owner, opponent);

    const available: { skillId: string; name: string; description: string; canExecute: boolean }[] = [];

    for (const artifact of owner.artifacts) {
      if (!artifact) continue;
      for (const skill of artifact.skills) {
        if (skill.type !== 'active') continue;
        const fn = getSkillFn(skill.skillId);
        if (!fn) continue;
        const check = fn(ctx);
        available.push({
          skillId: skill.skillId,
          name: skill.name,
          description: skill.description,
          canExecute: check.canExecute !== false,
        });
      }
    }

    return available;
  },
}));