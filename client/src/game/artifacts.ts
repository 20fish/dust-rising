/* ═══════════════════════════════════════════════════════════
 * 神器数据 - 12个神器定义
 * ═══════════════════════════════════════════════════════════ */

import type { Artifact, ArtifactColumn, DiceDistribution } from '../types/game';

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

/** 所有神器定义 */
export const ALL_ARTIFACTS: Artifact[] = [
  {
    id: 'yuqie',
    name: '雨切',
    column: 0,
    speed: 4, will: 7, life: 0, chargeRequirement: 0,
    diceDistribution: mixedDist,
    skills: [{ name: '斩击', type: 'active', description: '消耗1冥想骰：造成2点额外伤害' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'yinglue',
    name: '影掠',
    column: 1,
    speed: 0, will: 0, life: 0, chargeRequirement: 0,
    diceDistribution: balancedDist,
    skills: [{ name: '影袭', type: 'trigger', description: '攻击命中时：额外造成1点伤害' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'aige',
    name: '哀歌',
    column: 2,
    speed: 0, will: 0, life: 15, chargeRequirement: 3,
    diceDistribution: mixedDist,
    skills: [{ name: '悲鸣', type: 'onCharge', description: '充能满时：对敌方造成3点伤害' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'jingang',
    name: '金刚',
    column: 0,
    speed: 3, will: 8, life: 0, chargeRequirement: 0,
    diceDistribution: mixedDist,
    skills: [{ name: '金刚身', type: 'continuous', description: '受到伤害时减少1点' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'youming',
    name: '幽冥',
    column: 1,
    speed: 0, will: 0, life: 0, chargeRequirement: 0,
    diceDistribution: atkDist,
    skills: [{ name: '冥火', type: 'active', description: '消耗1冥想骰：本回合攻击+2' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'dunwu',
    name: '顿悟',
    column: 2,
    speed: 0, will: 0, life: 15, chargeRequirement: 3,
    diceDistribution: mixedDist,
    skills: [{ name: '顿悟', type: 'onCharge', description: '充能满时：获得1个额外冥想骰' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'zuolei',
    name: '佐雷',
    column: 0,
    speed: 5, will: 6, life: 0, chargeRequirement: 0,
    diceDistribution: mixedDist,
    skills: [{ name: '雷击', type: 'active', description: '消耗1冥想骰：攻击骰+1伤害' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'guta',
    name: '孤塔之王',
    column: 1,
    speed: 0, will: 0, life: 0, chargeRequirement: 0,
    diceDistribution: defDist,
    skills: [{ name: '孤塔', type: 'continuous', description: '防御时额外+1护盾' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'nisa',
    name: '尼萨',
    column: 2,
    speed: 0, will: 0, life: 15, chargeRequirement: 3,
    diceDistribution: mixedDist,
    skills: [{ name: '治愈', type: 'onCharge', description: '充能满时：恢复3点生命' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'poxiao',
    name: '破晓之剑',
    column: 0,
    speed: 4, will: 7, life: 0, chargeRequirement: 0,
    diceDistribution: mixedDist,
    skills: [{ name: '破晓', type: 'active', description: '消耗1冥想骰：破防，无视防御骰' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'xieling',
    name: '邪灵',
    column: 1,
    speed: 0, will: 0, life: 0, chargeRequirement: 0,
    diceDistribution: medDist,
    skills: [{ name: '诅咒', type: 'trigger', description: '回合开始：敌方尘落+1' }],
    isActive: false, chargeCount: 0,
  },
  {
    id: 'heiqiang',
    name: '黑枪',
    column: 2,
    speed: 0, will: 0, life: 15, chargeRequirement: 3,
    diceDistribution: mixedDist,
    skills: [{ name: '黑枪', type: 'onCharge', description: '充能满时：造成5点伤害' }],
    isActive: false, chargeCount: 0,
  },
];

/** 根据列获取神器 */
export function getArtifactsByColumn(column: ArtifactColumn): Artifact[] {
  return ALL_ARTIFACTS.filter(a => a.column === column);
}

/** 根据ID获取神器 */
export function getArtifactById(id: string): Artifact | undefined {
  return ALL_ARTIFACTS.find(a => a.id === id);
}

/** 获取神器对应的图片文件名 */
export function getArtifactImage(artifact: Artifact): string {
  const nameMap: Record<string, string> = {
    'yuqie': '空',
    'yinglue': '影',
    'aige': '战鬼',
    'jingang': '和尚',
    'youming': '死神',
    'dunwu': '魔女',
    'zuolei': '佐雷',
    'guta': '孤塔之王',
    'nisa': '尼萨',
    'poxiao': '破晓之剑',
    'xieling': '邪灵',
    'heiqiang': '黑枪',
  };
  const col = artifact.column + 1;
  return `/artifacts/${nameMap[artifact.id] || artifact.name} (${col}).jpg`;
}