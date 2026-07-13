/* ═══════════════════════════════════════════════════════════
 * 玩家区域组件 - 属性行 + 神器行 + 骰子行
 * 对手: 属性→神器→骰子 (上到下)
 * 玩家: 骰子→神器→属性 (下到上) 镜像
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import type { PlayerState, Artifact } from '../types/game';
import { StatsRow } from './StatsRow';
import { ArtifactCard } from './ArtifactCard';
import { DiceZoneComponent } from './DiceZone';

interface PlayerAreaProps {
  player: PlayerState;
  isOpponent: boolean;
  selectedDiceIds: string[];
  onSelectDice: (id: string) => void;
  onDeselectDice: (id: string) => void;
  /** 点击神器卡片的回调，由 GameBoard 统一管理预览弹窗 */
  onArtifactClick?: (artifact: Artifact) => void;
}

export const PlayerArea: React.FC<PlayerAreaProps> = ({
  player,
  isOpponent,
  selectedDiceIds,
  onSelectDice,
  onDeselectDice,
  onArtifactClick,
}) => {
  const stats = <StatsRow player={player} isOpponent={isOpponent} />;

  const artifacts = (
    <div className="artifacts">
      {player.artifacts.map((artifact, idx) =>
        artifact ? (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            column={idx as 0 | 1 | 2}
            onClick={onArtifactClick ? () => onArtifactClick(artifact) : undefined}
          />
        ) : (
          <div key={idx} className={`artifact col${idx + 1}`} style={{ background: 'var(--surface)' }} />
        )
      )}
    </div>
  );

  const diceZones = (
    <div className="dice-row">
      <DiceZoneComponent
        label="防御骰"
        dice={player.zone.defense}
        type="defense"
        selectedDiceIds={selectedDiceIds}
        onSelectDice={onSelectDice}
        onDeselectDice={onDeselectDice}
      />
      <DiceZoneComponent
        label="攻击骰"
        dice={player.zone.attack}
        type="attack"
        selectedDiceIds={selectedDiceIds}
        onSelectDice={onSelectDice}
        onDeselectDice={onDeselectDice}
      />
      <DiceZoneComponent
        label="冥想骰"
        dice={player.zone.meditation}
        type="meditation"
        selectedDiceIds={selectedDiceIds}
        onSelectDice={onSelectDice}
        onDeselectDice={onDeselectDice}
      />
    </div>
  );

  return (
    <div className={`player-area ${isOpponent ? 'opponent' : 'player'}`}>
      {isOpponent ? (
        <>
          {stats}
          {artifacts}
          {diceZones}
        </>
      ) : (
        <>
          {diceZones}
          {artifacts}
          {stats}
        </>
      )}
    </div>
  );
};