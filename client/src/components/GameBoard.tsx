/* ═══════════════════════════════════════════════════════════
 * 主游戏棋盘 - 镜像对称双人对战布局
 * 统一管理神器预览弹窗（避免6个 ArtifactCard 各自渲染 overlay）
 * ═══════════════════════════════════════════════════════════ */

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Artifact } from '../types/game';
import { getArtifactImage } from '../game/artifacts';
import { PlayerArea } from './PlayerArea';
import { Battlefield } from './Battlefield';

export const GameBoard: React.FC = () => {
  const {
    player,
    opponent,
    phase,
    dustFallCounter,
    selectedDiceIds,
    isGameOver,
    winnerId,
    doInitialRoll,
    skipAwakeningPhase,
    advancePhase,
    selectDice,
    deselectDice,
  } = useGameStore();

  /* ── 神器预览状态（GameBoard 级别统一管理，全局唯一） ── */
  const [previewArtifact, setPreviewArtifact] = useState<Artifact | null>(null);

  // 处理确认按钮
  const handleConfirm = () => {
    if (phase === 'initialRoll') {
      doInitialRoll();
    }
  };

  return (
    <div className="table">
      {/* 对手区域 (上方) */}
      <PlayerArea
        player={opponent}
        isOpponent={true}
        selectedDiceIds={selectedDiceIds}
        onSelectDice={selectDice}
        onDeselectDice={deselectDice}
        onArtifactClick={setPreviewArtifact}
      />

      {/* 中央战场栏 */}
      <Battlefield
        phase={phase}
        dustFallCounter={dustFallCounter}
        onSkipAwakening={skipAwakeningPhase}
        onConfirm={handleConfirm}
        onNextPhase={advancePhase}
      />

      {/* 玩家区域 (下方) */}
      <PlayerArea
        player={player}
        isOpponent={false}
        selectedDiceIds={selectedDiceIds}
        onSelectDice={selectDice}
        onDeselectDice={deselectDice}
        onArtifactClick={setPreviewArtifact}
      />

      {/* ── 神器原图预览弹窗（全局唯一，GameBoard 级别渲染） ── */}
      {previewArtifact && (
        <div
          className="artifact-preview-overlay"
          onClick={() => setPreviewArtifact(null)}
        >
          {/* 点击遮罩关闭 */}
          <img
            className="artifact-preview-img"
            src={getArtifactImage(previewArtifact)}
            alt={previewArtifact.name}
            onClick={(e) => e.stopPropagation()}
          />
          {/* 关闭按钮 */}
          <button
            className="artifact-preview-close"
            onClick={() => setPreviewArtifact(null)}
          >
            &times;
          </button>
        </div>
      )}

      {/* 游戏结束弹窗 */}
      {isGameOver && (
        <div className="gameover-overlay">
          <div className="gameover-card">
            <h2>游戏结束</h2>
            <p>{winnerId === player.playerId ? '你赢了！' : '对手获胜'}</p>
            <button onClick={() => useGameStore.getState().initGame()}>再来一局</button>
          </div>
        </div>
      )}
    </div>
  );
};