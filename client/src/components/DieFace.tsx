/* ═══════════════════════════════════════════════════════════
 * 骰面组件 - 点数显示 + 选择计数角标
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import type { Dice, DiceValue } from '../types/game';

/** 骰面点数布局 (1-6) */
const DOT_LAYOUT: Record<DiceValue, boolean[][]> = {
  1: [[false,false,false],[false,true,false],[false,false,false]],
  2: [[false,false,true],[false,false,false],[true,false,false]],
  3: [[false,false,true],[false,true,false],[true,false,false]],
  4: [[true,false,true],[false,false,false],[true,false,true]],
  5: [[true,false,true],[false,true,false],[true,false,true]],
  6: [[true,false,true],[true,false,true],[true,false,true]],
};

interface DieFaceProps {
  dice: Dice;
  /** 此骰面值的骰子总数 */
  totalCount: number;
  /** 选中的数量 */
  selectedCount: number;
  /** 是否选中 */
  isSelected: boolean;
  onClick: () => void;
}

export const DieFace: React.FC<DieFaceProps> = ({
  dice,
  totalCount,
  selectedCount,
  isSelected,
  onClick,
}) => {
  const layout = DOT_LAYOUT[dice.value];
  const typeClass = dice.type === 'defense' ? 'def' : dice.type === 'attack' ? 'atk' : 'med';

  // 计数显示逻辑: 单选无选中态直接显示数量，有选中态显示 A/B
  const hasSelection = totalCount > 1 && selectedCount > 0;
  const countLabel = hasSelection
    ? `${selectedCount}/${totalCount}`
    : `${totalCount}`;

  return (
    <div
      className={`die ${typeClass} ${isSelected ? 'sel' : ''}`}
      onClick={onClick}
    >
      <div className="face">
        {layout.flat().map((hasDot, i) => (
          <div key={i} className={hasDot ? 'dot' : ''} />
        ))}
      </div>
      <div className="die-cnt">{countLabel}</div>
    </div>
  );
};