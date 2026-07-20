/* ═══════════════════════════════════════════════════════════
 * Zustand 游戏状态管理 - 游戏逻辑 + UI 页面状态 + 轮选
 * ═══════════════════════════════════════════════════════════ */

import { create } from 'zustand';
import type { GameState, GamePhase, PlayerState, RoomState, Artifact, ArtifactColumn, ArtifactDef } from '../../shared/types';
import { createArtifactInstance } from '../types/game';
import { ALL_ARTIFACTS, getArtifactById } from '../game/artifacts';
import { artifactRegistry } from '../game/artifactRegistry';
import { performInitialRoll, performInitialReroll, performAwakening, performReroll, checkGameOver, switchPlayer, replenishDice, discardExcessDice, tickCharge } from '../game/engine';
import { executeSkillsByType, getSkillFn, resolvePlayers } from '../game/skills';
import { executeEffects } from '../game/effectExecutor';
import { calcAttackBonus } from '../game/attributeCalculator';
import type { SkillExecutionResult } from '../../../shared/effects';
import { sendDraftAction } from '../network/socket';

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
  /** 先手玩家 socket.id */
  firstPlayerId: string;
  /** 步骤1中被ban的神器 */
  bannedArtifact: ArtifactDef | null;
  /** 玩家已选神器 */
  playerPicks: ArtifactDef[];
  /** 对手已选神器 */
  opponentPicks: ArtifactDef[];
  /** 最终被ban的2件 */
  finalBanned: ArtifactDef[];
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
  socketId: string;

  /* ── UI 页面管理 ── */
  screen: Screen;
  activeModal: ModalType;
  roomList: RoomState[];
  currentRoom: RoomState | null;
  playerName: string;
  joinRoomCode: string;

  /* ── 轮选状态 ── */
  draft: DraftState;
  /** 预览中的神器ID（弹窗用） */
  previewArtifactId: string | null;

  /* ── 防御待定状态 ── */
  defensePending: boolean;
  pendingAttackDiceId: string | null;

  // UI 操作
  setScreen: (screen: Screen) => void;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  setRoomList: (rooms: RoomState[]) => void;
  setCurrentRoom: (room: RoomState | null) => void;
  setPlayerName: (name: string) => void;
  setJoinRoomCode: (code: string) => void;
  setSocketId: (id: string) => void;

  // 轮选操作
  /** 从服务端数据初始化轮选 */
  initDraft: (pool: ArtifactDef[], firstPlayerId: string) => void;
  /** 当前轮选动作：ban或pick (本地执行 + 网络同步) */
  draftAction: (artifactId: string) => void;
  /** 应用对手的轮选动作 */
  applyDraftAction: (artifactId: string, subStep: number, actionType: 'ban' | 'pick') => void;
  /** 获取所有已选/ban神器ID集合 */
  getUsedIds: () => Set<string>;
  /** 预览神器 */
  setPreviewArtifact: (artifactId: string | null) => void;
  /** 确认预览选择 */
  confirmPreview: () => void;
  /** 取消预览 */
  cancelPreview: () => void;

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
  doAttack: (attackDiceId: string, defenseDiceId?: string) => void;
  doAwakening: (action: 'skip' | 'activate', artifactIndex?: number) => void;
  doReroll: (diceIds: string[]) => void;
  initiateAttack: (attackDiceId: string) => void;
  resolveDefense: (defenseDiceId?: string) => void;
  advancePhase: () => void;

  // 技能系统操作
  useSkill: (skillId: string) => SkillExecutionResult;
  getAvailableSkills: () => { skillId: string; name: string; description: string; canExecute: boolean }[];
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
    chargeCount: 0,
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
  defensePending: false,
  pendingAttackDiceId: null,

  // ── 网络状态 ──
  isConnected: false,
  roomId: null,
  socketId: '',

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
    firstPlayerId: '',
    bannedArtifact: null,
    playerPicks: [],
    opponentPicks: [],
    finalBanned: [],
  },
  previewArtifactId: null,

  // ── UI 操作 ──
  setScreen: (screen) => set({ screen }),
  openModal: (modal) => set({ activeModal: modal }),
  closeModal: () => set({ activeModal: null }),
  setRoomList: (rooms) => set({ roomList: rooms }),
  setCurrentRoom: (room) => set({ currentRoom: room }),
  setPlayerName: (name) => set({ playerName: name }),
  setJoinRoomCode: (code) => set({ joinRoomCode: code }),
  setSocketId: (id) => set({ socketId: id }),

  // ── 轮选操作 ──

  /** 从服务端数据初始化轮选 */
  initDraft: (pool, firstPlayerId) => {
    set({
      draft: {
        pool,
        subStep: 0,
        firstPlayerId,
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

  /** 预览神器 */
  setPreviewArtifact: (artifactId) => set({ previewArtifactId: artifactId }),

  /** 确认预览选择 */
  confirmPreview: () => {
    const { previewArtifactId } = get();
    if (previewArtifactId) {
      get().draftAction(previewArtifactId);
      set({ previewArtifactId: null });
    }
  },

  /** 取消预览 */
  cancelPreview: () => set({ previewArtifactId: null }),

  /** 轮选动作：根据当前 subStep 自动判断是 ban 还是 pick */
  draftAction: (artifactId: string) => {
    const { draft, socketId, currentRoom } = get();
    const artifact = draft.pool.find((a) => a.id === artifactId);
    if (!artifact) return;

    // 已使用的不可再选
    const used = get().getUsedIds();
    if (used.has(artifactId)) return;

    const isFirst = draft.firstPlayerId === socketId;
    const firstPicks = isFirst ? draft.playerPicks : draft.opponentPicks;
    const secondPicks = isFirst ? draft.opponentPicks : draft.playerPicks;

    const actionType = draft.subStep === 0 ? 'ban' : 'pick';

    switch (draft.subStep) {
      /* ── 步骤1: 先手 ban 1件 ── */
      case 0: {
        const newDraft = {
          ...draft,
          bannedArtifact: artifact,
          subStep: 1,
        };
        set({ draft: newDraft });
        // 网络同步
        if (currentRoom) {
          sendDraftAction(currentRoom.roomCode, { artifactId, subStep: 1, actionType: 'ban' });
        }
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

        const newDraft = {
          ...draft,
          playerPicks: isFirst ? newFirst : newSecond,
          opponentPicks: isFirst ? newSecond : newFirst,
          subStep: 2,
        };
        set({ draft: newDraft });
        // 网络同步
        if (currentRoom) {
          sendDraftAction(currentRoom.roomCode, { artifactId, subStep: 2, actionType: 'pick' });
        }
        break;
      }

      /* ── 步骤3: 先手从场上选1件 ── */
      case 2: {
        if (firstPicks.some((a) => a.column === artifact.column)) return;

        const newFirst = [...firstPicks, artifact];
        const newDraft = {
          ...draft,
          playerPicks: isFirst ? newFirst : draft.playerPicks,
          opponentPicks: isFirst ? draft.opponentPicks : newFirst,
          subStep: 3,
        };
        set({ draft: newDraft });
        if (currentRoom) {
          sendDraftAction(currentRoom.roomCode, { artifactId, subStep: 3, actionType: 'pick' });
        }
        break;
      }

      /* ── 步骤4a: 后手从剩余列选第一件 ── */
      case 3: {
        const secondMissing = getMissingColumns(secondPicks);
        if (!secondMissing.includes(artifact.column)) return;

        const newSecond = [...secondPicks, artifact];
        const newDraft = {
          ...draft,
          playerPicks: isFirst ? draft.playerPicks : newSecond,
          opponentPicks: isFirst ? newSecond : draft.opponentPicks,
          subStep: 4,
        };
        set({ draft: newDraft });
        if (currentRoom) {
          sendDraftAction(currentRoom.roomCode, { artifactId, subStep: 4, actionType: 'pick' });
        }
        break;
      }

      /* ── 步骤4b: 后手从剩余列选第二件 ── */
      case 4: {
        const secondMissing = getMissingColumns(secondPicks);
        if (!secondMissing.includes(artifact.column)) return;

        const newSecond = [...secondPicks, artifact];
        const newDraft = {
          ...draft,
          playerPicks: isFirst ? draft.playerPicks : newSecond,
          opponentPicks: isFirst ? newSecond : draft.opponentPicks,
          subStep: 5,
        };
        set({ draft: newDraft });
        if (currentRoom) {
          sendDraftAction(currentRoom.roomCode, { artifactId, subStep: 5, actionType: 'pick' });
        }
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
        const playerHasSeal = draft.firstPlayerId !== socketId;

        const newPlayer = createPlayer('player', get().playerName || '玩家', p[0].id, p[1].id, p[2].id, playerHasSeal);
        const newOpponent = createPlayer('opponent', '对手', o[0].id, o[1].id, o[2].id, !playerHasSeal);

        // 自动初始投掷
        const { player: rolledPlayer } = performInitialRoll(newPlayer);
        const { player: rolledOpponent } = performInitialRoll(newOpponent);

        set({
          draft: {
            ...draft,
            playerPicks: playerPicksFinal,
            opponentPicks: opponentPicksFinal,
            finalBanned,
            subStep: 6,
          },
          player: rolledPlayer,
          opponent: rolledOpponent,
          currentPlayerId: 'player',
          phase: 'initialRoll',
          round: 1,
          dustFallCounter: 0,
          selectedDiceIds: [],
          isGameOver: false,
          winnerId: null,
          defensePending: false,
          pendingAttackDiceId: null,
          screen: 'game',
        });
        if (currentRoom) {
          sendDraftAction(currentRoom.roomCode, { artifactId, subStep: 6, actionType: 'pick' });
        }
        break;
      }
    }
  },

  /** 应用对手的轮选动作 */
  applyDraftAction: (artifactId, subStep, actionType) => {
    const { draft, socketId } = get();
    const artifact = draft.pool.find((a) => a.id === artifactId);
    if (!artifact) return;

    const isThisFirst = draft.firstPlayerId === socketId;
    const isOpponentFirst = !isThisFirst;

    switch (actionType) {
      case 'ban': {
        set({
          draft: {
            ...draft,
            bannedArtifact: artifact,
            subStep,
          },
        });
        break;
      }
      case 'pick': {
        // 对手的 pick 需要根据当前步骤推断
        if (subStep === 2) {
          // 步骤2: 对手选了同列1件，我方自动得另一件
          const other = draft.pool.find(
            (a) =>
              a.column === draft.bannedArtifact!.column &&
              a.id !== artifactId &&
              a.id !== draft.bannedArtifact!.id
          );
          if (!other) return;

          const newFirst = isThisFirst ? [...draft.playerPicks, other] : [...draft.opponentPicks, other];
          const newSecond = isThisFirst ? [...draft.opponentPicks, artifact] : [...draft.playerPicks, artifact];

          set({
            draft: {
              ...draft,
              playerPicks: isThisFirst ? newFirst : newSecond,
              opponentPicks: isThisFirst ? newSecond : newFirst,
              subStep,
            },
          });
        } else if (subStep === 3) {
          // 先手选了一件
          const picks = isOpponentFirst ? draft.opponentPicks : draft.playerPicks;
          const newPicks = [...picks, artifact];
          set({
            draft: {
              ...draft,
              playerPicks: isOpponentFirst ? draft.playerPicks : newPicks,
              opponentPicks: isOpponentFirst ? newPicks : draft.opponentPicks,
              subStep,
            },
          });
        } else if (subStep === 4 || subStep === 5) {
          // 后手选了一件
          const picks = isOpponentFirst ? draft.playerPicks : draft.opponentPicks;
          const newPicks = [...picks, artifact];
          set({
            draft: {
              ...draft,
              playerPicks: isOpponentFirst ? newPicks : draft.playerPicks,
              opponentPicks: isOpponentFirst ? draft.opponentPicks : newPicks,
              subStep,
            },
          });
        } else if (subStep === 6) {
          // 最后一步：先手已选完，通知后手最终结果
          // artifactId 是先手选的最后一件，应加到先手的 picks 中
          const firstPicks = isOpponentFirst ? draft.opponentPicks : draft.playerPicks;
          const secondPicks = isOpponentFirst ? draft.playerPicks : draft.opponentPicks;
          const newFirstPicks = [...firstPicks, artifact];

          const allUsed = new Set<string>([
            ...(draft.bannedArtifact ? [draft.bannedArtifact.id] : []),
            ...newFirstPicks.map((a) => a.id),
            ...secondPicks.map((a) => a.id),
          ]);
          const finalBanned = draft.pool.filter((a) => !allUsed.has(a.id));

          const sortByCol = (arr: ArtifactDef[]) => [...arr].sort((a, b) => a.column - b.column);
          const p = sortByCol(secondPicks);
          const o = sortByCol(newFirstPicks);

          const playerHasSeal = draft.firstPlayerId !== socketId;

          const newPlayer = createPlayer('player', get().playerName || '玩家', p[0].id, p[1].id, p[2].id, playerHasSeal);
          const newOpponent = createPlayer('opponent', '对手', o[0].id, o[1].id, o[2].id, !playerHasSeal);

          // 自动初始投掷（后手视角也需要）
          const { player: rolledPlayer } = performInitialRoll(newPlayer);
          const { player: rolledOpponent } = performInitialRoll(newOpponent);

          set({
            draft: {
              ...draft,
              playerPicks: secondPicks,
              opponentPicks: newFirstPicks,
              finalBanned,
              subStep: 6,
            },
            player: rolledPlayer,
            opponent: rolledOpponent,
            currentPlayerId: 'player',
            phase: 'initialRoll',
            round: 1,
            dustFallCounter: 0,
            selectedDiceIds: [],
            isGameOver: false,
            winnerId: null,
            defensePending: false,
            pendingAttackDiceId: null,
            screen: 'game',
          });
        }
        break;
      }
    }
  },

  // ── 游戏操作 ──
  initGame: (preset) => {
    const player = createPlayer('player', '玩家', 'yuqie', 'yinglue', 'aige', false);
    const opponent = createPlayer('opponent', '对手', 'jingang', 'youming', 'dunwu', true);
    // 自动初始投掷
    const { player: rolledPlayer } = performInitialRoll(player);
    const { player: rolledOpponent } = performInitialRoll(opponent);
    set({
      player: rolledPlayer,
      opponent: rolledOpponent,
      currentPlayerId: 'player',
      phase: 'initialRoll',
      round: 1,
      dustFallCounter: 0,
      selectedDiceIds: [],
      isGameOver: false,
      winnerId: null,
      defensePending: false,
      pendingAttackDiceId: null,
    });
  },

  setGameState: (partial) => set(partial),
  setIsConnected: (connected) => set({ isConnected: connected }),
  setRoomId: (roomId) => set({ roomId }),

  // 初始投掷已改为 initGame / draftAction 中自动执行，保留此方法供兼容性使用
  doInitialRoll: () => {
    // no-op: 初始投掷已在游戏开始时自动完成
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
    const result = performAwakening(state, state.currentPlayerId, 'skip');
    set({ ...result.game });
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

  doAwakening: (action, artifactIndex) => {
    const state = get();
    const result = performAwakening(state, state.currentPlayerId, action, artifactIndex);
    set({ ...result.game });
  },

  doReroll: (diceIds) => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    const currentPlayer = isPlayer ? state.player : state.opponent;
    const result = performReroll(currentPlayer, diceIds);
    if (isPlayer) {
      set({
        player: result.player,
        lastEvent: { type: 'rerollEnd', playerId: currentPlayer.playerId, rerollCount: diceIds.length },
      });
    } else {
      set({
        opponent: result.player,
        lastEvent: { type: 'rerollEnd', playerId: currentPlayer.playerId, rerollCount: diceIds.length },
      });
    }
  },

  doAttack: (attackDiceId, defenseDiceId) => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    const attackerId = isPlayer ? state.player.playerId : state.opponent.playerId;
    const defenderId = isPlayer ? state.opponent.playerId : state.player.playerId;

    const attacker = isPlayer ? state.player : state.opponent;
    const attackDie = attacker.zone.attack.find((d) => d.id === attackDiceId);
    if (!attackDie) return;

    /* 执行攻击方触发技能 → 获取 bonusDamage / ignoreDefense */
    const attackerTriggerResult = executeSkillsByType(state, attackerId, 'trigger');
    const bonusDamage = attackerTriggerResult.effects
      .filter((e): e is { type: 'bonusDamage'; delta: number } => e.type === 'bonusDamage')
      .reduce((sum, e) => sum + e.delta, 0);
    const isIgnoreDefense = attackerTriggerResult.effects.some(
      (e): e is { type: 'ignoreDefense' } => e.type === 'ignoreDefense'
    );

    /* 构建 effects 列表 */
    const effects: import('../../../shared/effects').GameEffect[] = [
      { type: 'removeDice', target: 'self', zone: 'attack', count: 1 },
    ];

    let finalDamage = 0;
    const isBlocked = defenseDiceId && !isIgnoreDefense;

    if (isBlocked) {
      // 抵挡成功：移除防御骰，不造成伤害
      effects.push({ type: 'removeDice', target: 'opponent', zone: 'defense', count: 1 });
    } else {
      // 未抵挡：计算伤害
      const baseDamage = attackDie.value + calcAttackBonus(attacker);

      /* 执行防御方持续技能 → 获取 damageReduction */
      const defenderContinuousResult = executeSkillsByType(state, defenderId, 'continuous');
      const dmgReduction = defenderContinuousResult.effects
        .filter((e): e is { type: 'damageReduction'; amount: number } => e.type === 'damageReduction')
        .reduce((sum, e) => sum + e.amount, 0);

      finalDamage = Math.max(0, baseDamage + bonusDamage - dmgReduction);
      effects.push({ type: 'damage', target: 'opponent', amount: finalDamage });
    }

    /* 通过 EffectExecutor 统一应用 */
    let newState = executeEffects(state, effects, attackerId);

    /* 攻击后充能递增 */
    const attackerState = newState.player.playerId === attackerId ? newState.player : newState.opponent;
    const chargeResult = tickCharge(attackerState);

    if (chargeResult.isCharged) {
      const chargedPlayer = chargeResult.player;
      const stateWithCharge = newState.player.playerId === attackerId
        ? { ...newState, player: chargedPlayer }
        : { ...newState, opponent: chargedPlayer };

      const onChargeResult = executeSkillsByType(stateWithCharge, attackerId, 'onCharge');
      if (onChargeResult.canExecute && onChargeResult.effects.length > 0) {
        newState = executeEffects(stateWithCharge, onChargeResult.effects, attackerId);
      } else {
        newState = stateWithCharge;
      }

      /* 触发后重置充能计数 */
      const resetTarget = newState.player.playerId === attackerId ? newState.player : newState.opponent;
      const resetArtifact = { ...resetTarget.artifacts[2]!, chargeCount: 0 };
      const resetArtifacts = [...resetTarget.artifacts] as typeof resetTarget.artifacts;
      resetArtifacts[2] = resetArtifact;
      const finalReset = { ...resetTarget, artifacts: resetArtifacts };
      newState = newState.player.playerId === attackerId
        ? { ...newState, player: finalReset }
        : { ...newState, opponent: finalReset };
    } else {
      newState = newState.player.playerId === attackerId
        ? { ...newState, player: chargeResult.player }
        : { ...newState, opponent: chargeResult.player };
    }

    set({
      player: newState.player,
      opponent: newState.opponent,
      selectedDiceIds: [],
      lastEvent: {
        type: 'attackResolved',
        playerId: attackerId,
        targetId: defenderId,
        attackDiceValue: attackDie.value,
        attackDamage: finalDamage,
        attackBlocked: isBlocked,
        attackDiceId,
      },
    });
  },

  /* ── 发起攻击：检查对手是否有防御骰，有则进入防御待定模式 ── */
  initiateAttack: (attackDiceId: string) => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    const opponent = isPlayer ? state.opponent : state.player;
    const attackerId = isPlayer ? state.player.playerId : state.opponent.playerId;

    // 设置攻击开始事件
    set({ lastEvent: { type: 'attackStart', playerId: attackerId, attackDiceId } });

    // 如果对手有防御骰，进入防御选择模式
    if (opponent.zone.defense.length > 0) {
      set({ defensePending: true, pendingAttackDiceId: attackDiceId, selectedDiceIds: [] });
    } else {
      // 对手无防御骰，直接攻击
      get().doAttack(attackDiceId);
    }
  },

  /* ── 防御方选择是否用防御骰抵挡 ── */
  resolveDefense: (defenseDiceId?: string) => {
    const { pendingAttackDiceId } = get();
    if (!pendingAttackDiceId) return;

    set({ defensePending: false, pendingAttackDiceId: null });
    get().doAttack(pendingAttackDiceId, defenseDiceId);
  },

  advancePhase: () => {
    const state = get();
    const prevPhase = state.phase;
    const currentPlayerId = state.currentPlayerId;

    switch (state.phase) {
      /* ── 初始投掷 → 尘起（第一回合） ── */
      case 'initialRoll': {
        set({
          phase: 'awakening',
          lastEvent: { type: 'phaseEnd', playerId: currentPlayerId, phase: 'initialRoll' },
        });
        return;
      }

      /* ── 尘起 → 主阶段 ── */
      case 'awakening': {
        set({
          phase: 'main',
          lastEvent: { type: 'phaseEnd', playerId: currentPlayerId, phase: 'awakening' },
        });
        return;
      }

      /* ── 补充 → 重掷 ── */
      case 'replenish': {
        const currentPlayer = state.currentPlayerId === state.player.playerId ? state.player : state.opponent;
        const replenished = replenishDice(currentPlayer);
        if (state.currentPlayerId === state.player.playerId) {
          set({
            player: replenished,
            phase: 'reroll',
            lastEvent: { type: 'replenishEnd', playerId: currentPlayerId },
          });
        } else {
          set({
            opponent: replenished,
            phase: 'reroll',
            lastEvent: { type: 'replenishEnd', playerId: currentPlayerId },
          });
        }
        return;
      }

      /* ── 重掷 → 主阶段 ── */
      case 'reroll': {
        set({
          phase: 'main',
          lastEvent: { type: 'rerollEnd', playerId: currentPlayerId },
        });
        return;
      }

      /* ── 主阶段 → 结束阶段 ── */
      case 'main': {
        set({
          phase: 'end',
          lastEvent: { type: 'phaseEnd', playerId: currentPlayerId, phase: 'main' },
        });
        return;
      }

      /* ── 结束阶段：弃置多余骰子 → 切换玩家 → 检查游戏结束 ── */
      case 'end': {
        const currentPlayer = state.currentPlayerId === state.player.playerId ? state.player : state.opponent;
        const afterDiscard = discardExcessDice(currentPlayer);

        let nextState: GameState = {
          ...state,
          [state.currentPlayerId === state.player.playerId ? 'player' : 'opponent']: afterDiscard.player,
        };

        // 切换玩家
        nextState = switchPlayer(nextState);
        const newRound = nextState.round;

        // 检查游戏结束
        nextState = checkGameOver(nextState);
        if (nextState.isGameOver) {
          set({ ...nextState, phase: 'end' });
          return;
        }

        // 执行新回合开始时的触发技能（如回合开始效果）
        const triggerResult = executeSkillsByType(nextState, nextState.currentPlayerId, 'trigger');
        if (triggerResult.canExecute && triggerResult.effects.length > 0) {
          nextState = executeEffects(nextState, triggerResult.effects, nextState.currentPlayerId);
        }

        // 判断下一回合的阶段：第一回合(r===1)进尘起，后续进补骰
        const nextPhase: GamePhase = nextState.round === 1 ? 'awakening' : 'replenish';
        set({
          ...nextState,
          phase: nextPhase,
          lastEvent: {
            type: 'roundEnd',
            playerId: currentPlayerId,
            round: newRound - 1,
          },
        });
        return;
      }
    }
  },

  /* ── 技能系统操作 ── */

  useSkill: (skillId: string) => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    const selfId = isPlayer ? state.player.playerId : state.opponent.playerId;

    const fn = getSkillFn(skillId);
    if (!fn) {
      return { effects: [], canExecute: false, reason: '未知技能' };
    }

    const result = fn(state, selfId);

    if (!result.canExecute) {
      return result;
    }

    // 通过 EffectExecutor 统一应用效果
    const newState = executeEffects(state, result.effects, selfId);
    set({ player: newState.player, opponent: newState.opponent });
    return result;
  },

  getAvailableSkills: () => {
    const state = get();
    const isPlayer = state.currentPlayerId === state.player.playerId;
    const selfId = isPlayer ? state.player.playerId : state.opponent.playerId;

    const available: { skillId: string; name: string; description: string; canExecute: boolean }[] = [];
    const { self } = resolvePlayers(state, selfId);

    for (const artifact of self.artifacts) {
      if (!artifact) continue;
      for (const skill of artifact.skills) {
        // 只有启动和激活类技能可以手动使用
        const types = skill.type.split(/[；;]/).map(t => t.trim());
        if (!types.includes('启动') && !types.includes('激活')) continue;
        const fn = getSkillFn(skill.skillId);
        if (!fn) continue;
        const check = fn(state, selfId);
        available.push({
          skillId: skill.skillId,
          name: skill.name,
          description: skill.description,
          canExecute: check.canExecute,
        });
      }
    }

    return available;
  },
}));