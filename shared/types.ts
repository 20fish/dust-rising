/* ═══════════════════════════════════════════════════════════
 * 前后端共享类型定义
 * ═══════════════════════════════════════════════════════════ */

/** 骰子类型 */
export type DiceType = 'attack' | 'defense' | 'meditation';
export type DiceValue = 1 | 2 | 3 | 4 | 5 | 6;

export interface Dice {
  id: string;
  type: DiceType;
  value: DiceValue;
}

export type DiceDistribution = Partial<Record<DiceValue, DiceType>>;

/** 神器列 */
export type ArtifactColumn = 0 | 1 | 2;

/** 技能基础类型 */
export type SkillBaseType = 'active' | 'continuous' | 'trigger' | 'onActivate' | 'onCharge' | 'onKill';
/** 技能类型（支持分号分隔的组合，如 "启动；持续"） */
export type SkillType = SkillBaseType | string;

export interface Skill {
  /** 技能唯一ID，对应 SKILL_REGISTRY 中的键 */
  skillId: string;
  name: string;
  type: SkillType;
  description: string;
}

/* ═══════════════════════════════════════════════════════════
 *  神器定义（静态数据，不与运行时状态耦合）
 *  这是创意工坊中玩家可自定义的完整数据结构
 * ═══════════════════════════════════════════════════════════ */

/** 神器属性预算约束 */
export const ARTIFACT_BUDGET = {
  /** 速度+意志 总点数上限 */
  SPEED_WILL_MAX: 11,
  /** 生命值上限 */
  LIFE_MAX: 15,
  /** 充能需求上限 */
  CHARGE_MAX: 5,
  /** 充能需求下限 */
  CHARGE_MIN: 2,
  /** 技能数量上限 */
  SKILL_MAX: 2,
  /** 每列可注册神器数上限 */
  PER_COLUMN_MAX: 6,
} as const;

/** 神器来源 */
export type ArtifactSource = 'builtin' | 'custom';

/** 神器定义 — 静态数据，不含运行时状态 */
export interface ArtifactDef {
  /** 唯一ID，内置神器用英文slug，自定义神器用 UUID */
  id: string;
  /** 显示名称 */
  name: string;
  /** 所属列 */
  column: ArtifactColumn;
  /** 来源 */
  source: ArtifactSource;
  /** 数据版本号，用于未来迁移 */
  version: number;

  /* ── 属性 ── */
  speed: number;
  will: number;
  life: number;
  chargeRequirement: number;

  /* ── 骰点分布 ── */
  diceDistribution: DiceDistribution;

  /* ── 技能 ── */
  skills: Skill[];

  /* ── 视觉 ── */
  /** 图片文件名（不含路径和扩展名），如 '空'/'影'/'战鬼'，自定义神器用 UUID */
  imageKey: string;

  /* ── 元数据（创意工坊用） ── */
  /** 作者名（内置神器为空） */
  author?: string;
  /** 创作时间戳 */
  createdAt?: number;
  /** 标签 */
  tags?: string[];
}

/** 神器实例 — 运行时状态（战斗中的具体一件神器） */
export interface Artifact extends ArtifactDef {
  /** 是否处于激活状态 */
  isActive: boolean;
  /** 激活侧面（0=第一侧面, 1=第二侧面），仅双侧面神器使用 */
  activeSide: number;
  /** 当前充能计数 */
  chargeCount: number;
  /** 通用计数器（技能使用的各种叠加层数等） */
  counters: Record<string, number>;
}

/** 从 ArtifactDef 创建运行时实例 */
export function createArtifactInstance(def: ArtifactDef): Artifact {
  return {
    ...def,
    isActive: false,
    activeSide: 0,
    chargeCount: 0,
    counters: {},
  };
}

/** 骰子区域 */
export interface DiceZone {
  defense: Dice[];
  attack: Dice[];
  meditation: Dice[];
}

/** 游戏阶段 */
export type GamePhase =
  | 'initialRoll'
  | 'replenish'
  | 'reroll'
  | 'awakening'
  | 'main'
  | 'end';

/* ═══════════════════════════════════════════════════════════
 *  游戏事件系统 — 用于触发式技能
 * ═══════════════════════════════════════════════════════════ */

export type GameEventType =
  | 'attackStart'
  | 'attackResolved'
  | 'damageDealt'
  | 'phaseStart'
  | 'phaseEnd'
  | 'roundStart'
  | 'roundEnd'
  | 'rerollEnd'
  | 'replenishEnd';

export interface GameEvent {
  type: GameEventType;
  /** 发起事件的玩家ID */
  playerId: string;
  /** 事件影响的玩家ID */
  targetId?: string;
  /** 攻击相关 */
  attackDiceValue?: number;
  attackDamage?: number;
  attackBlocked?: boolean;
  attackDiceId?: string;
  /** 阶段相关 */
  phase?: GamePhase;
  /** 回合相关 */
  round?: number;
  /** 重掷相关 */
  rerollCount?: number;
  /** 伤害相关 */
  damageAmount?: number;
  isTrueDamage?: boolean;
}

/** 游戏模式 */
export type GameMode = 'preset' | 'draft' | 'random';

/** 玩家状态 */
export interface PlayerState {
  playerId: string;
  name: string;
  artifacts: [Artifact | null, Artifact | null, Artifact | null];
  zone: DiceZone;
  speed: number;
  will: number;
  life: number;
  attackBonus: number;
  hasDustSeal: boolean;
  chargeCount: number;
}

/** 完整游戏状态 */
export interface GameState {
  player: PlayerState;
  opponent: PlayerState;
  currentPlayerId: string;
  phase: GamePhase;
  round: number;
  dustFallCounter: number;
  selectedDiceIds: string[];
  isGameOver: boolean;
  winnerId: string | null;
  /** 最近一次事件（用于触发式技能判断） */
  lastEvent?: GameEvent;
  /** 供应堆骰子池（1-6点各一个） */
  dicePool: Dice[];
}

/** 游戏动作 */
export interface GameAction {
  type: string;
  playerId: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

/** 房间状态 */
export interface RoomState {
  roomId: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  players: { id: string; name: string; ready: boolean }[];
  gameMode: GameMode;
  password: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
}

/** 轮选动作数据（服务端↔客户端同步） */
export interface DraftActionData {
  /** 被操作的神器ID */
  artifactId: string;
  /** 操作后的子步骤 */
  subStep: number;
  /** 操作类型 */
  actionType: 'ban' | 'pick';
}

/** 轮选初始数据（服务端下发） */
export interface DraftInitData {
  pool: ArtifactDef[];
  firstPlayer: string; // socket.id of the first player
  subStep: number;
}

/** Socket 事件类型 */
export interface ServerToClientEvents {
  player_joined: (data: { playerId: string; playerName: string }) => void;
  player_left: (data: { playerId: string }) => void;
  player_ready_update: (data: { playerId: string; ready: boolean }) => void;
  game_action: (action: GameAction) => void;
  game_state_update: (gameState: GameState) => void;
  chat_message: (data: { playerId: string; message: string; timestamp: number }) => void;
  room_list_update: (rooms: RoomState[]) => void;
  game_started: (data: { roomId: string; draft: DraftInitData }) => void;
  draft_action: (data: DraftActionData) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { playerName: string; gameMode: string; password?: string }, callback: (res: { success: boolean; room?: RoomState; error?: string }) => void) => void;
  join_room: (data: { roomCode: string; playerName: string; password?: string }, callback: (res: { success: boolean; room?: RoomState; error?: string }) => void) => void;
  get_rooms: (data: unknown, callback: (res: { success: boolean; rooms: RoomState[] }) => void) => void;
  leave_room: (data: { roomCode: string }) => void;
  game_action: (data: { roomCode: string; action: GameAction }) => void;
  game_state_update: (data: { roomCode: string; gameState: GameState }) => void;
  chat_message: (data: { roomCode: string; message: string }) => void;
  start_game: (data: { roomCode: string }) => void;
  player_ready: (data: { roomCode: string }) => void;
  draft_action: (data: { roomCode: string } & DraftActionData) => void;
}