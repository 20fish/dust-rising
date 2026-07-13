/* ═══════════════════════════════════════════════════════════
 * JoinGameModal - 加入游戏弹窗
 * 输入房间号（4位数）和密码（可选）
 * ═══════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { joinRoom } from '../network/socket';

export const JoinGameModal: React.FC = () => {
  const { closeModal, openModal, playerName, setCurrentRoom, joinRoomCode, setJoinRoomCode } = useGameStore();
  const [roomCode, setRoomCode] = useState(joinRoomCode);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /** 提交加入房间 */
  const handleSubmit = async () => {
    setError('');
    if (!roomCode.trim() || roomCode.trim().length !== 4) {
      setError('请输入4位房间号');
      return;
    }

    setLoading(true);
    try {
      const room = await joinRoom(roomCode.trim(), playerName, password || undefined);
      if (room) {
        setCurrentRoom(room);
        setJoinRoomCode('');
        closeModal();
        // 如果不含密码，直接回到多人模式弹窗，跳转到房间界面
        // 由 App 根据 currentRoom 切换到 room 页面
      } else {
        setError('房间不存在、已满或密码错误');
      }
    } catch {
      setError('连接失败，请检查网络');
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">加入游戏</h2>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <div className="modal-body">
          {/* 房间号输入 */}
          <div className="form-group">
            <label className="form-label">房间号</label>
            <input
              className="form-input"
              type="text"
              placeholder="输入4位房间号"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              autoFocus
            />
          </div>

          {/* 密码输入 */}
          <div className="form-group">
            <label className="form-label">密码（可选）</label>
            <input
              className="form-input"
              type="text"
              placeholder="房间无密码可留空"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* 错误提示 */}
          {error && <div className="form-error">{error}</div>}

          {/* 提交按钮 */}
          <button
            className="form-btn primary"
            onClick={handleSubmit}
            disabled={loading || roomCode.length !== 4}
          >
            {loading ? '加入中...' : '加入游戏'}
          </button>

          {/* 返回 */}
          <button className="form-btn secondary" onClick={() => openModal('multiplayer')}>
            返回
          </button>
        </div>
      </div>
    </div>
  );
};