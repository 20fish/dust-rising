/* ═══════════════════════════════════════════════════════════
 * HomePage - 游戏主页面
 * 游戏标题、单人模式 / 多人模式入口
 * ═══════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const HomePage: React.FC = () => {
  const { openModal, setPlayerName, playerName } = useGameStore();
  const [nameInput, setNameInput] = useState(playerName || '');

  /** 进入多人模式：先要求输入昵称 */
  const handleMultiplayer = () => {
    if (!nameInput.trim()) return;
    setPlayerName(nameInput.trim());
    openModal('multiplayer');
  };

  // /** 进入单人模式：先要求输入昵称 */
  // const handleSinglePlayer = () => {
  //   if (!nameInput.trim()) return;
  //   setPlayerName(nameInput.trim());
  //   openModal('single');
  // };

  return (
    <div className="home-page">
      {/* 背景装饰 */}
      <div className="home-bg" />

      {/* 主内容 */}
      <div className="home-content">
        {/* 游戏标题 */}
        <div className="home-title-group">
          <h1 className="home-title">尘起时刻</h1>
          <p className="home-subtitle">战术骰子对战</p>
        </div>

        {/* 昵称输入 */}
        <div className="home-name-input">
          <label className="home-label">你的昵称</label>
          <input
            className="home-input"
            type="text"
            placeholder="输入昵称..."
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={12}
            onKeyDown={(e) => { if (e.key === 'Enter') handleMultiplayer(); }}
          />
        </div>

        {/* 模式选择按钮 */}
        <div className="home-buttons">
          <button className="home-btn primary" onClick={handleMultiplayer}>
            <span className="home-btn-icon">⚔</span>
            <span className="home-btn-text">
              <span className="home-btn-title">多人模式</span>
              <span className="home-btn-desc">在线对战</span>
            </span>
          </button>

          {/* <button className="home-btn secondary" onClick={handleSinglePlayer}>
            <span className="home-btn-icon">☗</span>
            <span className="home-btn-text">
              <span className="home-btn-title">单人模式</span>
              <span className="home-btn-desc">AI 对战</span>
            </span>
          </button> */}
        </div>
      </div>

      {/* 底部版本号 */}
      <div className="home-footer">
        <span>v1.0 · 尘起时刻</span>
      </div>
    </div>
  );
};