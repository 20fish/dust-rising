/* ═══════════════════════════════════════════════════════════
 * 服务端入口 - Express + Socket.io
 * 支持房间创建、加入、大厅、和对战数据同步
 * ═══════════════════════════════════════════════════════════ */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../../shared/types';
import { createRoom, joinRoomByCode, getRoom, getRoomByCode, getAvailableRooms, updateRoomStatus } from './gameRoom';

const app = express();
const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const PORT = process.env.PORT || 3001;

/** 广播大厅房间列表 */
function broadcastRoomList() {
  io.emit('room_list_update', getAvailableRooms());
}

// ── HTTP API ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: getAvailableRooms().length });
});

// ── Socket.io ──
io.on('connection', (socket) => {
  console.log(`[连接] ${socket.id} 已连接`);
  // 发送当前房间列表
  socket.emit('room_list_update', getAvailableRooms());

  /** 创建房间 */
  socket.on('create_room', (data, callback) => {
    const room = createRoom(
      socket.id,
      data.playerName,
      data.gameMode as any,
      data.password
    );
    socket.join(room.roomCode);
    console.log(`[房间] ${socket.id} 创建 ${room.roomCode}`);
    broadcastRoomList();
    callback({ success: true, room });
  });

  /** 加入房间 */
  socket.on('join_room', (data, callback) => {
    const room = joinRoomByCode(
      data.roomCode,
      socket.id,
      data.playerName,
      data.password
    );
    if (!room) {
      callback({ success: false, error: '房间不存在、已满或密码错误' });
      return;
    }
    socket.join(room.roomCode);
    console.log(`[房间] ${socket.id} 加入 ${room.roomCode}`);
    // 通知房主
    socket.to(room.roomCode).emit('player_joined', {
      playerId: socket.id,
      playerName: data.playerName,
    });
    broadcastRoomList();
    callback({ success: true, room });
  });

  /** 获取房间列表 */
  socket.on('get_rooms', (_data, callback) => {
    callback({ success: true, rooms: getAvailableRooms() });
  });

  /** 离开房间 */
  socket.on('leave_room', (data) => {
    socket.leave(data.roomCode);
    socket.to(data.roomCode).emit('player_left', { playerId: socket.id });
    console.log(`[房间] ${socket.id} 离开 ${data.roomCode}`);
    broadcastRoomList();
  });

  /** 开始游戏 */
  socket.on('start_game', (data) => {
    const room = getRoomByCode(data.roomCode);
    if (room && room.hostId === socket.id) {
      updateRoomStatus(room.roomId, 'playing');
      io.to(data.roomCode).emit('game_started', { roomId: room.roomId });
      broadcastRoomList();
    }
  });

  /** 游戏动作广播 */
  socket.on('game_action', (data) => {
    socket.to(data.roomCode).emit('game_action', data.action);
  });

  /** 游戏状态同步 */
  socket.on('game_state_update', (data) => {
    socket.to(data.roomCode).emit('game_state_update', data.gameState);
  });

  /** 聊天消息 */
  socket.on('chat_message', (data) => {
    io.to(data.roomCode).emit('chat_message', {
      playerId: socket.id,
      message: data.message,
      timestamp: Date.now(),
    });
  });

  /** 断开连接 */
  socket.on('disconnect', () => {
    console.log(`[连接] ${socket.id} 断开`);
    broadcastRoomList();
  });
});

// ── 启动 ──
httpServer.listen(PORT, () => {
  console.log(`\n⚔️  尘起时刻 服务端已启动`);
  console.log(`   地址: http://localhost:${PORT}\n`);
});