/* ═══════════════════════════════════════════════════════════
 * 游戏房间管理 - 创建、加入、密码、4位数房间号
 * ═══════════════════════════════════════════════════════════ */

import { v4 as uuidv4 } from 'uuid';
import type { RoomState, GameMode, ArtifactDef, ArtifactColumn } from '../../shared/types';

/** 轮选状态（服务端权威） */
export interface ServerDraftState {
  /** 随机选出的9件神器定义（3列 × 3件） */
  pool: ArtifactDef[];
  /** 先手玩家 socket.id */
  firstPlayer: string;
  /** 当前子步骤 (0-6) */
  subStep: number;
  /** 步骤1中被ban的神器 */
  bannedArtifact: ArtifactDef | null;
  /** 先手已选神器 */
  firstPicks: ArtifactDef[];
  /** 后手已选神器 */
  secondPicks: ArtifactDef[];
  /** 最终被ban的2件 */
  finalBanned: ArtifactDef[];
}

/** 房间扩展数据（存储在内存中） */
const roomDraftStates: Map<string, ServerDraftState> = new Map();

/** 生成4位数房间号 */
function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

/** 内存中的房间 */
const rooms: Map<string, RoomState> = new Map();

/** 房间号到ID的映射 */
const codeToId: Map<string, string> = new Map();

/** 创建房间 */
export function createRoom(
  hostId: string,
  hostName: string,
  gameMode: GameMode,
  password?: string
): RoomState {
  const roomCode = generateRoomCode();
  const room: RoomState = {
    roomId: uuidv4(),
    roomCode,
    hostId,
    hostName,
    players: [{ id: hostId, name: hostName, ready: true }],
    gameMode,
    password: password || '',
    status: 'waiting',
    createdAt: Date.now(),
  };
  rooms.set(room.roomId, room);
  codeToId.set(roomCode, room.roomId);
  console.log(`[房间] 创建 ${roomCode}，房主: ${hostName}`);
  return room;
}

/** 通过房间号加入房间 */
export function joinRoomByCode(
  roomCode: string,
  playerId: string,
  playerName: string,
  password?: string
): RoomState | null {
  const roomId = codeToId.get(roomCode);
  if (!roomId) return null;
  return joinRoom(roomId, playerId, playerName, password);
}

/** 加入房间 */
export function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string,
  password?: string
): RoomState | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.players.length >= 2) return null;
  if (room.password && room.password !== password) return null;
  room.players.push({ id: playerId, name: playerName, ready: false });
  return room;
}

/** 获取房间 */
export function getRoom(roomId: string): RoomState | undefined {
  return rooms.get(roomId);
}

/** 通过房间号获取房间 */
export function getRoomByCode(roomCode: string): RoomState | undefined {
  const roomId = codeToId.get(roomCode);
  return roomId ? rooms.get(roomId) : undefined;
}

/** 删除房间 */
export function deleteRoom(roomId: string): void {
  const room = rooms.get(roomId);
  if (room) {
    codeToId.delete(room.roomCode);
    rooms.delete(roomId);
    console.log(`[房间] 删除 ${room.roomCode}`);
  }
}

/** 获取可加入的房间列表 */
export function getAvailableRooms(): RoomState[] {
  return Array.from(rooms.values())
    .filter(r => r.status === 'waiting' && r.players.length < 2)
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** 更新房间状态 */
export function updateRoomStatus(roomId: string, status: RoomState['status']): void {
  const room = rooms.get(roomId);
  if (room) {
    room.status = status;
    console.log(`[房间] ${room.roomCode} 状态: ${status}`);
  }
}

/** 设置玩家准备状态 */
export function setPlayerReady(roomCode: string, playerId: string): boolean {
  const room = getRoomByCode(roomCode);
  if (!room) return false;
  const player = room.players.find(p => p.id === playerId);
  if (!player) return false;
  player.ready = true;
  console.log(`[房间] ${room.roomCode} ${player.name} 已准备`);
  return true;
}

/** 检查是否所有玩家都已准备 */
export function allPlayersReady(roomCode: string): boolean {
  const room = getRoomByCode(roomCode);
  if (!room) return false;
  return room.players.length >= 2 && room.players.every(p => p.ready);
}

/* ── 轮选相关 ── */

/** 服务端生成轮选状态 */
export function generateDraftState(roomCode: string, allArtifacts: ArtifactDef[]): ServerDraftState | null {
  const room = getRoomByCode(roomCode);
  if (!room) return null;

  // 每列随机选3件神器
  const getCol = (c: ArtifactColumn) => allArtifacts.filter(a => a.column === c);
  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

  const pool = [
    ...shuffle(getCol(0)).slice(0, 3),
    ...shuffle(getCol(1)).slice(0, 3),
    ...shuffle(getCol(2)).slice(0, 3),
  ];

  // 随机决定先后手
  const firstPlayer = Math.random() < 0.5 ? room.players[0].id : room.players[1].id;

  const state: ServerDraftState = {
    pool,
    firstPlayer,
    subStep: 0,
    bannedArtifact: null,
    firstPicks: [],
    secondPicks: [],
    finalBanned: [],
  };

  roomDraftStates.set(roomCode, state);
  console.log(`[轮选] ${roomCode} 先手: ${firstPlayer}, pool: ${pool.map(a => a.name).join(',')}`);
  return state;
}

/** 获取轮选状态 */
export function getDraftState(roomCode: string): ServerDraftState | undefined {
  return roomDraftStates.get(roomCode);
}

/** 更新轮选状态 */
export function updateDraftState(roomCode: string, state: ServerDraftState): void {
  roomDraftStates.set(roomCode, state);
}

/** 清理过期房间 (超过30分钟) */
export function cleanupRooms(): void {
  const now = Date.now();
  const expiry = 30 * 60 * 1000;
  for (const [id, room] of rooms) {
    if (now - room.createdAt > expiry) {
      codeToId.delete(room.roomCode);
      rooms.delete(id);
    }
  }
}

// 每5分钟清理一次
setInterval(cleanupRooms, 5 * 60 * 1000);