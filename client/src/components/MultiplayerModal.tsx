/* ═══════════════════════════════════════════════════════════
 * MultiplayerModal - 多人模式弹窗
 * 三个选项：加入游戏、创建游戏、游戏大厅
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { connect } from '../network/socket';

export const MultiplayerModal: React.FC = () => {
  const { closeModal, openModal } = useGameStore();

  /** 连接服务器并打开相应界面 */
  const handleAction = (action: 'join' | 'create' /* | 'lobby' */) => {
    // 先连接服务器
    connect();
    // if (action === 'lobby') {
    //   closeModal();
    //   setScreen('lobby');
    // } else {
      openModal(action);
    // }
  };

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* 弹窗头部 */}
        <div className="modal-header">
          <h2 className="modal-title">多人模式</h2>
          <button className="modal-close" onClick={closeModal}>&times;</button>
        </div>

        {/* 选项列表 */}
        <div className="modal-body">
          <button className="modal-option" onClick={() => handleAction('join')}>
            <span className="modal-option-icon">&#x1F50D;</span>
            <div className="modal-option-text">
              <span className="modal-option-title">加入游戏</span>
              <span className="modal-option-desc">输入房间号加入已有房间</span>
            </div>
            <span className="modal-option-arrow">&rsaquo;</span>
          </button>

          <button className="modal-option" onClick={() => handleAction('create')}>
            <span className="modal-option-icon">&#x2795;</span>
            <div className="modal-option-text">
              <span className="modal-option-title">创建游戏</span>
              <span className="modal-option-desc">创建新房间并邀请好友</span>
            </div>
            <span className="modal-option-arrow">&rsaquo;</span>
          </button>

          {/* <button className="modal-option" onClick={() => handleAction('lobby')}>
            <span className="modal-option-icon">&#x1F3E0;</span>
            <div className="modal-option-text">
              <span className="modal-option-title">游戏大厅</span>
              <span className="modal-option-desc">浏览所有可加入的房间</span>
            </div>
            <span className="modal-option-arrow">&rsaquo;</span>
          </button> */}
        </div>
      </div>
    </div>
  );
};