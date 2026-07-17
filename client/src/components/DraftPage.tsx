/* ═══════════════════════════════════════════════════════════
 * DraftPage - 神器轮选页面
 * 规则: 3列各随机选3件(共9件) → 随机先后手
 *   1. 先手ban 1件
 *   2. 后手从同列选1件, 先手得另一件
 *   3. 先手场上选1件
 *   4. 后手从剩余两列各选1件
 *   5. 先手从缺少列选最后1件
 *   6. 多余2件ban掉
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import { useGameStore } from '../store/gameStore';
import { getArtifactImage } from '../game/artifacts';
import type { ArtifactColumn, ArtifactDef } from '../types/game';

const COL_LABELS = ['第一列 · 速度/意志', '第二列 · 骰点分布', '第三列 · 生命/充能'];

/** 获取当前步骤的描述文本 */
function getStepLabel(subStep: number, firstPlayer: 'player' | 'opponent'): string {
  const first = firstPlayer === 'player' ? '我方' : '对手';
  const second = firstPlayer === 'player' ? '对手' : '我方';
  switch (subStep) {
    case 0: return `步骤 1/6: ${first} ban 掉一件神器`;
    case 1: return `步骤 2/6: ${second} 从被ban列选择一件`;
    case 2: return `步骤 3/6: ${first} 从场上选择一件`;
    case 3: return `步骤 4/6: ${second} 从剩余列选择第一件`;
    case 4: return `步骤 4/6: ${second} 从剩余列选择第二件`;
    case 5: return `步骤 5/6: ${first} 选择最后一件神器`;
    default: return '轮选完成';
  }
}

/** 获取当前回合的标签 */
function getTurnLabel(subStep: number, firstPlayer: 'player' | 'opponent'): string {
  const isFirst = firstPlayer === 'player';
  const isPlayerTurn = (() => {
    switch (subStep) {
      case 0: return isFirst;
      case 1: return !isFirst;
      case 2: return isFirst;
      case 3: return !isFirst;
      case 4: return !isFirst;
      case 5: return isFirst;
      default: return false;
    }
  })();
  return isPlayerTurn ? '轮到你了' : '等待对手选择...';
}

export const DraftPage: React.FC = () => {
  const { draft, draftAction, getUsedIds } = useGameStore();

  const usedIds = getUsedIds();
  const isFirst = draft.firstPlayer === 'player';

  /* ── 判断当前是否轮到玩家 ── */
  const isPlayerTurn = (() => {
    switch (draft.subStep) {
      case 0: return isFirst;
      case 1: return !isFirst;
      case 2: return isFirst;
      case 3: return !isFirst;
      case 4: return !isFirst;
      case 5: return isFirst;
      default: return false;
    }
  })();

  /* ── 按列组织神器（3列 × 3行） ── */
  const cols: ArtifactDef[][] = [
    draft.pool.filter((a) => a.column === 0),
    draft.pool.filter((a) => a.column === 1),
    draft.pool.filter((a) => a.column === 2),
  ];

  /* ── 判断神器归属 ── */
  const getOwner = (artifactId: string): 'player' | 'opponent' | 'banned' | null => {
    if (draft.bannedArtifact?.id === artifactId) return 'banned';
    if (draft.finalBanned.some((a) => a.id === artifactId)) return 'banned';
    if (draft.playerPicks.some((a) => a.id === artifactId)) return 'player';
    if (draft.opponentPicks.some((a) => a.id === artifactId)) return 'opponent';
    return null;
  };

  /* ── 判断神器是否可选 ── */
  const canPick = (artifact: ArtifactDef): boolean => {
    if (!isPlayerTurn) return false;
    if (usedIds.has(artifact.id)) return false;

    const firstPicks = isFirst ? draft.playerPicks : draft.opponentPicks;
    const secondPicks = isFirst ? draft.opponentPicks : draft.playerPicks;

    switch (draft.subStep) {
      case 0: return true; // 先手 ban: 任意
      case 1: return artifact.column === draft.bannedArtifact!.column; // 后手: 仅同列
      case 2: return !firstPicks.some((a) => a.column === artifact.column); // 先手: 不重复列
      case 3:
      case 4: {
        // 后手: 仅缺失列
        const missing = ([0, 1, 2] as ArtifactColumn[]).filter(
          (c) => !secondPicks.some((a) => a.column === c)
        );
        return missing.includes(artifact.column);
      }
      case 5: {
        // 先手: 仅缺失列
        const missing = ([0, 1, 2] as ArtifactColumn[]).filter(
          (c) => !firstPicks.some((a) => a.column === c)
        );
        return missing.includes(artifact.column);
      }
      default: return false;
    }
  };

  /* ── 点击神器 ── */
  const handleClick = (artifact: ArtifactDef) => {
    if (!isPlayerTurn) return;
    if (usedIds.has(artifact.id)) return;
    draftAction(artifact.id);
  };

  return (
    <div className="draft-page">
      {/* ── 顶部状态栏 ── */}
      <div className="draft-header">
        <h2 className="draft-title">神器轮选</h2>
        <div className="draft-turn">
          {isPlayerTurn ? (
            <span className="draft-turn-badge yours">轮到你了</span>
          ) : (
            <span className="draft-turn-badge waiting">等待对手选择...</span>
          )}
        </div>
        {/* 先后手标识 */}
        <div className="draft-first-badge">
          {isFirst ? '我方先手' : '对手先手'}
          <span className="draft-seal-hint">
            (后手得尘起标记)
          </span>
        </div>
        <div className="draft-progress">
          <span className="draft-progress-text">{draft.subStep} / 6</span>
          <div className="draft-progress-bar">
            <div className="draft-progress-fill" style={{ width: `${(draft.subStep / 6) * 100}%` }} />
          </div>
        </div>
      </div>

      {/* 当前步骤说明 */}
      <div className="draft-step-desc">
        {getStepLabel(draft.subStep, draft.firstPlayer)}
      </div>

      {/* ── 主内容 ── */}
      <div className="draft-body">
        {/* 轮选 3×3 网格 */}
        <div className="draft-grid-area">
          <div className="draft-col-headers">
            {COL_LABELS.map((label, i) => (
              <div key={i} className="draft-col-header">{label}</div>
            ))}
          </div>
          <div className="draft-grid">
            {[0, 1, 2].map((rowIdx) => (
              <React.Fragment key={rowIdx}>
                {cols.map((col, colIdx) => {
                  const artifact = col[rowIdx];
                  if (!artifact) return <div key={colIdx} className="draft-cell empty" />;
                  const owner = getOwner(artifact.id);
                  const isUsed = owner !== null;
                  const clickable = canPick(artifact);

                  return (
                    <div
                      key={artifact.id}
                      className={`draft-cell ${isUsed ? 'used' : ''} ${clickable ? 'can-pick' : ''} ${owner === 'player' ? 'owner-player' : ''} ${owner === 'opponent' ? 'owner-opponent' : ''} ${owner === 'banned' ? 'owner-banned' : ''}`}
                      onClick={() => canPick(artifact) && handleClick(artifact)}
                    >
                      <img className="draft-cell-img" src={getArtifactImage(artifact)} alt={artifact.name} />
                      <span className="draft-cell-name">{artifact.name}</span>

                      {/* 被ban标记 */}
                      {owner === 'banned' && (
                        <div className="draft-cell-overlay ban">
                          <span className="draft-cell-owner">BAN</span>
                        </div>
                      )}

                      {/* 已选标记 */}
                      {owner === 'player' && (
                        <div className="draft-cell-overlay pick">
                          <span className="draft-cell-owner">我</span>
                        </div>
                      )}
                      {owner === 'opponent' && (
                        <div className="draft-cell-overlay pick">
                          <span className="draft-cell-owner">对手</span>
                        </div>
                      )}

                      {/* 可点击提示 */}
                      {clickable && draft.subStep === 0 && (
                        <div className="draft-cell-hint ban-hint">点击禁用</div>
                      )}
                      {clickable && draft.subStep !== 0 && (
                        <div className="draft-cell-hint">点击选择</div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── 右侧已选面板 ── */}
        <div className="draft-picks-panel">
          {/* 我方已选 */}
          <div className="draft-picks-section">
            <h3 className="draft-picks-title">我方选择</h3>
            <div className="draft-picks-list">
              {[0, 1, 2].map((col) => {
                const pick = draft.playerPicks.find((a) => a.column === col);
                return (
                  <div key={col} className={`draft-pick-slot ${pick ? 'filled' : ''}`}>
                    {pick ? (
                      <>
                        <img className="draft-pick-slot-img" src={getArtifactImage(pick)} alt={pick.name} />
                        <span className="draft-pick-slot-name">{pick.name}</span>
                      </>
                    ) : (
                      <span className="draft-pick-slot-empty">{COL_LABELS[col].split('·')[0].trim()} 待选</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 对手已选 */}
          <div className="draft-picks-section">
            <h3 className="draft-picks-title">对手选择</h3>
            <div className="draft-picks-list">
              {[0, 1, 2].map((col) => {
                const pick = draft.opponentPicks.find((a) => a.column === col);
                return (
                  <div key={col} className={`draft-pick-slot ${pick ? 'filled' : ''}`}>
                    {pick ? (
                      <>
                        <img className="draft-pick-slot-img" src={getArtifactImage(pick)} alt={pick.name} />
                        <span className="draft-pick-slot-name">{pick.name}</span>
                      </>
                    ) : (
                      <span className="draft-pick-slot-empty">{COL_LABELS[col].split('·')[0].trim()} 待选</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 被ban神器 */}
          {(draft.bannedArtifact || draft.finalBanned.length > 0) && (
            <div className="draft-picks-section">
              <h3 className="draft-picks-title banned-title">已禁用神器</h3>
              <div className="draft-banned-list">
                {draft.bannedArtifact && (
                  <div className="draft-banned-item">
                    <img className="draft-banned-img" src={getArtifactImage(draft.bannedArtifact)} alt={draft.bannedArtifact.name} />
                    <span className="draft-banned-name">{draft.bannedArtifact.name}</span>
                  </div>
                )}
                {draft.finalBanned.map((a) => (
                  <div key={a.id} className="draft-banned-item">
                    <img className="draft-banned-img" src={getArtifactImage(a)} alt={a.name} />
                    <span className="draft-banned-name">{a.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};