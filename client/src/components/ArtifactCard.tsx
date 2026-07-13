/* ═══════════════════════════════════════════════════════════
 * 神器卡片组件 - 纯展示，点击回调由父组件处理
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import type { Artifact } from '../types/game';
import { getArtifactImage } from '../game/artifacts';

interface ArtifactCardProps {
  artifact: Artifact;
  column: 0 | 1 | 2;
  /** 点击回调，由父组件（GameBoard）统一管理预览弹窗 */
  onClick?: () => void;
}

export const ArtifactCard: React.FC<ArtifactCardProps> = ({ artifact, column, onClick }) => {
  const colClass = column === 0 ? 'col1' : column === 1 ? 'col2' : 'col3';
  const imgSrc = getArtifactImage(artifact);

  return (
    <div
      className={`artifact ${colClass}`}
      onClick={onClick}
      title="点击查看原图"
    >
      <img src={imgSrc} alt={artifact.name} />
      {artifact.isActive && <span className="tag active">激活</span>}
      {artifact.chargeCount > 0 && (
        <span className="tag charged">充能 {artifact.chargeCount}</span>
      )}
    </div>
  );
};