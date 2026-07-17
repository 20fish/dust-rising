/* ═══════════════════════════════════════════════════════════
 * 神器静态数据 — 12个内置神器定义
 * 纯数据，不依赖任何运行时环境（浏览器/Node.js 均可引入）
 * ═══════════════════════════════════════════════════════════ */

import type { ArtifactDef, DiceDistribution } from './types';

/** 默认骰点分布: 偶数→攻击, 奇数→防御 */
const mixedDist: DiceDistribution = { 1: 'defense', 2: 'attack', 3: 'defense', 4: 'attack', 5: 'defense', 6: 'attack' };

/** 攻击偏向分布 */
const atkDist: DiceDistribution = { 1: 'attack', 2: 'attack', 3: 'attack', 4: 'defense', 5: 'meditation', 6: 'meditation' };

/** 防御偏向分布 */
const defDist: DiceDistribution = { 1: 'defense', 2: 'defense', 3: 'defense', 4: 'attack', 5: 'meditation', 6: 'meditation' };

/** 冥想偏向分布 */
const medDist: DiceDistribution = { 1: 'meditation', 2: 'meditation', 3: 'attack', 4: 'defense', 5: 'defense', 6: 'attack' };

/** 均衡分布: 1,3→攻击 / 2,5→防御 / 4,6→冥想 */
const balancedDist: DiceDistribution = { 1: 'attack', 2: 'defense', 3: 'attack', 4: 'meditation', 5: 'defense', 6: 'meditation' };

/** 所有内置神器静态定义 */
export const BUILTIN_ARTIFACTS: ArtifactDef[] = [
  {
    id: 'yuqie', name: '雨切', column: 0, source: 'builtin', version: 1,
    speed: 4, will: 7, life: 0, chargeRequirement: 0,
    diceDistribution: mixedDist,
    skills: [{ skillId: 'yuqie_zhanji', name: '斩击', type: 'active', description: '消耗1冥想骰：造成2点额外伤害' }],
    imageKey: '空',
  },
  {
    id: 'yinglue', name: '影掠', column: 1, source: 'builtin', version: 1,
    speed: 0, will: 0, life: 0, chargeRequirement: 0,
    diceDistribution: balancedDist,
    skills: [{ skillId: 'yinglue_yingxi', name: '影袭', type: 'trigger', description: '攻击命中时：额外造成1点伤害' }],
    imageKey: '影',
  },
  {
    id: 'aige', name: '哀歌', column: 2, source: 'builtin', version: 1,
    speed: 0, will: 0, life: 15, chargeRequirement: 3,
    diceDistribution: mixedDist,
    skills: [{ skillId: 'aige_beiming', name: '悲鸣', type: 'onCharge', description: '充能满时：对敌方造成3点伤害' }],
    imageKey: '战鬼',
  },
  {
    id: 'jingang', name: '金刚', column: 0, source: 'builtin', version: 1,
    speed: 3, will: 8, life: 0, chargeRequirement: 0,
    diceDistribution: mixedDist,
    skills: [{ skillId: 'jingang_jingangshen', name: '金刚身', type: 'continuous', description: '受到伤害时减少1点' }],
    imageKey: '和尚',
  },
  {
    id: 'youming', name: '幽冥', column: 1, source: 'builtin', version: 1,
    speed: 0, will: 0, life: 0, chargeRequirement: 0,
    diceDistribution: atkDist,
    skills: [{ skillId: 'youming_minghuo', name: '冥火', type: 'active', description: '消耗1冥想骰：本回合攻击+2' }],
    imageKey: '死神',
  },
  {
    id: 'dunwu', name: '顿悟', column: 2, source: 'builtin', version: 1,
    speed: 0, will: 0, life: 15, chargeRequirement: 3,
    diceDistribution: mixedDist,
    skills: [{ skillId: 'dunwu_dunwu', name: '顿悟', type: 'onCharge', description: '充能满时：获得1个额外冥想骰' }],
    imageKey: '魔女',
  },
  {
    id: 'zuolei', name: '佐雷', column: 0, source: 'builtin', version: 1,
    speed: 5, will: 6, life: 0, chargeRequirement: 0,
    diceDistribution: mixedDist,
    skills: [{ skillId: 'zuolei_leiji', name: '雷击', type: 'active', description: '消耗1冥想骰：攻击骰+1伤害' }],
    imageKey: '佐雷',
  },
  {
    id: 'guta', name: '孤塔之王', column: 1, source: 'builtin', version: 1,
    speed: 0, will: 0, life: 0, chargeRequirement: 0,
    diceDistribution: defDist,
    skills: [{ skillId: 'guta_guta', name: '孤塔', type: 'continuous', description: '防御时额外+1护盾' }],
    imageKey: '孤塔之王',
  },
  {
    id: 'nisa', name: '尼萨', column: 2, source: 'builtin', version: 1,
    speed: 0, will: 0, life: 15, chargeRequirement: 3,
    diceDistribution: mixedDist,
    skills: [{ skillId: 'nisa_zhiyu', name: '治愈', type: 'onCharge', description: '充能满时：恢复3点生命' }],
    imageKey: '尼萨',
  },
  {
    id: 'poxiao', name: '破晓之剑', column: 0, source: 'builtin', version: 1,
    speed: 4, will: 7, life: 0, chargeRequirement: 0,
    diceDistribution: mixedDist,
    skills: [{ skillId: 'poxiao_poxiao', name: '破晓', type: 'active', description: '消耗1冥想骰：破防，无视防御骰' }],
    imageKey: '破晓之剑',
  },
  {
    id: 'xieling', name: '邪灵', column: 1, source: 'builtin', version: 1,
    speed: 0, will: 0, life: 0, chargeRequirement: 0,
    diceDistribution: medDist,
    skills: [{ skillId: 'xieling_zuzhou', name: '诅咒', type: 'trigger', description: '回合开始：敌方尘落+1' }],
    imageKey: '邪灵',
  },
  {
    id: 'heiqiang', name: '黑枪', column: 2, source: 'builtin', version: 1,
    speed: 0, will: 0, life: 15, chargeRequirement: 3,
    diceDistribution: mixedDist,
    skills: [{ skillId: 'heiqiang_heiqiang', name: '黑枪', type: 'onCharge', description: '充能满时：造成5点伤害' }],
    imageKey: '黑枪',
  },
];