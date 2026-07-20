/* ═══════════════════════════════════════════════════════════
 * 技能系统 — 技能注册表 + 批量触发
 *
 * 共享类型和辅助函数在 skillHelpers.ts 中（避免循环依赖）
 * 各角色技能实现在 skills/*.ts 中
 * ═══════════════════════════════════════════════════════════ */

import type { GameState, PlayerState, Artifact, Skill as SkillDef } from '../types/game';
import type { SkillExecutionResult } from '../../../shared/effects';
import { type SkillFn, resolvePlayers } from './skillHelpers';
import { canExecute } from './effects';

/* ═══════════════════════════════════════════════════════════
 *  导入各神器技能模块（每个神器一个文件）
 * ═══════════════════════════════════════════════════════════ */

// 空（雨中剑圣）
import { skillYuqieZhongyangTupo, skillYuqieCaiyuliu } from './skills/yuqie';
import { skillYoulongLongyouwanxiang, skillYoulongLongtengwanzhang } from './skills/youlong';
import { skillMingjingZhanshenqie } from './skills/mingjing';

// 影（永暗之刃）
import { skillBuxiangCuilian, skillBuxiangFengmang } from './skills/buxiang';
import { skillYinglueYingxi, skillYinglueQianxing } from './skills/yinglue';
import { skillWanshaLingshixiaoshou } from './skills/wansha';

// 李封（天殇的战鬼）
import { skillTuhuQixi, skillTuhuHengguan } from './skills/tuhu';
import { skillAigeXianzhen, skillAigeJianya } from './skills/aige';
import { skillHanguangLinliezhiyin } from './skills/hanguang';

// 玛特（破晓之剑）
import { skillTianfaBaizhouzhihuo, skillTianfaYunluo } from './skills/tianfa';
import { skillZhenyanQuanzhi, skillZhenyanShenshengganshe } from './skills/zhenyan';
import { skillJiushuHuanyufeisheng } from './skills/jiushu';

// 塔塔萝丝（地狱的魔女）
import { skillShenhongZhenshizhijian, skillShenhongShayi } from './skills/shenhong';
import { skillDunwuLingnengpingzhang, skillDunwuLingnengmaichong } from './skills/dunwu';
import { skillMonvMengxingshifen } from './skills/monv';

// 巴顿二世（孤塔之王）
import { skillZhuzaiZhanzhengsaodang, skillZhuzaiZhendangzhanji } from './skills/zhuzai';
import { skillTiebiZhanche, skillTiebiWangshizhiquan } from './skills/tiebi';
import { skillGuwangGaotatiemu } from './skills/guwang';

// 艾娃（受缚邪灵）
import { skillEzhaoXueji, skillEzhaoQingsuan } from './skills/ezhao';
import { skillMengyanDiyu, skillMengyanEyi } from './skills/mengyan';
import { skillDiaolingSiwangyishi } from './skills/diaoling';

// 修（漆黑死神）
import { skillXuyuXuwuxingtai, skillXuyuXianji } from './skills/xuyu';
import { skillYoumingWeimu, skillYoumingMingjiexingzou } from './skills/youming';
import { skillZhiheiQiheizhanfang } from './skills/zhihei';

// 希瓦（黑枪）
import { skillSiqiTiandan, skillSiqiChuxingtongdie } from './skills/siqi';
import { skillShexieWeiju, skillShexieGongzhen } from './skills/shexie';
import { skillKuangwuXiongdanyewu } from './skills/kuangwu';

// 弥云（渡世行僧）
import { skillJingangPozhang, skillJingangBudongputi } from './skills/jingang';
import { skillQianjieWanzhangmingguang, skillQianjieChaodu } from './skills/qianjie';
import { skillWuxiangWanxiangjumie } from './skills/wuxiang';

// 尼萨（荒野行者）
import { skillChenaiChenqi, skillChenaiManwangzhiya } from './skills/chenai';
import { skillShouhunXiongzhixin, skillShouhunLangzhixue } from './skills/shouhun';
import { skillJueyiYehuoliaoyuan } from './skills/jueyi';

// 佐雷（轰鸣审判官）
import { skillMingleiDianxing, skillMingleiLeibao } from './skills/minglei';
import { skillChengjieJinghua, skillChengjieShuzuibingfa } from './skills/chengjie';
import { skillCanxiangJuejingtianshen } from './skills/canxiang';

/* ═══════════════════════════════════════════════════════════
 *  技能注册表 — 按 skillId 索引
 *  扩展新技能时只需在这里加一行
 * ═══════════════════════════════════════════════════════════ */

export const SKILL_REGISTRY: Record<string, SkillFn> = {
  /* ── 空（雨中剑圣） ── */
  'yuqie_zhongyangtupo': skillYuqieZhongyangTupo,
  'yuqie_caiyuliu': skillYuqieCaiyuliu,
  'youlong_longyouwanxiang': skillYoulongLongyouwanxiang,
  'youlong_longtengwanzhang': skillYoulongLongtengwanzhang,
  'mingjing_zhanshenqie': skillMingjingZhanshenqie,

  /* ── 影（永暗之刃） ── */
  'buxiang_cuilian': skillBuxiangCuilian,
  'buxiang_fengmang': skillBuxiangFengmang,
  'yinglue_yingxi': skillYinglueYingxi,
  'yinglue_qianxing': skillYinglueQianxing,
  'wansha_lingshixiaoshou': skillWanshaLingshixiaoshou,

  /* ── 李封（天殇的战鬼） ── */
  'tuhu_qixi': skillTuhuQixi,
  'tuhu_hengguan': skillTuhuHengguan,
  'aige_xianzhen': skillAigeXianzhen,
  'aige_jianya': skillAigeJianya,
  'hanguang_linliezhiyin': skillHanguangLinliezhiyin,

  /* ── 玛特（破晓之剑） ── */
  'tianfa_baizhouzhihuo': skillTianfaBaizhouzhihuo,
  'tianfa_yunluo': skillTianfaYunluo,
  'zhenyan_quanzhi': skillZhenyanQuanzhi,
  'zhenyan_shenshengganshe': skillZhenyanShenshengganshe,
  'jiushu_huanyufeisheng': skillJiushuHuanyufeisheng,

  /* ── 塔塔萝丝（地狱的魔女） ── */
  'shenhong_zhenshizhijian': skillShenhongZhenshizhijian,
  'shenhong_shayi': skillShenhongShayi,
  'dunwu_lingnengpingzhang': skillDunwuLingnengpingzhang,
  'dunwu_lingnengmaichong': skillDunwuLingnengmaichong,
  'monv_mengxingshifen': skillMonvMengxingshifen,

  /* ── 巴顿二世（孤塔之王） ── */
  'zhuzai_zhanzhengsaodang': skillZhuzaiZhanzhengsaodang,
  'zhuzai_zhendangzhanji': skillZhuzaiZhendangzhanji,
  'tiebi_zhanche': skillTiebiZhanche,
  'tiebi_wangshizhiquan': skillTiebiWangshizhiquan,
  'guwang_gaotatiemu': skillGuwangGaotatiemu,

  /* ── 艾娃（受缚邪灵） ── */
  'ezhao_xueji': skillEzhaoXueji,
  'ezhao_qingsuan': skillEzhaoQingsuan,
  'mengyan_diyu': skillMengyanDiyu,
  'mengyan_eyi': skillMengyanEyi,
  'diaoling_siwangyishi': skillDiaolingSiwangyishi,

  /* ── 修（漆黑死神） ── */
  'xuyu_xuwuxingtai': skillXuyuXuwuxingtai,
  'xuyu_xianji': skillXuyuXianji,
  'youming_weimu': skillYoumingWeimu,
  'youming_mingjiexingzou': skillYoumingMingjiexingzou,
  'zhihei_qiheizhanfang': skillZhiheiQiheizhanfang,

  /* ── 希瓦（黑枪） ── */
  'siqi_tiandan': skillSiqiTiandan,
  'siqi_chuxingtongdie': skillSiqiChuxingtongdie,
  'shexie_weiju': skillShexieWeiju,
  'shexie_gongzhen': skillShexieGongzhen,
  'kuangwu_xiongdanyewu': skillKuangwuXiongdanyewu,

  /* ── 弥云（渡世行僧） ── */
  'jingang_pozhang': skillJingangPozhang,
  'jingang_budongputi': skillJingangBudongputi,
  'qianjie_wanzhangmingguang': skillQianjieWanzhangmingguang,
  'qianjie_chaodu': skillQianjieChaodu,
  'wuxiang_wanxiangjumie': skillWuxiangWanxiangjumie,

  /* ── 尼萨（荒野行者） ── */
  'chenai_chenqi': skillChenaiChenqi,
  'chenai_manwangzhiya': skillChenaiManwangzhiya,
  'shouhun_xiongzhixin': skillShouhunXiongzhixin,
  'shouhun_langzhixue': skillShouhunLangzhixue,
  'jueyi_yehuoliaoyuan': skillJueyiYehuoliaoyuan,

  /* ── 佐雷（轰鸣审判官） ── */
  'minglei_dianxing': skillMingleiDianxing,
  'minglei_leibao': skillMingleiLeibao,
  'chengjie_jinghua': skillChengjieJinghua,
  'chengjie_shuzuibingfa': skillChengjieShuzuibingfa,
  'canxiang_juejingtianshen': skillCanxiangJuejingtianshen,
};

/** 根据 skillId 获取技能函数 */
export function getSkillFn(skillId: string): SkillFn | undefined {
  return SKILL_REGISTRY[skillId];
}

/* ═══════════════════════════════════════════════════════════
 *  批量触发 — 按类型自动调用
 * ═══════════════════════════════════════════════════════════ */

/** 技能类型映射：中文类型 → 英文分类 */
const CN_TYPE_TO_EN: Record<string, string> = {
  '启动': 'active',
  '触发': 'trigger',
  '持续': 'continuous',
  '激活': 'onActivate',
  '充能': 'onCharge',
  '必杀': 'onCharge',
};

/** 判断技能类型是否包含指定分类 */
function hasSkillType(skillType: string, targetType: string): boolean {
  const types = skillType.split(/[；;]/).map(t => t.trim());
  return types.some(t => CN_TYPE_TO_EN[t] === targetType);
}

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
      if (!hasSkillType(skill.type, type)) continue;
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

/* ── re-export 类型，保持向后兼容 ── */
export type { SkillFn };
export { resolvePlayers };
