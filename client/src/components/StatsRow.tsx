/* ═══════════════════════════════════════════════════════════
 * 属性行组件 - 名字、速度、意志、生命值、充能、尘印
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import type { PlayerState } from '../types/game';

interface StatsRowProps {
  player: PlayerState;
  isOpponent: boolean;
}

export const StatsRow: React.FC<StatsRowProps> = ({ player, isOpponent }) => {
  return (
    <div className={`stats ${isOpponent ? 'opponent' : ''}`}>
      <span className="name">{player.name}</span>
      <div className="stat">速 <span className="v">{player.speed}</span></div>
      <div className="stat">意 <span className="v">{player.will}</span></div>
      <div className="sep" />
      <div className="stat">生命值 <span className="v hp">{player.life}/{player.artifacts[2]?.life ?? 15}</span></div>
      <div className="sep" />
      <div className="stat">充能 <span className="v chg">{player.chargeCount}/{player.artifacts[2]?.chargeRequirement ?? 3}</span></div>
      {player.hasDustSeal && (
        <>
          <div className="sep" />
          <span className="seal">印</span>
        </>
      )}
    </div>
  );
};