export enum MoveType {
  CHARGE = 'CHARGE',         // 充能 (+1 Energy)
  LASER = 'LASER',           // 激光攻击 (-1 Energy)
  SHIELD = 'SHIELD',         // 防护罩 (0 Energy)
  DESTROY = 'DESTROY',       // 毁灭射线 (-5 Energy)
  FIELD = 'FIELD',           // 防御力场 (-3 Energy)
  NONE = 'NONE'              // Waiting state
}

export enum CharacterType {
  PROTOTYPE = 'PROTOTYPE',
  INDUSTRIAL = 'INDUSTRIAL',
  MILITARY = 'MILITARY',
  MODEL_J = 'MODEL_J'
}

export enum GameMode {
  CAMPAIGN = 'CAMPAIGN', // 闯关
  ENDLESS = 'ENDLESS'    // 无尽
}

export interface CharacterConfig {
  id: CharacterType;
  name: string;
  description: string;
  maxHp: number;
  initialEnergy: number;
}

export interface EnemyTrait {
  id: string;
  name: string;
  description: string;
  hpRange: [number, number];
  
  // Restrictions
  cantUseShield?: boolean;
  cantUseLaser?: boolean;
  cantUseField?: boolean;
  onlyChargeAndDestroy?: boolean;
  
  // Overrides
  destroyCostOverride?: number;
  fieldCostOverride?: number;
  laserDamageOverride?: number;
  chargeAmountOverride?: number;
  startEnergy?: number;
  
  // Mechanics
  multiShot?: boolean;             // Modified/Veteran
  forceMultiAttack?: boolean;      // Out of Control
  reflectsDamage?: boolean;        // Spiked
  isInvincibleOddTurns?: boolean;  // Invincible Boss
  
  // New Mechanics (T1-T3)
  immuneToLaser?: boolean;         // Heavy Plating
  laserIsFree?: boolean;           // Quick Draw
  punishCharge?: boolean;          // Charge Punisher (Dmg boost vs charge)
  blocksConsecutiveMoves?: boolean;// Jammer
  stealsEnergy?: boolean;          // Energy Leech
  regenerates?: boolean;           // Regenerator
  randomDestroySelfDmg?: boolean;  // Unstable Reactor
  mimicPlayer?: boolean;           // Mimic
  
  // New Boss Mechanics
  periodicInvincibleField?: boolean; // Firewall
  cheats?: boolean;                  // Tactical AI (Reads input)
}

export interface PlayerUpgrade {
  id: string;
  name: string;
  description: string;
  maxHpBonus?: number;
  healOnPickup?: number;
  energyOnPickup?: number;
  shieldReflect?: boolean;
  upgradeLaserToMulti?: boolean;
  passiveEnergyRegen?: number;
  costReduction?: boolean;
  
  // New Mechanics
  healOnKill?: boolean;        // Nano Repair
  shieldAbsorbs?: boolean;     // Energy Siphon (Not fully implemented yet, let's simplify)
  destroyHeals?: boolean;      // Vampiric Beam
  chanceToDodgeLaser?: number; // Lucky Coating
  
  // Boss Drop Mechanics
  criticalLaserChance?: number;// Critical Module
  gainEnergyOnClash?: boolean; // Kinetic Recycler
  chargeBonus?: number;        // Fusion Core
}

export interface RobotState {
  id: 'player' | 'enemy';
  type: CharacterType | string;
  hp: number;
  maxHp: number;
  energy: number;
  currentMove: MoveType;
  isDead: boolean;
  delayedAttackDamage?: number;
  traits?: EnemyTrait[];
  upgrades?: PlayerUpgrade[];
}

export enum GameState {
  MENU = 'MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  PLAYING = 'PLAYING',
  UPGRADE_SELECT = 'UPGRADE_SELECT',
  GAME_OVER = 'GAME_OVER',
  EXIT = 'EXIT'
}

export enum TurnPhase {
  WAITING = 'WAITING',
  RESOLVING = 'RESOLVING',
  RESULT = 'RESULT'
}

export interface TurnResult {
  playerDmg: number;
  enemyDmg: number;
  message: string;
  playerEnergyChange?: number;
  enemyEnergyChange?: number;
  enemyHeal?: number;
}