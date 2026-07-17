/* ═══════════════════════════════════════════════════════════
 * 技能系统 — 13件神器技能函数
 *
 * 设计原则:
 *   - 每个技能是纯函数：(ctx) → SkillResult
 *   - 不直接修改状态，只返回"应该怎么改"
 *   - store 负责调用函数并应用结果
 *   - 扩展新技能只需：写函数 + 注册到 SKILL_REGISTRY
 *
 * 技能类型:
 *   active     主动技能 — 玩家在主要阶段手动触发
 *   continuous 持续效果 — 满足条件时自动生效
 *   trigger    触发效果 — 事件发生时自动触发
 *   onCharge   充能效果 — 充能计数达到要求时触发
 * ═══════════════════════════════════════════════════════════ */

import type { GameState, PlayerState, Dice, Artifact } from '../types/game';
import { createDice } from './dice';

/* ── 技能上下文 ── */
export interface SkillContext {
  /** 当前完整游戏状态（只读） */
  game: GameState;
  /** 技能所属玩家 */
  owner: PlayerState;
  /** 对手 */
  opponent: PlayerState;
  /** 触发时携带的额外数据 */
  triggerData?: {
    /** 本次攻击使用的骰子 */
    attackDice?: Dice[];
    /** 本次攻击造成的原始伤害 */
    damage?: number;
    /** 防御方使用的防御骰ID */
    defenseDiceId?: string;
  };
}

/* ── 技能执行结果 ── */
export interface SkillResult {
  /** 修改后的 owner 字段 */
  owner?: Partial<PlayerState>;
  /** 修改后的 opponent 字段 */
  opponent?: Partial<PlayerState>;
  /** 额外伤害（加到最终伤害上） */
  bonusDamage?: number;
  /** 是否破防（无视防御骰，防御骰不生效） */
  ignoreDefense?: boolean;
  /** 伤害减免量 */
  damageReduction?: number;
  /** 额外骰子（加入冥想区） */
  extraDice?: Dice[];
  /** 尘落变化量（正数=增加，负数=减少） */
  dustFallDelta?: number;
  /** 消耗的冥想骰数量 */
  meditationCost?: number;
  /** 给玩家的反馈消息 */
  message?: string;
  /** 此技能是否可以执行（主动技能用） */
  canExecute?: boolean;
}

/** 技能函数类型 */
export type SkillFn = (ctx: SkillContext) => SkillResult;

/* ═══════════════════════════════════════════════════════════
 *  辅助函数
 * ═══════════════════════════════════════════════════════════ */

/** 检查是否有足够的冥想骰 */
function hasMeditation(owner: PlayerState, count: number = 1): boolean {
  return owner.zone.meditation.length >= count;
}

/** 消耗冥想骰（返回移除后的冥想区） */
function consumeMeditation(owner: PlayerState, count: number): Dice[] {
  return owner.zone.meditation.slice(count);
}

/* ── 构建技能上下文 ── */

/**
 * 从游戏状态构建技能上下文
 * 供 store 调用，传入当前攻击方和防御方
 */
export function buildSkillContext(
  game: GameState,
  owner: PlayerState,
  opponent: PlayerState,
  extra?: SkillContext['triggerData']
): SkillContext {
  return {
    game: {
      ...game,
      player: { ...game.player },
      opponent: { ...game.opponent },
    },
    owner: { ...owner },
    opponent: { ...opponent },
    triggerData: extra,
  };
}

/* ═══════════════════════════════════════════════════════════
 *  第1列神器 (Column 0) — 速度/意志
 * ═══════════════════════════════════════════════════════════ */

/**
 * 雨切 · 斩击 (active)
 * 消耗1冥想骰：造成2点额外伤害
 */
export const skillYuqieZhanji: SkillFn = (ctx) => {
  const canExecute = hasMeditation(ctx.owner, 1);
  if (!canExecute) {
    return { canExecute: false, message: '冥想骰不足' };
  }
  const remaining = consumeMeditation(ctx.owner, 1);
  return {
    owner: { zone: { ...ctx.owner.zone, meditation: remaining } },
    bonusDamage: 2,
    meditationCost: 1,
    canExecute: true,
    message: '斩击！额外造成2点伤害',
  };
};

/**
 * 金刚 · 金刚身 (continuous)
 * 受到伤害时减少1点
 */
export const skillJingangJingangShen: SkillFn = (ctx) => {
  return {
    damageReduction: 1,
    message: '金刚身：伤害减免1点',
  };
};

/**
 * 佐雷 · 雷击 (active)
 * 消耗1冥想骰：攻击骰+1伤害
 */
export const skillZuoleiLeiji: SkillFn = (ctx) => {
  const canExecute = hasMeditation(ctx.owner, 1);
  if (!canExecute) {
    return { canExecute: false, message: '冥想骰不足' };
  }
  const remaining = consumeMeditation(ctx.owner, 1);
  return {
    owner: { zone: { ...ctx.owner.zone, meditation: remaining } },
    bonusDamage: 1,
    meditationCost: 1,
    canExecute: true,
    message: '雷击！攻击骰+1伤害',
  };
};

/**
 * 破晓之剑 · 破晓 (active)
 * 消耗1冥想骰：破防，无视防御骰
 */
export const skillPoxiaoPoxiao: SkillFn = (ctx) => {
  const canExecute = hasMeditation(ctx.owner, 1);
  if (!canExecute) {
    return { canExecute: false, message: '冥想骰不足' };
  }
  const remaining = consumeMeditation(ctx.owner, 1);
  return {
    owner: { zone: { ...ctx.owner.zone, meditation: remaining } },
    ignoreDefense: true,
    meditationCost: 1,
    canExecute: true,
    message: '破晓！无视防御骰',
  };
};

/* ═══════════════════════════════════════════════════════════
 *  第2列神器 (Column 1) — 骰点分布
 * ═══════════════════════════════════════════════════════════ */

/**
 * 影掠 · 影袭 (trigger)
 * 攻击命中时：额外造成1点伤害
 */
export const skillYinglueYingxi: SkillFn = (ctx) => {
  return {
    bonusDamage: 1,
    message: '影袭！额外造成1点伤害',
  };
};

/**
 * 幽冥 · 冥火 (active)
 * 消耗1冥想骰：本回合攻击+2
 */
export const skillYoumingMinghuo: SkillFn = (ctx) => {
  const canExecute = hasMeditation(ctx.owner, 1);
  if (!canExecute) {
    return { canExecute: false, message: '冥想骰不足' };
  }
  const remaining = consumeMeditation(ctx.owner, 1);
  return {
    owner: {
      zone: { ...ctx.owner.zone, meditation: remaining },
      attackBonus: ctx.owner.attackBonus + 2,
    },
    meditationCost: 1,
    canExecute: true,
    message: '冥火！本回合攻击+2',
  };
};

/**
 * 孤塔之王 · 孤塔 (continuous)
 * 防御时额外+1护盾（即：受到伤害时额外减免1点）
 */
export const skillGutaGuta: SkillFn = (ctx) => {
  return {
    damageReduction: 1,
    message: '孤塔：额外护盾减免1点',
  };
};

/**
 * 邪灵 · 诅咒 (trigger)
 * 回合开始：敌方尘落+1
 */
export const skillXielingZuzhou: SkillFn = (ctx) => {
  return {
    dustFallDelta: 1,
    message: '诅咒！敌方尘落+1',
  };
};

/* ═══════════════════════════════════════════════════════════
 *  第3列神器 (Column 2) — 生命/充能
 * ═══════════════════════════════════════════════════════════ */

/**
 * 哀歌 · 悲鸣 (onCharge)
 * 充能满时：对敌方造成3点伤害
 */
export const skillAigeBeiming: SkillFn = (ctx) => {
  return {
    opponent: { life: Math.max(0, ctx.opponent.life - 3) },
    message: '悲鸣！对敌方造成3点伤害',
  };
};

/**
 * 顿悟 · 顿悟 (onCharge)
 * 充能满时：获得1个额外冥想骰
 */
export const skillDunwuDunwu: SkillFn = (ctx) => {
  const extraDie = createDice(undefined, 'meditation');
  return {
    owner: {
      zone: {
        ...ctx.owner.zone,
        meditation: [...ctx.owner.zone.meditation, extraDie],
      },
    },
    extraDice: [extraDie],
    message: '顿悟！获得1个额外冥想骰',
  };
};

/**
 * 尼萨 · 治愈 (onCharge)
 * 充能满时：恢复3点生命
 */
export const skillNisaZhiyu: SkillFn = (ctx) => {
  return {
    owner: { life: ctx.owner.life + 3 },
    message: '治愈！恢复3点生命',
  };
};

/**
 * 黑枪 · 黑枪 (onCharge)
 * 充能满时：造成5点伤害
 */
export const skillHeiqiangHeiqiang: SkillFn = (ctx) => {
  return {
    opponent: { life: Math.max(0, ctx.opponent.life - 5) },
    message: '黑枪！造成5点伤害',
  };
};

/* ═══════════════════════════════════════════════════════════
 *  技能注册表 — 按 skillId 索引
 *  扩展新技能时只需在这里加一行
 * ═══════════════════════════════════════════════════════════ */

export const SKILL_REGISTRY: Record<string, SkillFn> = {
  /* 第1列 */
  'yuqie_zhanji': skillYuqieZhanji,
  'jingang_jingangshen': skillJingangJingangShen,
  'zuolei_leiji': skillZuoleiLeiji,
  'poxiao_poxiao': skillPoxiaoPoxiao,
  /* 第2列 */
  'yinglue_yingxi': skillYinglueYingxi,
  'youming_minghuo': skillYoumingMinghuo,
  'guta_guta': skillGutaGuta,
  'xieling_zuzhou': skillXielingZuzhou,
  /* 第3列 */
  'aige_beiming': skillAigeBeiming,
  'dunwu_dunwu': skillDunwuDunwu,
  'nisa_zhiyu': skillNisaZhiyu,
  'heiqiang_heiqiang': skillHeiqiangHeiqiang,
};

/** 根据 skillId 获取技能函数 */
export function getSkillFn(skillId: string): SkillFn | undefined {
  return SKILL_REGISTRY[skillId];
}

/* ═══════════════════════════════════════════════════════════
 *  批量触发 — 按类型自动调用
 * ═══════════════════════════════════════════════════════════ */

/**
 * 对指定玩家拥有的技能，按类型批量执行
 * 返回合并后的结果
 */
export function executeSkillsByType(
  ctx: SkillContext,
  type: 'active' | 'continuous' | 'trigger' | 'onCharge'
): SkillResult {
  const merged: SkillResult = {};

  for (const artifact of ctx.owner.artifacts) {
    if (!artifact) continue;
    for (const skill of artifact.skills) {
      if (skill.type !== type) continue;
      const fn = getSkillFn(skill.skillId);
      if (!fn) continue;

      const result = fn(ctx);
      // 合并结果
      if (result.owner) merged.owner = { ...merged.owner, ...result.owner };
      if (result.opponent) merged.opponent = { ...merged.opponent, ...result.opponent };
      if (result.bonusDamage) merged.bonusDamage = (merged.bonusDamage || 0) + result.bonusDamage;
      if (result.damageReduction) merged.damageReduction = (merged.damageReduction || 0) + result.damageReduction;
      if (result.ignoreDefense) merged.ignoreDefense = true;
      if (result.dustFallDelta) merged.dustFallDelta = (merged.dustFallDelta || 0) + result.dustFallDelta;
      if (result.extraDice) merged.extraDice = [...(merged.extraDice || []), ...result.extraDice];
      if (result.meditationCost) merged.meditationCost = (merged.meditationCost || 0) + result.meditationCost;
      if (result.message) merged.message = result.message;
    }
  }

  return merged;
}

/**
 * 获取当前玩家所有可触发技能
 */
export function getPlayerSkills(
  player: PlayerState
): { artifact: Artifact; skill: import('../types/game').Skill }[] {
  const result: { artifact: Artifact; skill: import('../types/game').Skill }[] = [];
  for (const artifact of player.artifacts) {
    if (!artifact) continue;
    for (const skill of artifact.skills) {
      result.push({ artifact, skill });
    }
  }
  return result;
}