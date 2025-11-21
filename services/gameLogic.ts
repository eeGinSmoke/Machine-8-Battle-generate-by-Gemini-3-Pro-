import { MoveType, RobotState, TurnResult, EnemyTrait, CharacterType, PlayerUpgrade } from '../types';
import { TRAITS_EASY, TRAITS_MEDIUM, TRAITS_HARD, TRAITS_BOSS, MOVE_COSTS } from '../constants';

/**
 * Helper to get random int between min and max (inclusive)
 */
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generates an enemy for Endless Mode based on current score.
 */
export const generateEndlessEnemy = (score: number): RobotState => {
  let pool: EnemyTrait[] = TRAITS_EASY;
  let isBoss = false;

  if (score > 0 && score % 10 === 0) {
    pool = TRAITS_BOSS;
    isBoss = true;
  } else if (score >= 20) {
    pool = Math.random() > 0.4 ? TRAITS_HARD : TRAITS_MEDIUM;
  } else if (score >= 10) {
    pool = Math.random() > 0.3 ? TRAITS_MEDIUM : TRAITS_EASY;
  }

  const trait = pool[Math.floor(Math.random() * pool.length)];
  const hp = randomInt(trait.hpRange[0], trait.hpRange[1]);

  return {
    id: 'enemy',
    type: isBoss ? `BOSS: ${trait.name}` : trait.name,
    hp: hp,
    maxHp: hp,
    energy: trait.startEnergy || 0,
    currentMove: MoveType.NONE,
    isDead: false,
    traits: [trait] // Store trait for logic
  };
};

/**
 * Calculates damage for a single interaction. 
 */
const calculateInteraction = (
  attackerMove: MoveType, 
  defenderMove: MoveType, 
  defenderHasBonusShield: boolean,
  attackerLaserDmg: number = 1
): number => {
  if (attackerMove === MoveType.LASER) {
    if (defenderMove === MoveType.SHIELD || defenderMove === MoveType.FIELD || defenderHasBonusShield) {
      return 0; // Blocked
    }
    if (defenderMove === MoveType.LASER || defenderMove === MoveType.DESTROY || defenderMove === MoveType.CHARGE) {
      return attackerLaserDmg; // Hit (Standard 1, Boss maybe 2)
    }
  }

  if (attackerMove === MoveType.DESTROY) {
    if (defenderMove === MoveType.FIELD || defenderMove === MoveType.DESTROY) {
      return 0; // Countered
    }
    if (defenderMove === MoveType.SHIELD || defenderHasBonusShield) {
      return 2; // Pierced shield
    }
    return 5; // Direct hit
  }

  return 0;
};

/**
 * Resolves the turn with complex character mechanics and traits.
 */
export const resolveTurn = (
  player: RobotState,
  enemy: RobotState,
  roundCount: number
): TurnResult => {
  const playerMove = player.currentMove;
  const enemyMove = enemy.currentMove;
  
  // Extract Traits / Upgrades
  const enemyTrait = enemy.traits?.[0];
  const playerUpgrades = player.upgrades || [];
  
  // Player Status
  const isIndustrialBonus = (player.type === CharacterType.INDUSTRIAL && (roundCount % 3 === 0));
  const playerHasBonusShield = isIndustrialBonus;
  const playerDelayedDamage = player.delayedAttackDamage || 0;
  const hasActiveDefUpgrade = playerUpgrades.some(u => u.id === 'ACTIVE_DEF');

  // Enemy Status
  const enemyReflects = enemyTrait?.reflectsDamage || false;
  const enemyInvincible = enemyTrait?.isInvincibleOddTurns && (roundCount % 2 !== 0);
  const enemyLaserDmg = enemyTrait?.laserDamageOverride || 1;

  let playerDmg = 0;
  let enemyDmg = 0;
  let messages: string[] = [];

  if (enemyInvincible) {
    messages.push("警告：BOSS处于无敌状态！所有攻击无效！");
  }

  // --- 1. CLASH CHECK (Main Attacks) ---
  // If both use the same attack, they cancel out. 
  let mainAttackClash = false;
  if (playerMove === enemyMove && (playerMove === MoveType.LASER || playerMove === MoveType.DESTROY)) {
    mainAttackClash = true;
    messages.push("双方主武器火力相互抵消！");
  }

  // --- 2. PLAYER MAIN ATTACK vs ENEMY ---
  if (!mainAttackClash) {
    let dmg = 0;
    if (playerMove === MoveType.LASER) {
      dmg = calculateInteraction(MoveType.LASER, enemyMove, false);
      
      // Handle Spike Trait (Reflect)
      if (dmg === 0 && enemyReflects) {
        if (enemyMove === MoveType.SHIELD) {
            playerDmg += 1; 
            messages.push("敌方带刺护盾反弹了伤害！(-1HP)");
        } else if (enemyMove === MoveType.FIELD) {
            playerDmg += 3;
            messages.push("敌方带刺力场强烈反震！(-3HP)");
        }
      } else if (dmg > 0) {
        messages.push("你的激光命中敌方！");
      } else {
        messages.push("敌方防御了你的激光！");
      }
    } else if (playerMove === MoveType.DESTROY) {
      dmg = calculateInteraction(MoveType.DESTROY, enemyMove, false);
      
      if (dmg === 0 && enemyReflects && enemyMove === MoveType.FIELD) {
        // Field blocks Destroy usually, Spiked reflects? 
        // Rule says: "Field reflects 3". Destroy is blocked by field. So reflect logic applies.
        playerDmg += 3;
        messages.push("敌方力场反弹了毁灭射线的余波！(-3HP)");
      } else if (dmg >= 5) {
        messages.push("毁灭射线直击！造成重创！(5点伤害)");
      } else if (dmg === 2) {
        messages.push("毁灭射线贯穿了敌方护盾！(2点伤害)");
        // Shield reflect (1 dmg) logic? 
        // Destroy pierces shield. It's a hit (partial). 
        // Let's say no reflect if pierced, or standard reflect? 
        // Simplification: If pierced, shield failed, no reflect.
      } else {
        messages.push("毁灭射线被抵消或防御！");
      }
    }

    if (!enemyInvincible) {
        enemyDmg += dmg;
    }
  }

  // --- 3. MILITARY/UPGRADE PASSIVE: DELAYED ATTACK (Phantom Laser) ---
  if (playerDelayedDamage > 0) {
    const phantomDmg = calculateInteraction(MoveType.LASER, enemyMove, false);
    if (phantomDmg > 0) {
      if (!enemyInvincible) {
        enemyDmg += phantomDmg;
        messages.push("后续激光命中敌方！(无法被抵消)");
      } else {
        messages.push("后续激光被无敌护盾挡下！");
      }
    } else {
        if (enemyReflects && (enemyMove === MoveType.SHIELD || enemyMove === MoveType.FIELD)) {
             // Reflect logic for phantom?
             // Let's keep it simple: Phantom laser gets reflected too.
             playerDmg += (enemyMove === MoveType.SHIELD ? 1 : 3);
             messages.push("后续激光被反弹！");
        } else {
             messages.push("敌方挡住了后续激光！");
        }
    }
  }

  // --- 4. ENEMY ATTACK vs PLAYER ---
  const effectivePlayerDefense = playerHasBonusShield ? true : false;

  if (!mainAttackClash) {
    if (enemyMove === MoveType.LASER) {
      // Check explicit block
      if (playerMove === MoveType.SHIELD || playerMove === MoveType.FIELD || effectivePlayerDefense) {
        messages.push("你防御了敌方激光！");
        // Player Active Defense Upgrade
        if (hasActiveDefUpgrade && (playerMove === MoveType.SHIELD || effectivePlayerDefense)) {
            if (!enemyInvincible) {
                enemyDmg += 1;
                messages.push("你的超级主动防御反弹了伤害！");
            }
        }
      } else if (playerMove === MoveType.LASER || playerMove === MoveType.DESTROY || playerMove === MoveType.CHARGE) {
        playerDmg += enemyLaserDmg;
        messages.push(`敌方激光命中了你！(-${enemyLaserDmg}HP)`);
      }
    } else if (enemyMove === MoveType.DESTROY) {
      if (playerMove === MoveType.FIELD || playerMove === MoveType.DESTROY) {
        messages.push("敌方毁灭射线无效化！");
      } else if (playerMove === MoveType.SHIELD || effectivePlayerDefense) {
        playerDmg += 2;
        messages.push("敌方毁灭射线贯穿你的护盾！(2点伤害)");
      } else {
        playerDmg += 5;
        messages.push("敌方毁灭射线直击！你受到了重创！(5点伤害)");
      }
    }
  }

  return {
    playerDmg,
    enemyDmg,
    message: messages.join(' '),
  };
};

/**
 * AI Logic with Traits
 */
export const getEnemyMove = (enemyState: RobotState, playerState: RobotState, levelOrScore: number): MoveType => {
  const eEnergy = Math.floor(enemyState.energy);
  const pEnergy = Math.floor(playerState.energy);
  const trait = enemyState.traits?.[0];

  // --- Optimization: Low Energy Priority ---
  // If energy is 0, bias heavily towards CHARGE to prevent stalling or stupid moves
  if (eEnergy < 1) {
      // Some traits might start with energy (Out of Control), but if they hit 0, they must charge.
      // Death Star auto-charges but might need manual boost.
      // Unless trait restricts it?
      if (Math.random() < 0.9) return MoveType.CHARGE;
  }

  const canShield = !trait?.cantUseShield && !trait?.onlyChargeAndDestroy && !trait?.isInvincibleOddTurns;
  const canLaser = !trait?.cantUseLaser && !trait?.onlyChargeAndDestroy;
  const canField = !trait?.cantUseField && !trait?.onlyChargeAndDestroy;
  
  const destroyCost = trait?.destroyCostOverride ?? 5;
  const fieldCost = trait?.fieldCostOverride ?? 3;

  // Trait Specific Logic

  // 1. Exploder: Only Charge or Destroy
  if (trait?.onlyChargeAndDestroy) {
      if (eEnergy >= destroyCost) return MoveType.DESTROY;
      return MoveType.CHARGE;
  }

  // 2. Out of Control: Force Multi Attack (Laser usually)
  if (trait?.forceMultiAttack) {
      // If has energy for laser, shoot. If high energy, destroy?
      // "Attack becomes multi-attack" usually implies Laser.
      if (eEnergy >= destroyCost && Math.random() > 0.5) return MoveType.DESTROY;
      if (eEnergy >= 1) return MoveType.LASER;
      return MoveType.CHARGE;
  }

  // 3. Death Star
  if (trait?.id === 'DEATH_STAR') {
      if (eEnergy >= destroyCost) return MoveType.DESTROY;
      return MoveType.CHARGE;
  }

  // General Logic tailored by traits
  // Berserker (No Shield)
  if (trait?.id === 'BERSERKER') {
      if (eEnergy >= destroyCost) return MoveType.DESTROY;
      if (eEnergy >= 1 && Math.random() < 0.8) return MoveType.LASER; // Aggressive
      return MoveType.CHARGE;
  }

  // Standard logic fallback
  // Kill / Heavy Damage
  if (eEnergy >= destroyCost) {
    if (pEnergy >= 3 && Math.random() < 0.3) return MoveType.CHARGE; // Bait
    return MoveType.DESTROY;
  }

  // Survival
  if (pEnergy >= 5) {
    if (canField && eEnergy >= fieldCost && Math.random() > 0.1) return MoveType.FIELD;
    if (eEnergy >= destroyCost) return MoveType.DESTROY; // Counter
    if (canShield && enemyState.hp > 2) return MoveType.SHIELD;
  }

  const availableMoves: MoveType[] = [MoveType.CHARGE];
  if (canLaser && eEnergy >= 1) availableMoves.push(MoveType.LASER);
  if (canShield) availableMoves.push(MoveType.SHIELD);

  // Low Power trait favors charging
  if (trait?.id === 'LOW_POWER' && Math.random() < 0.6) return MoveType.CHARGE;

  if (Math.random() < 0.5) return MoveType.CHARGE;
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
};