/* ═══════════════════════════════════════════════════════════
 * 骰子区域组件 - 防御/攻击/冥想
 * ═══════════════════════════════════════════════════════════ */

import React from 'react';
import { DieFace } from './DieFace';
import type { Dice, DiceValue } from '../types/game';
import { groupDiceByValue } from '../game/dice';

interface DiceZoneProps {
  label: string;
  dice: Dice[];
  type: 'defense' | 'attack' | 'meditation';
  selectedDiceIds: string[];
  onSelectDice: (id: string) => void;
  onDeselectDice: (id: string) => void;
}

export const DiceZoneComponent: React.FC<DiceZoneProps> = ({
  label,
  dice,
  type,
  selectedDiceIds,
  onSelectDice,
  onDeselectDice,
}) => {
  // 按面值分组
  const grouped = groupDiceByValue(dice);

  // 按面值排序
  const sortedGroups = Array.from(grouped.entries()).sort(([a], [b]) => a - b);

  return (
    <div className={`zone ${type === 'defense' ? 'def' : type === 'attack' ? 'atk' : 'med'}`}>
      <div className={`zone-label ${type === 'defense' ? 'def' : type === 'attack' ? 'atk' : 'med'}`}>
        {label}
      </div>
      <div className="zone-dice">
        {sortedGroups.length === 0 && (
          <span style={{ color: 'var(--text-dim)', fontSize: 12 }}>空</span>
        )}
        {sortedGroups.map(([value, diceList]) => {
          const rep = diceList[0]; // 代表骰子
          const totalCount = diceList.length;
          const selectedCount = diceList.filter(d => selectedDiceIds.includes(d.id)).length;
          const isSelected = selectedCount > 0;

          const handleClick = () => {
            if (isSelected) {
              // 取消选中该组所有骰子
              diceList.forEach(d => onDeselectDice(d.id));
            } else {
              // 选中该组所有骰子
              diceList.forEach(d => onSelectDice(d.id));
            }
          };

          return (
            <DieFace
              key={value}
              dice={rep}
              totalCount={totalCount}
              selectedCount={selectedCount}
              isSelected={isSelected && selectedCount === totalCount}
              onClick={handleClick}
            />
          );
        })}
      </div>
    </div>
  );
};