/* ═══════════════════════════════════════════════════════════
 * 中央战场栏 - 阶段、尘落计数、操作按钮
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import type { GamePhase } from '../types/game';

interface BattlefieldProps {
  phase: GamePhase;
  dustFallCounter: number;
  onSkipAwakening: () => void;
  onConfirm: () => void;
  onNextPhase: () => void;
}

const PHASE_LABELS: Record<GamePhase, string> = {
  initialRoll: '初始投掷',
  replenish: '补骰阶段',
  reroll: '重掷阶段',
  awakening: '尘起阶段',
  main: '主要阶段',
  end: '结束阶段',
};

export const Battlefield: React.FC<BattlefieldProps> = ({
  phase,
  dustFallCounter,
  onSkipAwakening,
  onConfirm,
  onNextPhase,
}) => {
  return (
    <div className="battlefield">
      <div className="bf-phase">{PHASE_LABELS[phase]}</div>
      <div className="bf-dust">
        尘落 <span className="n">{dustFallCounter}</span><span style={{ color: 'var(--text-dim)' }}>/10</span>
      </div>
      <div className="bf-acts">
        {phase === 'awakening' && (
          <button className="btn danger" onClick={onSkipAwakening}>跳过尘起</button>
        )}
        {phase === 'initialRoll' && (
          <button className="btn primary" onClick={onConfirm}>开始投掷</button>
        )}
        {phase !== 'initialRoll' && phase !== 'awakening' && (
          <button className="btn primary" onClick={onNextPhase}>下一阶段</button>
        )}
        {phase === 'awakening' && (
          <button className="btn primary" onClick={onNextPhase}>完成尘起</button>
        )}
      </div>
    </div>
  );
};