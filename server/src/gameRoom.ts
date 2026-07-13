/* ═══════════════════════════════════════════════════════════
 * 游戏房间管理 - 创建、加入、密码、4位数房间号
 * ═══════════════════════════════════════════════════════════ */

import { v4 as uuidv4 } from 'uuid';
import type { RoomState, GameMode } from '../../shared/types';

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