/* ═══════════════════════════════════════════════════════════
 * 神器静态数据 — 36个内置神器定义（12角色 x 3列）
 * 纯数据，不依赖任何运行时环境（浏览器/Node.js 均可引入）
 * ═══════════════════════════════════════════════════════════ */

import type { ArtifactDef, DiceDistribution } from './types';

/** 所有内置神器静态定义 */
export const BUILTIN_ARTIFACTS: ArtifactDef[] = [
  /* ═══════════════════════════════════════════════════════════
   * 空（雨中剑圣）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'yuqie',
    name: '雨切',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 7,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'yuqie_zhongyangtupo',
        name: '中央突破',
        type: '启动',
        description:
          '消耗最多3个冥想骰。弃置对方同等数量的防御骰。如果你消耗了恰好3个冥想骰，直到本回合结束前，你的攻击不可抵挡。',
      },
      {
        skillId: 'yuqie_caiyuliu',
        name: '裁雨流',
        type: '触发',
        description:
          '当你使用攻击骰造成伤害后。你可以保留其点数，将其移动至你的防御骰区或冥想骰区。本技能每回合最多触发3次。',
      },
    ],
    imageKey: 'yuqie',
  },
  {
    id: 'youlong',
    name: '游龙',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      2: ['defense', 'attack', 'meditation'],
      4: ['defense', 'attack', 'meditation'],
      6: ['defense', 'attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'youlong_longyouwanxiang',
        name: '龙游万象',
        type: '持续',
        description:
          '你的速度+1。在你的回合内的重掷阶段中，你可以进行最多2次重掷（每次重掷的数量最多等同于你的速度）。',
      },
      {
        skillId: 'youlong_longtengwanzhang',
        name: '龙腾万丈',
        type: '启动',
        description:
          '消耗3个冥想骰。获得4个随机点数的能力骰，将其中点数最大和最小的能力骰各1个移动到攻击骰区，将另外2个能力骰移动到防御骰区。本回合中，你的攻击伤害+1。',
      },
    ],
    imageKey: 'yuqie-youlong',
  },
  {
    id: 'mingjing',
    name: '明镜',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 50,
    chargeRequirement: 4,
    diceDistribution: {},
    skills: [
      {
        skillId: 'mingjing_zhanshenqie',
        name: '斩神切',
        type: '充能；必杀',
        description:
          '充能：你可以立即再次进行1次需要正常使用冥想骰的额外"尘起行动"。；必杀：弃置你的全部能力骰。弃置对方与你弃置的能力骰对应种类、对应数量的能力骰。造成X点真实伤害，X为以此法弃置的双方能力骰数量总和。之后，你获得3个随机点数的防御骰。',
      },
    ],
    imageKey: 'yuqie-mingjing',
  },

  /* ═══════════════════════════════════════════════════════════
   * 影（永暗之刃）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'buxiang',
    name: '不详',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 8,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'buxiang_cuilian',
        name: '淬炼',
        type: '启动',
        description: '消耗1个攻击骰。→本神器计数+1（最高叠加至3层）。',
      },
      {
        skillId: 'buxiang_fengmang',
        name: '锋芒',
        type: '持续；触发',
        description:
          '持续：你的攻击伤害+X。X为本神器叠加的计数。；触发：当你的攻击被防御骰抵挡后。→你可以消耗1个攻击骰和1个冥想骰，取消该防御骰的效果，并再额外追加2点真实伤害。',
      },
    ],
    imageKey: 'buxiang',
  },
  {
    id: 'yinglue',
    name: '影掠',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      1: 'attack',
      2: ['defense', 'attack', 'meditation'],
      3: 'meditation',
      5: 'attack',
    },
    skills: [
      {
        skillId: 'yinglue_yingxi',
        name: '影袭',
        type: '启动',
        description:
          '使你的1个能力骰点数下降X点（最低降为1），并根据新的点数，将其移动至对应的区域。→视为以X点进行1次攻击。',
      },
      {
        skillId: 'yinglue_qianxing',
        name: '潜行',
        type: '启动',
        description:
          '消耗2个攻击骰。获得2个随机点数的防御骰和1个随机点数的冥想骰。',
      },
    ],
    imageKey: 'yinglue',
  },
  {
    id: 'wansha',
    name: '完杀',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 50,
    chargeRequirement: 4,
    diceDistribution: {},
    skills: [
      {
        skillId: 'wansha_lingshixiaoshou',
        name: '零时枭首',
        type: '充能；必杀',
        description:
          '充能：获得1个点数等同本神器当前充能层数的攻击骰。；必杀：消耗1个攻击骰。→弃置对方X个防御骰。之后，如果对方还有剩余的防御骰，你再获得X个随机点数的攻击骰。X为你消耗的攻击骰的点数。',
      },
    ],
    imageKey: 'yinglue-wansha',
  },

  /* ═══════════════════════════════════════════════════════════
   * 李封（天殇的战鬼）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'tuhu',
    name: '屠虎',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 7,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'tuhu_qixi',
        name: '奇袭',
        type: '持续',
        description:
          '你能将任意能力骰视为攻击骰使用，只要对方的区域中不存在该能力骰的点数。',
      },
      {
        skillId: 'tuhu_hengguan',
        name: '横贯',
        type: '触发；持续',
        description:
          '触发：每当你的攻击被抵挡后。你可以弃置对方区域中1个点数小于该攻击的能力骰。；持续：你在每个回合中进行的第二次攻击伤害+2。',
      },
    ],
    imageKey: 'tuhu',
  },
  {
    id: 'aige',
    name: '哀歌',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      2: ['defense', 'meditation'],
      3: 'attack',
      5: 'attack',
      6: ['defense', 'meditation'],
    },
    skills: [
      {
        skillId: 'aige_xianzhen',
        name: '陷阵',
        type: '持续',
        description:
          '你的重掷阶段结束时，生命最少的玩家选择你的1个能力骰并将其弃置。然后，你获得另外两种类型的随机点数能力骰各1个。',
      },
      {
        skillId: 'aige_jianya',
        name: '减压',
        type: '触发',
        description:
          '当你使用1个任意能力骰后。你可以令自己或对方的1个能力骰的点数变更为2点，并保留在原本的区域。',
      },
    ],
    imageKey: 'lifeng-aige',
  },
  {
    id: 'hanguang',
    name: '寒光',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 50,
    chargeRequirement: 2,
    diceDistribution: {},
    skills: [
      {
        skillId: 'hanguang_linliezhiyin',
        name: '凛冽之音',
        type: '充能；必杀',
        description:
          '充能：直到你的下个尘起阶段开始，在任何玩家重掷能力骰后，使其受到等同重掷数量的真实伤害。；必杀：消耗1个攻击骰，1个防御骰，以及1个冥想骰。从供应堆中拿取1·2·3·4·5·6点的骰子各1个置于本神器上，并在回合结束时移除本神器上的全部骰子。当你将要使用1个攻击骰时，从以下两项中选择1项执行：①将本神器上的1个骰子根据其点数移动到你的对应区域。②将本神器上的1个骰子移除，弃置对方的1个与该骰子点数相同的能力骰。',
      },
    ],
    imageKey: 'lifeng-hanguang',
  },

  /* ═══════════════════════════════════════════════════════════
   * 玛特（破晓之剑）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'tianfa',
    name: '天罚',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 8,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'tianfa_baizhouzhihuo',
        name: '白昼之火',
        type: '激活',
        description:
          '直到本回合结束前，你的攻击不可用防御骰抵挡，而是改为只能使用冥想骰抵挡，且你的攻击点数始终视为[3]。当你在本回合中通过攻击造成2次伤害后，立即结束你的主要阶段。',
      },
      {
        skillId: 'tianfa_yunluo',
        name: '陨落',
        type: '激活',
        description:
          '直到本回合结束前，你的攻击不可用防御骰抵挡，而是改为只能使用攻击骰抵挡，且你的攻击点数始终视为[3]。当你在本回合中通过攻击造成2次伤害后，立即结束你的主要阶段。',
      },
    ],
    imageKey: 'mate-tianfa',
  },
  {
    id: 'zhenyan',
    name: '真言',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      1: 'defense',
      2: ['defense', 'attack', 'meditation'],
      3: ['defense', 'attack'],
      4: ['defense', 'attack', 'meditation'],
      6: 'meditation',
    },
    skills: [
      {
        skillId: 'zhenyan_quanzhi',
        name: '全知',
        type: '持续',
        description:
          '你的速度+1。在你的补充阶段与重掷阶段中，你不遵循正常的骰点分布规则，而是将你的全部能力骰：每2个点数相同的能力骰置于防御骰区，每3个顺点的能力骰置入攻击骰区，其余能力骰置入冥想骰区。',
      },
      {
        skillId: 'zhenyan_shenshengganshe',
        name: '神圣干涉',
        type: '激活',
        description:
          '将你的最多3个能力骰改为你指定的任意点数，并将其移动至对应点数的区域。之后，你回复3点生命。',
      },
    ],
    imageKey: 'mate-zhenyan',
  },
  {
    id: 'jiushu',
    name: '救赎',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 45,
    chargeRequirement: 2,
    diceDistribution: {},
    skills: [
      {
        skillId: 'jiushu_huanyufeisheng',
        name: '寰宇飞升',
        type: '持续；必杀',
        description:
          '持续：双方在各自的回合中进行的第一次攻击伤害+3。；必杀：消耗4个冥想骰。获得3个随机点数的攻击骰与3个随机点数的防御骰。之后，你回复10点生命。在接下来的游戏中，本神器失去"持续式"效果。',
      },
    ],
    imageKey: 'mate-jiushu',
  },

  /* ═══════════════════════════════════════════════════════════
   * 塔塔萝丝（地狱的魔女）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'shenhong',
    name: '深红',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 8,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'shenhong_zhenshizhijian',
        name: '真实之剑',
        type: '持续',
        description:
          '每当你需要使用或消耗任意种类的能力骰时，你都能将2个能力骰视为任意种类的1个能力骰使用或消耗，其点数视为3。',
      },
      {
        skillId: 'shenhong_shayi',
        name: '杀意',
        type: '触发',
        description:
          '当你在补充阶段补充的能力骰数量少于或等于3个时。你可以造成3点真实伤害，然后回复2点生命。',
      },
    ],
    imageKey: 'tataluosishenhong',
  },
  {
    id: 'dunwu',
    name: '顿悟',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      1: 'defense',
      2: ['defense', 'attack', 'meditation'],
      3: ['attack', 'meditation'],
      4: 'defense',
      5: ['attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'dunwu_lingnengpingzhang',
        name: '灵能屏障',
        type: '启动；触发',
        description:
          '启动：消耗最多3个防御骰。→获得等同消耗数量2倍的随机点数的冥想骰。；触发：当对方使用1个攻击骰后。→你可以消耗1个冥想骰，将该攻击骰造成的伤害改为一半（向下取整）。',
      },
      {
        skillId: 'dunwu_lingnengmaichong',
        name: '灵能脉冲',
        type: '启动；触发',
        description:
          '启动：消耗最多3个攻击骰。→获得等同消耗数量2倍的随机点数的冥想骰。；触发：当你通过技能消耗能力骰后。→你可以额外造成等同消耗能力骰数量的真实伤害。本技能每回合最多触发1次。',
      },
    ],
    imageKey: 'tataluosidunwu',
  },
  {
    id: 'monv',
    name: '魔女',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 40,
    chargeRequirement: 1,
    diceDistribution: {},
    skills: [
      {
        skillId: 'monv_mengxingshifen',
        name: '梦醒时分',
        type: '持续；必杀',
        description:
          '持续：你的意志+1，你的速度+X。X为你当前的冥想骰数量，且最大为3。；必杀：将你的最多3个冥想骰移动至你的另一个区域，并保留其原本的点数。',
      },
    ],
    imageKey: 'tataluosimonv',
  },

  /* ═══════════════════════════════════════════════════════════
   * 巴顿二世（孤塔之王）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'zhuzai',
    name: '主宰',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 7,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'zhuzai_zhanzhengsaodang',
        name: '战争横扫',
        type: '启动',
        description:
          '消耗1个攻击骰，1个防御骰，以及1个冥想骰。→弃置对方1个攻击骰，1个防御骰，以及1个冥想骰。之后，造成等同你消耗的能力骰点数总和一半的真实伤害（向下取整）。',
      },
      {
        skillId: 'zhuzai_zhendangzhanji',
        name: '震荡斩击',
        type: '启动',
        description:
          '消耗4个类型相同的能力骰。→弃置对方4个与你消耗的能力骰类型相同的能力骰。之后，造成等同你消耗的能力骰点数总和一半的真实伤害（向下取整）。',
      },
    ],
    imageKey: 'badunershi-zhuzai',
  },
  {
    id: 'tiebi',
    name: '铁壁',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      1: 'defense',
      2: ['attack', 'meditation'],
      4: 'defense',
      5: ['attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'tiebi_zhanche',
        name: '战车',
        type: '持续',
        description:
          '你的意志+1。你的回合开始时，如果你拥有至少1个防御骰，你获得1个[4]点的攻击骰。',
      },
      {
        skillId: 'tiebi_wangshizhiquan',
        name: '王室之拳',
        type: '启动',
        description:
          '消耗2个冥想骰。弃置你的2个防御骰。若你弃置的防御骰数量不足2个，每少弃置1个防御骰，你便受到2点真实伤害。然后，你获得4个随机点数的防御骰。本回合中，你的攻击伤害+1。',
      },
    ],
    imageKey: 'badunershi-tiebi',
  },
  {
    id: 'guwang',
    name: '孤王',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 50,
    chargeRequirement: 3,
    diceDistribution: {},
    skills: [
      {
        skillId: 'guwang_gaotatiemu',
        name: '高塔铁幕',
        type: '触发；充能；必杀',
        description:
          '触发：当你受到来自对方的真实伤害时。→你可以消耗1个防御骰，取消该真实伤害。；充能：将对方的1个攻击骰点数变更为[1]并保留在原本的区域。；必杀：弃置你的全部能力骰，然后获得随机点数的防御骰直至你的能力骰总数达到你的意志上限。之后，立即结束你的主要阶段。',
      },
    ],
    imageKey: 'badunershi-guwang',
  },

  /* ═══════════════════════════════════════════════════════════
   * 艾娃（受缚邪灵）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'ezhao',
    name: '恶兆',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 7,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'ezhao_xueji',
        name: '血祭',
        type: '持续',
        description:
          '每当你进行1次攻击后，本神器计数+1（最高叠加至7层）。每当你的攻击造成伤害后，你受到X点真实伤害。X为本神器叠加的计数。',
      },
      {
        skillId: 'ezhao_qingsuan',
        name: '清算',
        type: '激活',
        description:
          '弃置对方X个能力骰。若对方弃置的能力骰数量不足X个，每少弃置1个能力骰，便造成3点真实伤害。X为本神器叠加的计数。然后，本神器的计数下降1点。',
      },
    ],
    imageKey: 'aiwa-ezhao',
  },
  {
    id: 'mengyan',
    name: '梦魇',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      1: 'defense',
      2: ['attack', 'meditation'],
      3: ['defense', 'attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'mengyan_diyu',
        name: '低语',
        type: '持续',
        description:
          '你的主要阶段结束时，你宣称1个能力骰类型。你获得1个随机点数的能力骰，并移动到宣称类型的区域。如果该能力骰的点数不符合骰点分布，尘落+1。',
      },
      {
        skillId: 'mengyan_eyi',
        name: '恶意',
        type: '启动；持续',
        description:
          '启动：消耗1个攻击骰。→获得2个随机点数的冥想骰。；持续：你的攻击伤害+X。X为你的冥想骰数量的一半（向下取整）。',
      },
    ],
    imageKey: 'aiwa-mengyan',
  },
  {
    id: 'diaoling',
    name: '凋零',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 40,
    chargeRequirement: 2,
    diceDistribution: {},
    skills: [
      {
        skillId: 'diaoling_siwangyishi',
        name: '死亡亦逝',
        type: '充能；持续',
        description:
          '充能：对方下降生命，直至生命的个位数为0。你尽可能地回复生命，直至生命的个位数为0。；持续：双方在各自的回合结束时，必须从以下两项中选择1项执行：①弃置自己的能力骰，直至自己区域中的能力骰点数全都相同。②弃置自己的能力骰，直至自己区域中的能力骰点数全都不同。',
      },
    ],
    imageKey: 'aiwa-diaoling',
  },

  /* ═══════════════════════════════════════════════════════════
   * 修（漆黑死神）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'xuyu',
    name: '虚臾',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 3,
    will: 8,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'xuyu_xuwuxingtai',
        name: '虚无形态',
        type: '激活；持续',
        description:
          '激活：你受到10点真实伤害。之后，选择1个能力骰类型，你获得该类型的[4]点能力骰，直至你的能力骰总数达到你的意志上限。；持续：你的速度+2。',
      },
      {
        skillId: 'xuyu_xianji',
        name: '献祭',
        type: '启动',
        description:
          '你受到4点真实伤害。从以下两项中选择1项执行：①获得3个随机点数的能力骰，并根据其点数移动至对应的区域。②本回合中，你的攻击伤害+2。',
      },
    ],
    imageKey: 'xiu-xuyu',
  },
  {
    id: 'youming',
    name: '幽冥',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      1: ['attack', 'meditation'],
      2: 'defense',
      3: 'defense',
      4: ['defense', 'attack', 'meditation'],
      5: ['attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'youming_weimu',
        name: '帷幕',
        type: '触发',
        description:
          '对方的重掷阶段结束时。→你可以受到2点真实伤害，并将对方的1个能力骰弃置。',
      },
      {
        skillId: 'youming_mingjiexingzou',
        name: '冥界行走',
        type: '启动；持续',
        description:
          '启动：消耗最多3个冥想骰。→获得同等数量的随机点数的攻击骰。；持续：每当你的攻击造成伤害后，如果攻击点数不为1，你回复该攻击点数一半的生命（向上取整）；如果攻击点数为1，你受到3点真实伤害。',
      },
    ],
    imageKey: 'xiu-youming',
  },
  {
    id: 'zhihei',
    name: '至黑',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 45,
    chargeRequirement: 1,
    diceDistribution: {},
    skills: [
      {
        skillId: 'zhihei_qiheizhanfang',
        name: '漆黑绽放',
        type: '持续；必杀',
        description:
          '持续：每当你于任何玩家的回合中第一次受到伤害后，本神器计数+1（最高叠加至5层）。当本神器的计数达到5时，你的"必杀式"技能必须立即启动，无论现在是谁的回合。；必杀：获得X个随机点数的能力骰，然后你可以重掷最多X个能力骰，并根据新的点数移动到你的对应区域。X为本神器叠加的计数。在接下来的游戏中，本神器失去"持续式"效果。',
      },
    ],
    imageKey: 'xiu-zhihei',
  },

  /* ═══════════════════════════════════════════════════════════
   * 希瓦（黑枪）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'siqi',
    name: '死契',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 8,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'siqi_tiandan',
        name: '填弹',
        type: '启动',
        description:
          '消耗最多6个能力骰。如果你试图消耗2个或更多的能力骰，其点数必须顺点。→本神器计数+X（最高叠加至6层）。X为消耗的能力骰数量。',
      },
      {
        skillId: 'siqi_chuxingtongdie',
        name: '处刑通牒',
        type: '触发',
        description:
          '当你将要使用1个攻击骰时。→你可以使本神器的计数下降1点，然后从以下两项中选择1项执行：①令本次攻击伤害+1且不可抵挡。②令本次攻击伤害+5。',
      },
    ],
    imageKey: 'xiwa-siqi',
  },
  {
    id: 'shexie',
    name: '蛇蝎',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      1: 'defense',
      2: ['attack', 'meditation'],
      3: 'defense',
      4: ['attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'shexie_weiju',
        name: '畏惧',
        type: '启动',
        description:
          '消耗1个任意能力骰。之后，对方必须消耗他的1个任意能力骰。→比较双方消耗的能力骰点数大小。如果对方的点数较小，对方在其下个回合中攻击造成的伤害改为一半（向下取整）；否则，无事发生。特殊的，1点视为大于6点。',
      },
      {
        skillId: 'shexie_gongzhen',
        name: '共振',
        type: '启动',
        description:
          '重掷你的1个任意能力骰，并根据新的点数，将其移动至你的对应区域。→根据移动后的区域，从以下两项中选择1项执行：①你与对方分别获得2个该类型的随机点数的能力骰。②你与对方分别弃置2个该类型的能力骰。',
      },
    ],
    imageKey: 'xiwa-shexie',
  },
  {
    id: 'kuangwu',
    name: '狂舞',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 50,
    chargeRequirement: 4,
    diceDistribution: {},
    skills: [
      {
        skillId: 'kuangwu_xiongdanyewu',
        name: '凶弹业舞',
        type: '充能；必杀',
        description:
          '充能：选择任意玩家的1个能力骰，将其移动至该玩家的另一个区域，并保留其原本的点数。；必杀：你从双方的合计6个区域中，每个区域各选择3个能力骰（如果不足3个，则尽可能选择），将这些能力骰按顺时针或逆时针方向分别移动至下个区域（这可能让一位玩家的能力骰移入另一位玩家的区域）。',
      },
    ],
    imageKey: 'xiwa-kuangwu',
  },

  /* ═══════════════════════════════════════════════════════════
   * 弥云（渡世行僧）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'jingang',
    name: '金刚',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 3,
    will: 8,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'jingang_pozhang',
        name: '破障',
        type: '激活；持续',
        description:
          '激活：移除本神器上存放的剩余骰子，然后从供应堆拿取3个点数不相同的骰子存放在本神器上（这些骰子并不视为在你的区域中）。；持续：你可以将本神器上的骰子当作自己的能力骰使用或消耗，其类型由其点数决定。',
      },
      {
        skillId: 'jingang_budongputi',
        name: '不动菩提',
        type: '激活；触发',
        description:
          '激活：同上。；触发：当对方使用1个防御骰或攻击骰后。你可以移除本神器上的1个与其点数相同的骰子，取消其效果。',
      },
    ],
    imageKey: 'miyun-jingang',
  },
  {
    id: 'qianjie',
    name: '千劫',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      2: ['defense', 'attack', 'meditation'],
      4: ['defense', 'attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'qianjie_wanzhangmingguang',
        name: '万丈明光',
        type: '持续',
        description:
          '你的速度+3，你的意志+2。你的主要阶段开始时，你弃置2个能力骰。',
      },
      {
        skillId: 'qianjie_chaodu',
        name: '超度',
        type: '启动',
        description:
          '消耗2个点数相同的冥想骰。造成5点真实伤害。之后，选择任意玩家的一个区域，将该区域中的能力骰全部重掷，并根据新的点数，将这些能力骰移动至该玩家对应点数的区域。',
      },
    ],
    imageKey: 'miyun-qianjie',
  },
  {
    id: 'wuxiang',
    name: '无相',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 50,
    chargeRequirement: 4,
    diceDistribution: {},
    skills: [
      {
        skillId: 'wuxiang_wanxiangjumie',
        name: '万象俱灭',
        type: '充能；必杀',
        description:
          '充能：弃置任意玩家的1个能力骰，并使该玩家回复3点生命。；必杀：只有当双方的合计6个区域中1点、2点、3点、4点、5点、6点的能力骰至少各有1个时才能启动。从双方的合计6个区域中选择1点、2点、3点、4点、5点、6点的能力骰各1个，将选择的能力骰保留，弃置其余的全部能力骰。之后，造成以此法弃置的每种点数总和的真实伤害（每种点数最多参与加总1次）。',
      },
    ],
    imageKey: 'miyun-wuxiang',
  },

  /* ═══════════════════════════════════════════════════════════
   * 尼萨（荒野行者）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'chenai',
    name: '尘哀',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 4,
    will: 7,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'chenai_chenqi',
        name: '尘起',
        type: '触发',
        description:
          '当你在自己的回合中通过攻击造成伤害后。你可以立即进行1次无需使用冥想骰的额外"尘起行动"。本技能每回合最多触发1次。',
      },
      {
        skillId: 'chenai_manwangzhiya',
        name: '蛮王之牙',
        type: '启动',
        description:
          '消耗X个种类各不相同的能力骰。你从以下两项中选择X项执行（可以重复选择同一项）：①弃置对方的1个防御骰。②你获得1个+1点的攻击骰。选择后，刷新本技能的启动次数，并将本神器的激活标记移动至另一侧。',
      },
    ],
    imageKey: 'nisa-chenai',
  },
  {
    id: 'shouhun',
    name: '兽魂',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      2: 'defense',
      3: ['attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'shouhun_xiongzhixin',
        name: '熊之心',
        type: '激活；持续',
        description:
          '激活：将本神器的计数重设为2。；持续：你的攻击伤害+X，X为本神器叠加的计数。当你将要受到对方攻击的伤害，且本神器有至少1点计数时，对方可以取消该伤害，然后令本神器的计数下降1点。',
      },
      {
        skillId: 'shouhun_langzhixue',
        name: '狼之血',
        type: '激活；持续',
        description:
          '激活：将本神器的计数重设为2。；持续：你的速度+X，X为本神器叠加的计数。当你将要受到对方攻击的伤害，且本神器有至少1点计数时，对方可以取消该伤害，然后令本神器的计数下降1点。',
      },
    ],
    imageKey: 'nisa-shouhun',
  },
  {
    id: 'jueyi',
    name: '决意',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 50,
    chargeRequirement: 7,
    diceDistribution: {},
    skills: [
      {
        skillId: 'jueyi_yehuoliaoyuan',
        name: '野火燎原',
        type: '激活；持续；充能',
        description:
          '激活：你受到8点真实伤害，本神器计数+1。；持续：你能对已激活的本神器继续充能，并改为使本神器计数+1（最高叠加至5层），然后回复等同于本神器计数的生命。此外，根据本神器叠加的计数，你获得以下持续效果：1+：你的攻击伤害+1；3+：你的速度+1；5：当你的攻击被抵挡时，仍然造成一半的伤害（向下取整）。',
      },
    ],
    imageKey: 'nisa-jueyi',
  },

  /* ═══════════════════════════════════════════════════════════
   * 佐雷（轰鸣审判官）
   * ═══════════════════════════════════════════════════════════ */
  {
    id: 'minglei',
    name: '鸣雷',
    column: 0,
    source: 'builtin',
    version: 1,
    speed: 3,
    will: 9,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {},
    skills: [
      {
        skillId: 'minglei_dianxing',
        name: '电刑',
        type: '触发',
        description:
          '当你使用1个攻击骰后。你可以消耗2个冥想骰，视为以[2][3][4]点依次进行一次攻击。',
      },
      {
        skillId: 'minglei_leibao',
        name: '雷暴',
        type: '触发；持续',
        description:
          '触发：当你的攻击被抵挡后。你可以将你的最多2个冥想骰移动至你的攻击骰区，并保留其原本的点数。；持续：当对方的重掷阶段结束时，插入一个你的重掷阶段。',
      },
    ],
    imageKey: 'zuolei-minglei',
  },
  {
    id: 'chengjie',
    name: '惩戒',
    column: 1,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 0,
    chargeRequirement: 0,
    diceDistribution: {
      1: 'defense',
      2: ['attack', 'meditation'],
      3: 'defense',
      4: ['attack', 'meditation'],
    },
    skills: [
      {
        skillId: 'chengjie_jinghua',
        name: '净化',
        type: '激活',
        description:
          '将对方的最多2个[1]点能力骰变更为[3]，并将其移动至对方对应点数的区域。如果对方有至少1个能力骰变更，你获得2个随机点数的冥想骰，然后受到2点真实伤害。',
      },
      {
        skillId: 'chengjie_shuzuibingfa',
        name: '数罪并罚',
        type: '激活',
        description:
          '将你的最多2个[2]点能力骰变更为[4]，并将其移动至你对应点数的区域。如果你有至少1个能力骰变更，你获得2个随机点数的冥想骰，然后受到2点真实伤害。',
      },
    ],
    imageKey: 'zuolei-chengjie',
  },
  {
    id: 'canxiang',
    name: '残响',
    column: 2,
    source: 'builtin',
    version: 1,
    speed: 0,
    will: 0,
    life: 50,
    chargeRequirement: 2,
    diceDistribution: {},
    skills: [
      {
        skillId: 'canxiang_juejingtianshen',
        name: '绝境天神',
        type: '持续；必杀',
        description:
          '持续：你的意志+1。你的攻击伤害+X，X为本神器叠加的计数。每当你的回合结束时，本神器的计数下降1点（最低降为0）。；必杀：你的当前生命每比初始生命低10点，本神器便计数+1（向下取整，且最高叠加至4层）。',
      },
    ],
    imageKey: 'zuolei-canxiang',
  },
];
