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

export type DiceDistribution = Record<DiceValue, DiceType>;

/** 神器列 */
export type ArtifactColumn = 0 | 1 | 2;

/** 技能类型 */
export type SkillType = 'active' | 'continuous' | 'trigger' | 'onActivate' | 'onCharge';

export interface Skill {
  name: string;
  type: SkillType;
  description: string;
}

export interface Artifact {
  id: string;
  name: string;
  column: ArtifactColumn;
  speed: number;
  will: number;
  life: number;
  chargeRequirement: number;
  diceDistribution: DiceDistribution;
  skills: Skill[];
  isActive: boolean;
  chargeCount: number;
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

/** Socket 事件类型 */
export interface ServerToClientEvents {
  player_joined: (data: { playerId: string; playerName: string }) => void;
  player_left: (data: { playerId: string }) => void;
  game_action: (action: GameAction) => void;
  game_state_update: (gameState: GameState) => void;
  chat_message: (data: { playerId: string; message: string; timestamp: number }) => void;
  room_list_update: (rooms: RoomState[]) => void;
  game_started: (data: { roomId: string }) => void;
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
}