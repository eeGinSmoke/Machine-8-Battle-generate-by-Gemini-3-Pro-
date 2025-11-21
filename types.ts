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
  // Logic flags
  hpRange: [number, number];
  cantUseShield?: boolean;
  cantUseLaser?: boolean;
  cantUseField?: boolean;
  onlyChargeAndDestroy?: boolean; // For "Exploder"
  multiShot?: boolean; // For "Modified" / "Veteran"
  destroyCostOverride?: number; // For "Exploder" / "Death Star"
  fieldCostOverride?: number; // For "Absolute Defense"
  reflectsDamage?: boolean; // For "Spiked"
  isInvincibleOddTurns?: boolean; // For "Invincible Boss"
  laserDamageOverride?: number; // For "Invincible Boss"
  chargeAmountOverride?: number; // For "Invincible Boss" / "Death Star"
  startEnergy?: number; // For "Out of Control"
  forceMultiAttack?: boolean; // For "Out of Control"
}

export interface PlayerUpgrade {
  id: string;
  name: string;
  description: string;
  // Effects
  maxHpBonus?: number;
  healOnPickup?: number;
  energyOnPickup?: number;
  shieldReflect?: boolean;
  upgradeLaserToMulti?: boolean;
  passiveEnergyRegen?: number;
  costReduction?: boolean; // Destroy/Field -1
}

export interface RobotState {
  id: 'player' | 'enemy';
  type: CharacterType | string; // String for endless enemy names
  hp: number;
  maxHp: number;
  energy: number;
  currentMove: MoveType;
  isDead: boolean;
  // Special statuses
  delayedAttackDamage?: number; // For Military Type's next turn attack
  // Endless Mode specific
  traits?: EnemyTrait[];
  upgrades?: PlayerUpgrade[];
}

export enum GameState {
  MENU = 'MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT',
  PLAYING = 'PLAYING',
  UPGRADE_SELECT = 'UPGRADE_SELECT', // New state for picking upgrades
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
}