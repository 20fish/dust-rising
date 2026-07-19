/* ═══════════════════════════════════════════════════════════
 * 技能系统 — 神器技能函数（Effect 模式）
 *
 * 设计原则:
 *   - 每个技能是纯函数：(game, selfId) → SkillExecutionResult
 *   - 不直接修改状态，返回 GameEffect[] 数据描述
 *   - EffectExecutor 负责统一应用效果
 *   - 扩展新技能只需：写函数 + 注册到 SKILL_REGISTRY
 *
 * 技能类型:
 *   active     主动技能 — 玩家在主要阶段手动触发
 *   continuous 持续效果 — 满足条件时自动生效
 *   trigger    触发效果 — 事件发生时自动触发
 *   onActivate 激活效果 — 神器激活时触发
 *   onCharge   充能效果 — 充能计数达到要求时触发
 * ═══════════════════════════════════════════════════════════ */

import type { GameState, PlayerState, Artifact, Skill as SkillDef } from '../types/game';
import type { SkillExecutionResult } from '../../../shared/effects';
import {
  damage, bonusDamage, heal, gainDice, removeDice,
  modifyStat, dustFall, ignoreDefense, damageReduction,
  message as msg,
  cannotExecute, canExecute,
} from './effects';

/* ═══════════════════════════════════════════════════════════
 *  技能函数类型
 * ═══════════════════════════════════════════════════════════ */

export type SkillFn = (game: GameState, selfId: string) => SkillExecutionResult;

/* ═══════════════════════════════════════════════════════════
 *  辅助函数
 * ═══════════════════════════════════════════════════════════ */

/** 根据 selfId 解析出自己和对手 */
export function resolvePlayers(game: GameState, selfId: string): { self: PlayerState; opponent: PlayerState } {
  return game.player.playerId === selfId
    ? { self: game.player, opponent: game.opponent }
    : { self: game.opponent, opponent: game.player };
}

/* ═══════════════════════════════════════════════════════════
 *  第1列神器 (Column 0) — 速度/意志
 * ═══════════════════════════════════════════════════════════ */

/**
 * 雨切 · 斩击 (active)
 * 消耗1冥想骰：造成2点额外伤害
 */
export const skillYuqieZhanji: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  if (self.zone.meditation.length < 1) return cannotExecute('冥想骰不足');
  return canExecute([
    removeDice('self', 'meditation', 1),
    bonusDamage(2),
    msg('斩击！额外造成2点伤害'),
  ], { meditation: 1 });
};

/**
 * 金刚 · 金刚身 (continuous)
 * 受到伤害时减少1点
 */
export const skillJingangJingangShen: SkillFn = (_game, _selfId) => {
  return canExecute([
    damageReduction(1),
    msg('金刚身：伤害减免1点'),
  ]);
};

/**
 * 佐雷 · 雷击 (active)
 * 消耗1冥想骰：攻击骰+1伤害
 */
export const skillZuoleiLeiji: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  if (self.zone.meditation.length < 1) return cannotExecute('冥想骰不足');
  return canExecute([
    removeDice('self', 'meditation', 1),
    bonusDamage(1),
    msg('雷击！攻击骰+1伤害'),
  ], { meditation: 1 });
};

/**
 * 破晓之剑 · 破晓 (active)
 * 消耗1冥想骰：破防，无视防御骰
 */
export const skillPoxiaoPoxiao: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  if (self.zone.meditation.length < 1) return cannotExecute('冥想骰不足');
  return canExecute([
    removeDice('self', 'meditation', 1),
    ignoreDefense(true),
    msg('破晓！无视防御骰'),
  ], { meditation: 1 });
};

/* ═══════════════════════════════════════════════════════════
 *  第2列神器 (Column 1) — 骰点分布
 * ═══════════════════════════════════════════════════════════ */

/**
 * 影掠 · 影袭 (trigger)
 * 攻击命中时：额外造成1点伤害
 */
export const skillYinglueYingxi: SkillFn = (_game, _selfId) => {
  return canExecute([
    bonusDamage(1),
    msg('影袭！额外造成1点伤害'),
  ]);
};

/**
 * 幽冥 · 冥火 (active)
 * 消耗1冥想骰：本回合攻击+2
 */
export const skillYoumingMinghuo: SkillFn = (game, selfId) => {
  const { self } = resolvePlayers(game, selfId);
  if (self.zone.meditation.length < 1) return cannotExecute('冥想骰不足');
  return canExecute([
    removeDice('self', 'meditation', 1),
    modifyStat('self', 'attackBonus', 2),
    msg('冥火！本回合攻击+2'),
  ], { meditation: 1 });
};

/**
 * 孤塔之王 · 孤塔 (continuous)
 * 防御时额外+1护盾（即：受到伤害时额外减免1点）
 */
export const skillGutaGuta: SkillFn = (_game, _selfId) => {
  return canExecute([
    damageReduction(1),
    msg('孤塔：额外护盾减免1点'),
  ]);
};

/**
 * 邪灵 · 诅咒 (trigger)
 * 回合开始：敌方尘落+1
 */
export const skillXielingZuzhou: SkillFn = (_game, _selfId) => {
  return canExecute([
    dustFall(1),
    msg('诅咒！敌方尘落+1'),
  ]);
};

/* ═══════════════════════════════════════════════════════════
 *  第3列神器 (Column 2) — 生命/充能
 * ═══════════════════════════════════════════════════════════ */

/**
 * 哀歌 · 悲鸣 (onCharge)
 * 充能满时：对敌方造成3点伤害
 */
export const skillAigeBeiming: SkillFn = (_game, _selfId) => {
  return canExecute([
    damage('opponent', 3),
    msg('悲鸣！对敌方造成3点伤害'),
  ]);
};

/**
 * 顿悟 · 顿悟 (onCharge)
 * 充能满时：获得1个额外冥想骰
 */
export const skillDunwuDunwu: SkillFn = (_game, _selfId) => {
  return canExecute([
    gainDice('self', 'meditation', 1),
    msg('顿悟！获得1个额外冥想骰'),
  ]);
};

/**
 * 尼萨 · 治愈 (onCharge)
 * 充能满时：恢复3点生命
 */
export const skillNisaZhiyu: SkillFn = (_game, _selfId) => {
  return canExecute([
    heal('self', 3),
    msg('治愈！恢复3点生命'),
  ]);
};

/**
 * 黑枪 · 黑枪 (onCharge)
 * 充能满时：造成5点伤害
 */
export const skillHeiqiangHeiqiang: SkillFn = (_game, _selfId) => {
  return canExecute([
    damage('opponent', 5),
    msg('黑枪！造成5点伤害'),
  ]);
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
 * 返回所有技能的合并 effects 列表
 */
export function executeSkillsByType(
  game: GameState,
  selfId: string,
  type: 'active' | 'continuous' | 'trigger' | 'onActivate' | 'onCharge'
): SkillExecutionResult {
  const { self } = resolvePlayers(game, selfId);
  const allEffects: SkillExecutionResult['effects'] = [];
  const costs: SkillExecutionResult['cost'] = {};

  for (const artifact of self.artifacts) {
    if (!artifact) continue;
    for (const skill of artifact.skills) {
      if (skill.type !== type) continue;
      const fn = getSkillFn(skill.skillId);
      if (!fn) continue;

      const result = fn(game, selfId);
      if (result.canExecute) {
        allEffects.push(...result.effects);
        if (result.cost) {
          if (result.cost.meditation) costs.meditation = (costs.meditation || 0) + result.cost.meditation;
          if (result.cost.attack) costs.attack = (costs.attack || 0) + result.cost.attack;
          if (result.cost.defense) costs.defense = (costs.defense || 0) + result.cost.defense;
          if (result.cost.life) costs.life = (costs.life || 0) + result.cost.life;
        }
      }
    }
  }

  return canExecute(allEffects, Object.keys(costs).length > 0 ? costs : undefined);
}

/**
 * 获取当前玩家所有技能
 */
export function getPlayerSkills(
  player: PlayerState
): { artifact: Artifact; skill: SkillDef }[] {
  const result: { artifact: Artifact; skill: SkillDef }[] = [];
  for (const artifact of player.artifacts) {
    if (!artifact) continue;
    for (const skill of artifact.skills) {
      result.push({ artifact, skill });
    }
  }
  return result;
}
