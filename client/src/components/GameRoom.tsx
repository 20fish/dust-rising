/* ═══════════════════════════════════════════════════════════
 * GameRoom - 游戏房间界面
 * 显示房间号（可复制）、玩家列表、准备按钮、开始游戏按钮（房主）
 * ═══════════════════════════════════════════════════════════ */

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { startGame, leaveRoom, sendReady, onPlayerJoined, onPlayerLeft, removeAllListeners } from '../network/socket';

export const GameRoom: React.FC = () => {
  const { currentRoom, setCurrentRoom, setScreen, playerName, socketId } = useGameStore();
  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState(currentRoom?.players || []);

  const isHost = currentRoom?.hostId === socketId;

  /* ── 监听对手加入/离开 ── */
  useEffect(() => {
    if (!currentRoom) return;

    setPlayers(currentRoom.players);

    onPlayerJoined((data) => {
      setPlayers((prev) => {
        if (prev.some((p) => p.id === data.playerId)) return prev;
        return [...prev, { id: data.playerId, name: data.playerName, ready: false }];
      });
      // 同步更新 store 的 currentRoom
      const room = useGameStore.getState().currentRoom;
      if (room) {
        setCurrentRoom({
          ...room,
          players: [...room.players, { id: data.playerId, name: data.playerName, ready: false }],
        });
      }
    });

    onPlayerLeft((data) => {
      setPlayers((prev) => prev.filter((p) => p.id !== data.playerId));
    });

    return () => {
      // 不移除所有监听器，因为 App.tsx 也注册了全局监听器
    };
  }, [currentRoom]);

  /* ── 复制房间号 ── */
  const handleCopy = async () => {
    if (!currentRoom) return;
    try {
      // 尝试使用 Clipboard API
      await navigator.clipboard.writeText(currentRoom.roomCode);
      setCopied(true);
    } catch {
      // Fallback: 使用 execCommand (非HTTPS兼容)
      try {
        const textarea = document.createElement('textarea');
        textarea.value = currentRoom.roomCode;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
      } catch {
        // 静默失败
      }
    }
    if (copied) return;
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── 玩家准备 ── */
  const handleReady = () => {
    if (!currentRoom) return;
    sendReady(currentRoom.roomCode);
    // 本地立即更新
    setPlayers((prev) =>
      prev.map((p) =>
        p.id === socketId ? { ...p, ready: true } : p
      )
    );
    // 同步更新 store
    setCurrentRoom({
      ...currentRoom,
      players: currentRoom.players.map((p) =>
        p.id === socketId ? { ...p, ready: true } : p
      ),
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

  const allReady = players.length >= 2 && players.every((p) => p.ready);
  const thisPlayer = players.find((p) => p.id === socketId);
  const isReady = thisPlayer?.ready ?? false;

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
              <span className="room-player-badge">{p.id === currentRoom.hostId ? '房主' : '对手'}</span>
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
          {/* 非房主显示准备按钮 */}
          {!isHost && players.length >= 2 && !isReady && (
            <button className="room-btn ready" onClick={handleReady}>
              准备
            </button>
          )}
          {!isHost && isReady && (
            <span className="room-ready-done">已准备，等待房主开始...</span>
          )}

          {/* 房主显示开始按钮（仅双方都准备后可用） */}
          {isHost && players.length >= 2 && (
            <button
              className={`room-btn start ${!allReady ? 'disabled' : ''}`}
              onClick={handleStartGame}
              disabled={!allReady}
            >
              {allReady ? '开始游戏' : '等待对手准备...'}
            </button>
          )}
          {isHost && players.length < 2 && (
            <span className="room-ready-done">等待对手加入...</span>
          )}

          <button className="room-btn leave" onClick={handleLeave}>
            离开房间
          </button>
        </div>
      </div>
    </div>
  );
};