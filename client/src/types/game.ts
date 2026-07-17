/* ═══════════════════════════════════════════════════════════
 * 前端类型定义 - 直接引用共享类型
 * ═══════════════════════════════════════════════════════════ */

export type {
  DiceType,
  DiceValue,
  Dice,
  DiceDistribution,
  DiceZone,
  ArtifactColumn,
  SkillType,
  Skill,
  ArtifactDef,
  Artifact,
  ArtifactSource,
  GamePhase,
  PlayerState,
  GameState,
  GameAction,
  RoomState,
  GameMode,
} from '../../shared/types';

/** 神器属性预算约束（与 shared/types.ts 保持一致） */
export const ARTIFACT_BUDGET = {
  SPEED_WILL_MAX: 11,
  LIFE_MAX: 15,
  CHARGE_MAX: 5,
  CHARGE_MIN: 2,
  SKILL_MAX: 1,
  PER_COLUMN_MAX: 6,
} as const;

/** 从 ArtifactDef 创建运行时 Artifact 实例 */
export function createArtifactInstance(def: ArtifactDef): Artifact {
  return {
    ...def,
    isActive: false,
    chargeCount: 0,
  };
}