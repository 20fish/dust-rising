/* ═══════════════════════════════════════════════════════════
 * 主游戏棋盘 - 镜像对称双人对战布局
 * 统一管理神器预览弹窗（避免6个 ArtifactCard 各自渲染 overlay）
 * ═══════════════════════════════════════════════════════════ */

import React, { useState, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Artifact } from '../types/game';
import { getArtifactImage } from '../game/artifacts';
import { PlayerArea } from './PlayerArea';
import { Battlefield } from './Battlefield';

const PHASE_LABEL: Record<string, string> = {
  initialRoll: '初始重掷',
  replenish: '补充阶段',
  reroll: '重掷阶段',
  awakening: '尘起阶段',
  main: '主要阶段',
  end: '结束阶段',
};

/** 每个阶段的操作提示 */
const PHASE_HINT: Record<string, string> = {
  initialRoll: '初始投掷已完成，可以重掷骰子后进入下一阶段',
  replenish: '补充骰子中，请等待分配完成',
  reroll: '选择要重掷的骰子（最多等于速度值），然后重掷',
  awakening: '选择跳过尘起或激活神器',
  main: '选择一个攻击骰发起攻击，或使用技能',
  end: '回合结束，多余骰子将被弃置',
};

export const GameBoard: React.FC = () => {
  const {
    player,
    opponent,
    currentPlayerId,
    round,
    phase,
    dustFallCounter,
    selectedDiceIds,
    isGameOver,
    winnerId,
    defensePending,
    skipAwakeningPhase,
    doAwakening,
    doReroll,
    advancePhase,
    selectDice,
    deselectDice,
    initiateAttack,
    resolveDefense,
    useSkill,
    getAvailableSkills,
    clearSelection,
  } = useGameStore();

  /* ── 神器预览状态（GameBoard 级别统一管理，全局唯一） ── */
  const [previewArtifact, setPreviewArtifact] = useState<Artifact | null>(null);

  const currentPlayerName = currentPlayerId === player.playerId ? player.name : opponent.name;
  const isCurrentPlayerSelf = currentPlayerId === player.playerId;

  // 初始重掷阶段属于双方准备，不显示"谁的回合"
  const isInitialPhase = phase === 'initialRoll';
  const turnLabel = isInitialPhase ? '准备阶段' : `${currentPlayerName} 的回合`;

  /* ── 获取当前玩家的骰子 ── */
  const currentPlayer = isCurrentPlayerSelf ? player : opponent;
  const currentOpponent = isCurrentPlayerSelf ? opponent : player;

  /* ── 可用技能 ── */
  const availableSkills = useMemo(() => {
    if (!isCurrentPlayerSelf) return [];
    return getAvailableSkills();
  }, [player, opponent, currentPlayerId, phase, getAvailableSkills]);

  /* ── 能否攻击：当前玩家有攻击骰且选中了恰好1个攻击骰 ── */
  const canAttack = useMemo(() => {
    if (defensePending) return false;
    if (phase !== 'main') return false;
    const attackDice = currentPlayer.zone.attack;
    if (attackDice.length === 0) return false;
    const selectedAttack = selectedDiceIds.filter((id) =>
      attackDice.some((d) => d.id === id)
    );
    return selectedAttack.length === 1;
  }, [phase, currentPlayer.zone.attack, selectedDiceIds, defensePending]);

  /* ── 能否重掷：选中了骰子且不超过速度 ── */
  const canReroll = useMemo(() => {
    return selectedDiceIds.length > 0 && selectedDiceIds.length <= currentPlayer.speed;
  }, [selectedDiceIds, currentPlayer.speed]);

  /* ── 防御模式：获取可选的防御骰 ── */
  const defenseDiceIds = useMemo(() => {
    if (!defensePending) return [];
    // 防御方是当前轮到的玩家（对手回合时，防御方是玩家自己）
    return currentOpponent.zone.defense.map((d) => d.id);
  }, [defensePending, currentOpponent.zone.defense]);

  /* ── 操作处理 ── */

  // 攻击：从选中的骰子中找攻击骰，发起攻击
  const handleAttack = () => {
    const attackDice = currentPlayer.zone.attack;
    const selectedAttack = selectedDiceIds.find((id) =>
      attackDice.some((d) => d.id === id)
    );
    if (selectedAttack) {
      initiateAttack(selectedAttack);
    }
  };

  // 重掷
  const handleReroll = () => {
    if (canReroll) {
      doReroll([...selectedDiceIds]);
      clearSelection();
    }
  };

  // 防御跳过
  const handleSkipDefense = () => {
    resolveDefense(undefined);
  };

  // 防御确认
  const handleConfirmDefense = () => {
    const selectedDefense = selectedDiceIds.find((id) =>
      defenseDiceIds.includes(id)
    );
    resolveDefense(selectedDefense);
  };

  return (
    <div className="table">
      {/* 回合信息栏 */}
      <div className="turn-info-bar">
        <span className="turn-round">第 {round} 回合</span>
        <span className="turn-divider">|</span>
        <span className="turn-player">{turnLabel}</span>
        <span className="turn-divider">|</span>
        <span className="turn-phase">{PHASE_LABEL[phase] ?? phase}</span>
        <span className="turn-divider">|</span>
        <span className="turn-dust">尘落 {dustFallCounter}/10</span>
      </div>

      {/* 操作提示栏 */}
      {defensePending ? (
        <div className="phase-hint-bar opponent-turn">
          <span className="phase-hint-icon">🛡</span>
          <span className="phase-hint-text">
            对方发起攻击！请选择防御骰或跳过
          </span>
        </div>
      ) : (
        <div className={`phase-hint-bar ${isCurrentPlayerSelf ? 'self-turn' : 'opponent-turn'}`}>
          <span className="phase-hint-icon">{isCurrentPlayerSelf ? '▶' : '⏳'}</span>
          <span className="phase-hint-text">
            {isCurrentPlayerSelf
              ? PHASE_HINT[phase] ?? '等待中...'
              : `等待 ${currentPlayerName} 操作...`}
          </span>
        </div>
      )}

      {/* 对手区域 (上方) — 仅在防御待定模式时允许选中对手的防御骰 */}
      <PlayerArea
        player={opponent}
        isOpponent={true}
        selectedDiceIds={defensePending ? selectedDiceIds : (isCurrentPlayerSelf ? selectedDiceIds : [])}
        onSelectDice={defensePending ? selectDice : (() => {})}
        onDeselectDice={defensePending ? deselectDice : (() => {})}
        onArtifactClick={setPreviewArtifact}
      />

      {/* 中央战场栏 */}
      <Battlefield
        phase={phase}
        dustFallCounter={dustFallCounter}
        canAct={isCurrentPlayerSelf || defensePending}
        onSkipAwakening={skipAwakeningPhase}
        onActivateArtifact={(index) => {
          doAwakening('activate', index);
        }}
        onAttack={handleAttack}
        onReroll={handleReroll}
        onNextPhase={advancePhase}
        onUseSkill={(skillId) => {
          useSkill(skillId);
        }}
        canAttack={canAttack}
        canReroll={canReroll}
        availableSkills={availableSkills}
        defensePending={defensePending}
        onSkipDefense={handleSkipDefense}
        onConfirmDefense={handleConfirmDefense}
      />

      {/* 玩家区域 (下方) */}
      <PlayerArea
        player={player}
        isOpponent={false}
        selectedDiceIds={defensePending ? selectedDiceIds : (isCurrentPlayerSelf ? selectedDiceIds : [])}
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
          <img
            className="artifact-preview-img"
            src={getArtifactImage(previewArtifact)}
            alt={previewArtifact.name}
            onClick={(e) => e.stopPropagation()}
          />
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