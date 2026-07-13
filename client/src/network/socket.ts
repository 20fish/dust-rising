/* ═══════════════════════════════════════════════════════════
 * 前端 Socket 客户端 - 对接服务端（roomCode 体系）
 * 支持创建/加入房间、密码、大厅同步、游戏开始
 * ═══════════════════════════════════════════════════════════ */

import { io, Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  GameState,
  GameAction,
  RoomState,
} from '../../shared/types';

/** 服务端地址 — 通过 Vite 代理，同源访问 */
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

/** 获取 Socket 实例 */
export function getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
}

/** 连接服务器 */
export function connect(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

/** 断开连接 */
export function disconnect(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
  socket = null;
}

/** 创建房间（支持密码） */
export function createRoom(
  playerName: string,
  gameMode: string,
  password?: string
): Promise<RoomState | null> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('create_room', { playerName, gameMode, password }, (res) => {
      resolve(res.success ? res.room! : null);
    });
  });
}

/** 加入房间（通过房间号，支持密码） */
export function joinRoom(
  roomCode: string,
  playerName: string,
  password?: string
): Promise<RoomState | null> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('join_room', { roomCode, playerName, password }, (res) => {
      resolve(res.success ? res.room! : null);
    });
  });
}

/** 获取可用房间列表 */
export function getAvailableRooms(): Promise<RoomState[]> {
  return new Promise((resolve) => {
    const s = getSocket();
    s.emit('get_rooms', {}, (res) => {
      resolve(res.rooms);
    });
  });
}

/** 离开房间 */
export function leaveRoom(roomCode: string): void {
  getSocket().emit('leave_room', { roomCode });
}

/** 房主开始游戏 */
export function startGame(roomCode: string): void {
  getSocket().emit('start_game', { roomCode });
}

/** 发送游戏动作 */
export function sendGameAction(roomCode: string, action: GameAction): void {
  getSocket().emit('game_action', { roomCode, action });
}

/** 同步游戏状态 */
export function syncGameState(roomCode: string, gameState: GameState): void {
  getSocket().emit('game_state_update', { roomCode, gameState });
}

/** 发送聊天消息 */
export function sendChatMessage(roomCode: string, message: string): void {
  getSocket().emit('chat_message', { roomCode, message });
}

/* ═══════════════ 事件监听 ═══════════════ */

/** 监听游戏动作 */
export function onGameAction(callback: (action: GameAction) => void): void {
  getSocket().on('game_action', callback);
}

/** 监听游戏状态更新 */
export function onGameStateUpdate(callback: (gameState: GameState) => void): void {
  getSocket().on('game_state_update', callback);
}

/** 监听对手加入 */
export function onPlayerJoined(
  callback: (data: { playerId: string; playerName: string }) => void
): void {
  getSocket().on('player_joined', callback);
}

/** 监听对手离开 */
export function onPlayerLeft(callback: (data: { playerId: string }) => void): void {
  getSocket().on('player_left', callback);
}

/** 监听聊天消息 */
export function onChatMessage(
  callback: (data: { playerId: string; message: string; timestamp: number }) => void
): void {
  getSocket().on('chat_message', callback);
}

/** 监听大厅房间列表更新 */
export function onRoomListUpdate(callback: (rooms: RoomState[]) => void): void {
  getSocket().on('room_list_update', callback);
}

/** 监听游戏开始 */
export function onGameStarted(callback: (data: { roomId: string }) => void): void {
  getSocket().on('game_started', callback);
}

/** 移除所有监听器 */
export function removeAllListeners(): void {
  const s = getSocket();
  s.removeAllListeners();
}