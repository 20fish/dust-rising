/* ═══════════════════════════════════════════════════════════
 * GameRoom - 游戏房间界面
 * 显示房间号（可复制）、玩家列表、开始游戏按钮（房主）
 * ═══════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { startGame, leaveRoom, onPlayerJoined, onPlayerLeft, onGameStarted, removeAllListeners } from '../network/socket';

export const GameRoom: React.FC = () => {
  const { currentRoom, setCurrentRoom, setScreen, playerName, setRoomId, initDraft } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState(currentRoom?.players || []);
  const isHost = currentRoom?.hostId !== undefined; // 所有在房间界面的都视为参与者

  /* ── 监听对手加入/离开 ── */
  useEffect(() => {
    if (!currentRoom) return;

    const rooms = currentRoom;
    setPlayers(rooms.players);

    // 监听对手加入
    onPlayerJoined((data) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.id === data.playerId)) return prev;
        return [...prev, { id: data.playerId, name: data.playerName, ready: false }];
      });
    });

    // 监听对手离开
    onPlayerLeft((data) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    });

    // 监听游戏开始 → 进入轮选阶段
    onGameStarted((data) => {
      setRoomId(data.roomId);
      initDraft();
      setScreen('draft');
    });

    return () => {
      removeAllListeners();
    };
  }, [currentRoom]);

  /* ── 复制房间号 ── */
  const handleCopy = () => {
    if (!currentRoom) return;
    navigator.clipboard.writeText(currentRoom.roomCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── 开始游戏 ── */
  const handleStartGame = () => {
    if (!currentRoom) return;
    startGame(currentRoom.roomCode);
  };

  /* ── 离开房间 ── */
  const handleLeave = () => {
    if (!currentRoom) return;
    leaveRoom(currentRoom.roomCode);
    setCurrentRoom(null);
    setScreen('home');
  };

  if (!currentRoom) return null;

  return (
    <div className="room-page">
      <div className="room-card">
        {/* 房间号展示 */}
        <div className="room-code-section">
          <span className="room-code-label">房间号</span>
          <div className="room-code-display" onClick={handleCopy}>
            <span className="room-code-value">{currentRoom.roomCode}</span>
            <span className="room-code-copy">{copied ? '已复制 ✓' : '点击复制'}</span>
          </div>
        </div>

        {/* 分享提示 */}
        <p className="room-hint">
          将房间号分享给好友，等待对方加入
        </p>

        {/* 玩家列表 */}
        <div className="room-players">
          <h3 className="room-section-title">玩家列表</h3>
          {players.map((p, i) => (
            <div key={p.id} className={`room-player ${i === 0 ? 'host' : 'guest'}`}>
              <span className="room-player-badge">{i === 0 ? '房主' : '对手'}</span>
              <span className="room-player-name">{p.name}</span>
              <span className="room-player-status">{p.ready ? '已准备' : '等待中'}</span>
            </div>
          ))}
          {/* 如果只有一人，显示空位 */}
          {players.length < 2 && (
            <div className="room-player waiting">
              <span className="room-player-badge">等待</span>
              <span className="room-player-name">等待对手加入...</span>
              <span className="room-player-status">—</span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="room-actions">
          {players.length >= 2 && (
            <button className="room-btn start" onClick={handleStartGame}>
              开始游戏
            </button>
          )}
          <button className="room-btn leave" onClick={handleLeave}>
            离开房间
          </button>
        </div>
      </div>
    </div>
  );
};