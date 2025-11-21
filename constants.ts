import { CharacterConfig, CharacterType, MoveType, EnemyTrait, PlayerUpgrade } from './types';

export const INITIAL_ENERGY = 0;

// Base costs (modifications handled in logic)
export const MOVE_COSTS: Record<MoveType, number> = {
  [MoveType.CHARGE]: 0,
  [MoveType.LASER]: 1,
  [MoveType.SHIELD]: 0,
  [MoveType.DESTROY]: 5,
  [MoveType.FIELD]: 3,
  [MoveType.NONE]: 0,
};

export const MOVE_NAMES: Record<MoveType, string> = {
  [MoveType.CHARGE]: '充能',
  [MoveType.LASER]: '激光攻击',
  [MoveType.SHIELD]: '开启防护罩',
  [MoveType.DESTROY]: '毁灭射线',
  [MoveType.FIELD]: '防御力场',
  [MoveType.NONE]: '...',
};

export const CHARACTERS: Record<CharacterType, CharacterConfig> = {
  [CharacterType.PROTOTYPE]: {
    id: CharacterType.PROTOTYPE,
    name: "No.8 初代",
    description: "平衡型。拥有3点生命值，无特殊能力。",
    maxHp: 3,
    initialEnergy: 0
  },
  [CharacterType.INDUSTRIAL]: {
    id: CharacterType.INDUSTRIAL,
    name: "No.8 工业型",
    description: "生存型。1点生命值。每过两回合(第3,6...回合)，操作时自动附加防护罩效果。",
    maxHp: 1,
    initialEnergy: 0
  },
  [CharacterType.MILITARY]: {
    id: CharacterType.MILITARY,
    name: "No.8 军用型",
    description: "进攻型。5点生命值。多重射击(本回合与下回合各攻击一次)。后续激光无法被抵消。防护罩耗能变为1。",
    maxHp: 5,
    initialEnergy: 0
  },
  [CharacterType.MODEL_J]: {
    id: CharacterType.MODEL_J,
    name: "No.8 J型",
    description: "特种型。3点生命值。每回合自动充能+1。只能使用防御力场。禁用普通激光。毁灭射线耗能降低为3。",
    maxHp: 3,
    initialEnergy: 0
  }
};

export const LEVEL_CONFIGS = [
  { level: 1, hp: 3, name: "机出 (Machine Out)" },
  { level: 2, hp: 5, name: "机佬 (Machine Master)" },
  { level: 3, hp: 7, name: "机王 (Machine King)" },
];

export const WIN_MESSAGE = "经过激烈的战斗，最终八赢下了这场对决";
export const LOSE_MESSAGE = "你拼尽全力还是难以战胜机";

export const HOW_TO_PLAY_TEXT = [
  { title: "游戏模式", content: "闯关模式：击败3名固定的敌人获得胜利。无尽模式：击败无限生成的敌人，每10分遭遇Boss，击败Boss可获取强力升级。" },
  { title: "基本规则", content: "双方初始0能量。每回合同时选择一种行动。若双方使用相同攻击（激光对激光、毁灭对毁灭），则相互抵消，无人受伤。" },
  { title: "能量与消耗", content: "充能(+1 EN) | 激光(-1 EN) | 防护罩(0 EN) | 防御力场(-3 EN) | 毁灭射线(-5 EN)" },
  { title: "伤害判定", content: "激光命中：无防御则-1生命。被防护罩或力场格挡则无伤。" },
  { title: "毁灭射线", content: "命中：造成5点伤害。VS防护罩：对手-2生命。VS力场：无效。"},
  { title: "敌人特质", content: "无尽模式下敌人拥有各种特质（鼠标悬停查看）。Boss极其危险，请谨慎应对！"}
];

// --- ENDLESS MODE DATA ---

export const TRAITS_EASY: EnemyTrait[] = [
  { id: 'STEADY', name: '稳固', description: '偏向防御，血量适中', hpRange: [3, 5] },
  { id: 'AVERAGE', name: '平平无奇', description: '无特殊机制', hpRange: [2, 5] },
  { id: 'LOW_POWER', name: '电力不足', description: '偏向充能', hpRange: [2, 6] },
];

export const TRAITS_MEDIUM: EnemyTrait[] = [
  { id: 'BERSERKER', name: '暴力狂', description: '不会使用防护罩，极具攻击性', hpRange: [7, 9], cantUseShield: true },
  { id: 'MODIFIED', name: '改装款', description: '拥有多重射击技能', hpRange: [5, 7], multiShot: true },
  { id: 'EXPLODER', name: '和你爆了', description: '只能充能或毁灭，毁灭仅耗3能', hpRange: [2, 4], onlyChargeAndDestroy: true, destroyCostOverride: 3 },
  { id: 'ABS_DEFENSE', name: '绝对防御', description: '不能用防护罩，力场耗能仅为1', hpRange: [5, 8], cantUseShield: true, fieldCostOverride: 1 },
];

export const TRAITS_HARD: EnemyTrait[] = [
  { id: 'VETERAN', name: '老兵烧烤', description: '多重射击 + 4能毁灭射线', hpRange: [9, 12], multiShot: true, destroyCostOverride: 4 },
  { id: 'SPIKED', name: '带刺的', description: '防御成功反弹伤害(罩1/场3)', hpRange: [9, 11], reflectsDamage: true },
];

export const TRAITS_BOSS: EnemyTrait[] = [
  { id: 'INVINCIBLE', name: '无敌是多么机魔', description: '隔回合免疫伤害，激光伤害2，充能+2', hpRange: [15, 20], isInvincibleOddTurns: true, laserDamageOverride: 2, chargeAmountOverride: 2 },
  { id: 'OUT_OF_CONTROL', name: '失控型号', description: '无防御，多重攻击，初始10能', hpRange: [10, 15], cantUseShield: true, cantUseField: true, forceMultiAttack: true, startEnergy: 10 },
  { id: 'DEATH_STAR', name: '死星微缩模型', description: '毁灭耗能2，充能+0.5，无普攻/防御', hpRange: [9, 17], destroyCostOverride: 2, chargeAmountOverride: 0.5, cantUseLaser: true, cantUseShield: true, cantUseField: true },
];

export const PLAYER_UPGRADES: PlayerUpgrade[] = [
  { id: 'HARDENED', name: '硬化8体', description: '生命上限+3 并回复3点生命', maxHpBonus: 3, healOnPickup: 3 },
  { id: 'PREPARED', name: '做足准备', description: '获得15点能量', energyOnPickup: 15 },
  { id: 'ACTIVE_DEF', name: '超级主动防御', description: '防护罩防御成功时反弹1点伤害', shieldReflect: true },
  { id: 'WEAPON_MOD', name: '武器改装', description: '普通激光改为多重攻击', upgradeLaserToMulti: true },
  { id: 'OVERCLOCK', name: '超频', description: '每回合额外增加0.5点能量', passiveEnergyRegen: 0.5 },
  { id: 'UNDERCLOCK', name: '降频', description: '毁灭射线和力场耗能减少1点', costReduction: true },
];