/* ═══════════════════════════════════════════════════════════
 * CreateGameModal - 创建游戏弹窗
 * 选择游戏模式、设置密码、创建后跳转房间界面
 * ═══════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { createRoom } from '../network/socket';

export const CreateGameModal: React.FC = () => {
  const { closeModal, openModal, playerName, setCurrentRoom } = useGameStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /** 提交创建房间 */
  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const room = await createRoom(playerName, 'draft', password || undefined);
      if (room) {
        setCurrentRoom(room);
        closeModal();
      } else {
        setError('创建失败，请重试');
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
          <h2 className="modal-title">创建游戏</h2>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <div className="modal-body">
          {/* 游戏模式选择 */}
          <div className="form-group">
            <label className="form-label">游戏模式</label>
            <div className="form-radio-group">
              <label className="form-radio selected">
                <input type="radio" name="gameMode" value="draft" defaultChecked />
                <span className="form-radio-content">
                  <span className="form-radio-title">轮选模式</span>
                  <span className="form-radio-desc">双方轮流选择神器</span>
                </span>
              </label>
            </div>
          </div>

          {/* 密码设置 */}
          <div className="form-group">
            <label className="form-label">房间密码（可选）</label>
            <input
              className="form-input"
              type="text"
              placeholder="留空则无需密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={20}
            />
          </div>

          {/* 错误提示 */}
          {error && <div className="form-error">{error}</div>}

          {/* 创建按钮 */}
          <button
            className="form-btn primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '创建中...' : '创建房间'}
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