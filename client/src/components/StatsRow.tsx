/* ═══════════════════════════════════════════════════════════
 * 属性行组件 - 名字、速度、意志、生命值、充能、尘印
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import type { PlayerState } from '../types/game';
import { calcSpeed, calcWill, calcMaxLife } from '../game/attributeCalculator';

interface StatsRowProps {
  player: PlayerState;
  isOpponent: boolean;
}

export const StatsRow: React.FC<StatsRowProps> = ({ player, isOpponent }) => {
  const speed = calcSpeed(player);
  const will = calcWill(player);
  const maxLife = calcMaxLife(player);

  return (
    <div className={`stats ${isOpponent ? 'opponent' : ''}`}>
      <span className="name">{player.name}</span>
      <div className="stat">速 <span className="v">{speed}</span></div>
      <div className="stat">意 <span className="v">{will}</span></div>
      <div className="sep" />
      <div className="stat">生命值 <span className="v hp">{player.life}/{maxLife}</span></div>
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