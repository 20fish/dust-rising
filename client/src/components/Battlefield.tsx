/* ═══════════════════════════════════════════════════════════
 * 中央战场栏 — 根据当前阶段显示对应操作按钮
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import type { GamePhase } from '../../shared/types';

interface BattlefieldProps {
  phase: GamePhase;
  dustFallCounter: number;
  /* 当前玩家能否操作 */
  canAct: boolean;
  /* 阶段操作 */
  onSkipAwakening: () => void;
  onActivateArtifact: (index: number) => void;
  onAttack: () => void;
  onReroll: () => void;
  onNextPhase: () => void;
  onUseSkill: (skillId: string) => void;
  /* 上下文 */
  canAttack: boolean;
  canReroll: boolean;
  availableSkills: { skillId: string; name: string; description: string; canExecute: boolean }[];
  /* 防御模式 */
  defensePending: boolean;
  onSkipDefense: () => void;
  onConfirmDefense: () => void;
}

export const Battlefield: React.FC<BattlefieldProps> = ({
  phase,
  dustFallCounter,
  canAct,
  onSkipAwakening,
  onActivateArtifact,
  onAttack,
  onReroll,
  onNextPhase,
  onUseSkill,
  canAttack,
  canReroll,
  availableSkills,
  defensePending,
  onSkipDefense,
  onConfirmDefense,
}) => {
  return (
    <div className="battlefield">
      {/* ── 防御待定模式 ── */}
      {defensePending && (
        <div className="bf-defense-panel">
          <p className="bf-defense-hint">对方发起了攻击！选择一个防御骰抵挡，或跳过放弃防御</p>
          <div className="bf-defense-btns">
            <button className="bf-btn bf-btn-danger" onClick={onSkipDefense}>
              跳过防御
            </button>
            <button className="bf-btn bf-btn-primary" onClick={onConfirmDefense}>
              确认防御
            </button>
          </div>
        </div>
      )}

      {/* ── 非防御模式：按阶段显示操作 ── */}
      {!defensePending && (
        <>
          {/* 阶段信息 */}
          <div className="bf-phase-info">
            <span className="bf-phase-label">
              {phase === 'initialRoll' && '初始重掷'}
              {phase === 'replenish' && '补充阶段'}
              {phase === 'reroll' && '重掷阶段'}
              {phase === 'awakening' && '尘起阶段'}
              {phase === 'main' && '主要阶段'}
              {phase === 'end' && '结束阶段'}
            </span>
            <span className="bf-dust-count">尘落 {dustFallCounter}/10</span>
          </div>

          {/* 操作按钮区 */}
          {canAct && (
            <div className="bf-actions">
              {/* ── 初始重掷 ── */}
              {phase === 'initialRoll' && (
                <>
                  <button className="bf-btn bf-btn-secondary" disabled={!canReroll} onClick={onReroll}>
                    重掷选中骰子
                  </button>
                  <button className="bf-btn bf-btn-primary" onClick={onNextPhase}>
                    完成重掷
                  </button>
                </>
              )}

              {/* ── 补充阶段（自动完成，只需确认） ── */}
              {phase === 'replenish' && (
                <button className="bf-btn bf-btn-primary" onClick={onNextPhase}>
                  完成补充
                </button>
              )}

              {/* ── 重掷阶段 ── */}
              {phase === 'reroll' && (
                <>
                  <button className="bf-btn bf-btn-secondary" disabled={!canReroll} onClick={onReroll}>
                    重掷选中骰子
                  </button>
                  <button className="bf-btn bf-btn-primary" onClick={onNextPhase}>
                    完成重掷
                  </button>
                </>
              )}

              {/* ── 尘起阶段 ── */}
              {phase === 'awakening' && (
                <>
                  <button className="bf-btn bf-btn-secondary" onClick={onSkipAwakening}>
                    跳过尘起
                  </button>
                  <button className="bf-btn bf-btn-secondary" onClick={() => onActivateArtifact(0)}>
                    激活神器一
                  </button>
                  <button className="bf-btn bf-btn-secondary" onClick={() => onActivateArtifact(1)}>
                    激活神器二
                  </button>
                  <button className="bf-btn bf-btn-secondary" onClick={() => onActivateArtifact(2)}>
                    激活神器三
                  </button>
                  <button className="bf-btn bf-btn-primary" onClick={onNextPhase}>
                    完成尘起
                  </button>
                </>
              )}

              {/* ── 主要阶段 ── */}
              {phase === 'main' && (
                <>
                  <button className="bf-btn bf-btn-primary" disabled={!canAttack} onClick={onAttack}>
                    发起攻击
                  </button>
                  <button className="bf-btn bf-btn-primary" onClick={onNextPhase}>
                    结束阶段
                  </button>
                </>
              )}

              {/* ── 结束阶段 ── */}
              {phase === 'end' && (
                <button className="bf-btn bf-btn-primary" onClick={onNextPhase}>
                  结束回合
                </button>
              )}
            </div>
          )}

          {/* ── 技能面板（主阶段） ── */}
          {canAct && phase === 'main' && availableSkills.length > 0 && (
            <div className="bf-skills-panel">
              <div className="bf-skills-label">可用技能</div>
              <div className="bf-skills-list">
                {availableSkills.map((s) => (
                  <button
                    key={s.skillId}
                    className={`bf-skill-btn ${s.canExecute ? '' : 'bf-skill-disabled'}`}
                    disabled={!s.canExecute}
                    onClick={() => onUseSkill(s.skillId)}
                    title={s.description}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};