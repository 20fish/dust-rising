/* ═══════════════════════════════════════════════════════════
 * SinglePlayerModal - 单人模式弹窗
 * 选择神器预设，开始单机对战
 * ═══════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const SinglePlayerModal: React.FC = () => {
  const { closeModal, initGame, setScreen } = useGameStore();
  const [selectedPreset, setSelectedPreset] = useState('default');

  /** 预设选项 */
  const presets = [
    { id: 'default', name: '默认配置', desc: '均衡型神器组合' },
    { id: 'aggressive', name: '攻击型', desc: '偏进攻型神器' },
    { id: 'defensive', name: '防御型', desc: '偏防守型神器' },
  ];

  /** 开始游戏 */
  const handleStart = () => {
    initGame(selectedPreset);
    closeModal();
    setScreen('game');
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">单人模式</h2>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        <div className="modal-body">
          {/* 预设选择 */}
          <div className="form-group">
            <label className="form-label">神器配置</label>
            <div className="form-radio-group">
              {presets.map((p) => (
                <label
                  key={p.id}
                  className={`form-radio ${selectedPreset === p.id ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="preset"
                    value={p.id}
                    checked={selectedPreset === p.id}
                    onChange={() => setSelectedPreset(p.id)}
                  />
                  <span className="form-radio-content">
                    <span className="form-radio-title">{p.name}</span>
                    <span className="form-radio-desc">{p.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 开始按钮 */}
          <button className="form-btn primary" onClick={handleStart}>
            开始游戏
          </button>

          {/* 返回 */}
          <button className="form-btn secondary" onClick={closeModal}>
            返回
          </button>
        </div>
      </div>
    </div>
  );
};