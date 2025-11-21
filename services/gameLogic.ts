import { MoveType, RobotState, TurnResult, EnemyTrait, CharacterType } from '../types';
import { TRAITS_EASY, TRAITS_MEDIUM, TRAITS_HARD, TRAITS_BOSS, MOVE_COSTS } from '../constants';

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

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
    traits: [trait]
  };
};

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
      return attackerLaserDmg;
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

export const resolveTurn = (
  player: RobotState,
  enemy: RobotState,
  roundCount: number
): TurnResult => {
  const playerMove = player.currentMove;
  const enemyMove = enemy.currentMove;
  
  const enemyTrait = enemy.traits?.[0];
  const playerUpgrades = player.upgrades || [];
  
  const isIndustrialBonus = (player.type === CharacterType.INDUSTRIAL && (roundCount % 3 === 0));
  const playerHasBonusShield = isIndustrialBonus;
  const playerDelayedDamage = player.delayedAttackDamage || 0;
  const hasActiveDefUpgrade = playerUpgrades.some(u => u.id === 'ACTIVE_DEF');

  // Trait Flags
  const enemyReflects = enemyTrait?.reflectsDamage || false;
  let enemyInvincible = enemyTrait?.isInvincibleOddTurns && (roundCount % 2 !== 0);
  const enemyLaserDmg = enemyTrait?.laserDamageOverride || (enemyTrait?.punishCharge && playerMove === MoveType.CHARGE ? 2 : 1);
  const enemyImmuneLaser = enemyTrait?.immuneToLaser || false;
  const enemySteals = enemyTrait?.stealsEnergy || false;
  const enemyRegens = enemyTrait?.regenerates || false;
  
  // Boss Firewall: Permanent field, but overloaded every 3rd turn
  let enemyHasPermField = false;
  if (enemyTrait?.periodicInvincibleField) {
      if (roundCount % 3 === 0) {
          // Overload! Vulnerable
      } else {
          enemyHasPermField = true;
          enemyInvincible = false; // Handled by "HasPermField" logic blocks
      }
  }

  let playerDmg = 0;
  let enemyDmg = 0;
  let playerEnergyChange = 0;
  let enemyEnergyChange = 0;
  let enemyHeal = 0;
  let messages: string[] = [];

  if (enemyInvincible) messages.push("警告：BOSS处于无敌状态！");
  if (enemyHasPermField) messages.push("敌方开启了最终防线力场！");
  if (enemyTrait?.periodicInvincibleField && roundCount % 3 === 0) messages.push("敌方力场过载！防御失效！");

  // Clash Check
  let mainAttackClash = false;
  if (playerMove === enemyMove && (playerMove === MoveType.LASER || playerMove === MoveType.DESTROY)) {
    mainAttackClash = true;
    messages.push("双方主武器火力相互抵消！");
    
    // Kinetic Recycler Upgrade
    if (playerUpgrades.some(u => u.gainEnergyOnClash)) {
        playerEnergyChange += 1;
        messages.push("动能回收：获得1点能量");
    }
  }

  // --- PLAYER vs ENEMY ---
  if (!mainAttackClash) {
    let dmg = 0;
    
    // Laser
    if (playerMove === MoveType.LASER) {
      // Critical Logic
      let baseDmg = 1;
      const critChance = playerUpgrades.find(u => u.criticalLaserChance)?.criticalLaserChance || 0;
      if (critChance > 0 && Math.random() < critChance) {
          baseDmg = 2;
      }

      // Firewall Logic: Equivalent to having FIELD
      const effectiveEnemyMove = enemyHasPermField ? MoveType.FIELD : enemyMove;
      
      dmg = calculateInteraction(MoveType.LASER, effectiveEnemyMove, false, baseDmg);
      
      if (enemyImmuneLaser && dmg > 0) {
          dmg = 0;
          messages.push("敌方重型装甲免疫了激光伤害！");
      } else if (dmg === 0 && enemyReflects) {
        if (enemyMove === MoveType.SHIELD) { playerDmg += 1; messages.push("敌方护盾反弹伤害！(-1HP)"); }
        else if (enemyMove === MoveType.FIELD) { playerDmg += 3; messages.push("敌方力场反弹伤害！(-3HP)"); }
      } else if (dmg > 0) {
        if (baseDmg === 2) messages.push("暴击！");
        messages.push(baseDmg === 2 ? "你的激光造成双倍伤害！" : "你的激光命中敌方！");
      } else {
        messages.push("敌方防御了你的激光！");
      }
    } 
    // Destroy
    else if (playerMove === MoveType.DESTROY) {
      const effectiveEnemyMove = enemyHasPermField ? MoveType.FIELD : enemyMove;
      dmg = calculateInteraction(MoveType.DESTROY, effectiveEnemyMove, false);

      if (dmg === 0 && enemyReflects && effectiveEnemyMove === MoveType.FIELD) {
        playerDmg += 3;
        messages.push("敌方力场反弹毁灭射线！(-3HP)");
      } else if (dmg >= 5) {
        messages.push("毁灭射线造成重创！(5点伤害)");
      } else if (dmg === 2) {
        messages.push("毁灭射线贯穿护盾！(2点伤害)");
      } else {
        messages.push("毁灭射线被抵消或防御！");
      }
      
      // Vampiric Beam
      if (dmg > 0 && playerUpgrades.some(u => u.destroyHeals)) {
          playerDmg -= 1; // "Heal" by reducing damage taken, effectively, or we need a way to heal. 
          // TurnResult doesn't allow healing player directly easily except negative damage? 
          // Better to handle via energy or just reduce playerDmg if taken, or we need to add 'playerHeal' to result.
          // For simplicity: We can't easily add HP here without updating types everywhere, let's hack it as negative dmg if playerDmg > 0, OR log it and handle in Game.tsx?
          // Wait, Game.tsx does: let newPlayerHP = player.hp - result.playerDmg;
          // So playerDmg = -1 means heal 1.
          playerDmg -= 2; // Heal 2
          messages.push("吸血光束汲取了生命！(+2HP)");
      }
    }

    if (!enemyInvincible) {
        enemyDmg += dmg;
    }
  }

  // --- PHANTOM ATTACK ---
  if (playerDelayedDamage > 0) {
    const effectiveEnemyMove = enemyHasPermField ? MoveType.FIELD : enemyMove;
    const phantomDmg = calculateInteraction(MoveType.LASER, effectiveEnemyMove, false);
    if (phantomDmg > 0) {
      if (!enemyInvincible && !enemyImmuneLaser) {
        enemyDmg += phantomDmg;
        messages.push("后续激光命中！");
      } else {
        messages.push("后续激光无效！");
      }
    } else {
        if (enemyReflects && (effectiveEnemyMove === MoveType.SHIELD || effectiveEnemyMove === MoveType.FIELD)) {
             playerDmg += (effectiveEnemyMove === MoveType.SHIELD ? 1 : 3);
             messages.push("后续激光被反弹！");
        }
    }
  }

  // --- ENEMY vs PLAYER ---
  const effectivePlayerDefense = playerHasBonusShield;

  if (!mainAttackClash) {
    if (enemyMove === MoveType.LASER) {
      if (playerMove === MoveType.SHIELD || playerMove === MoveType.FIELD || effectivePlayerDefense) {
        messages.push("你防御了敌方激光！");
        // Siphon Upgrade
        if (playerUpgrades.some(u => u.shieldAbsorbs)) {
            playerEnergyChange += 1;
            messages.push("能量虹吸：吸收能量！(+1EN)");
        }
        if (hasActiveDefUpgrade && (playerMove === MoveType.SHIELD || effectivePlayerDefense)) {
            if (!enemyInvincible && !enemyHasPermField) {
                enemyDmg += 1;
                messages.push("你的护盾反弹了伤害！");
            }
        }
      } else if (playerMove === MoveType.LASER || playerMove === MoveType.DESTROY || playerMove === MoveType.CHARGE) {
        // Lucky Coating
        const dodgeChance = playerUpgrades.find(u => u.chanceToDodgeLaser)?.chanceToDodgeLaser || 0;
        if (Math.random() < dodgeChance) {
             messages.push("幸运涂层闪避了激光伤害！");
        } else {
             playerDmg += enemyLaserDmg;
             messages.push(`敌方激光命中！(-${enemyLaserDmg}HP)`);
             // Energy Leech
             if (enemySteals) {
                 playerEnergyChange -= 1;
                 enemyEnergyChange += 1;
                 messages.push("能量被窃取！(EN -1)");
             }
        }
      }
    } else if (enemyMove === MoveType.DESTROY) {
      if (playerMove === MoveType.FIELD || playerMove === MoveType.DESTROY) {
        messages.push("敌方毁灭射线无效化！");
         // Siphon Upgrade (Field works vs Destroy)
         if (playerMove === MoveType.FIELD && playerUpgrades.some(u => u.shieldAbsorbs)) {
            playerEnergyChange += 1;
            messages.push("能量虹吸：吸收能量！(+1EN)");
        }
      } else if (playerMove === MoveType.SHIELD || effectivePlayerDefense) {
        playerDmg += 2;
        messages.push("敌方毁灭射线贯穿护盾！(2点伤害)");
      } else {
        playerDmg += 5;
        messages.push("敌方毁灭射线直击！(5点伤害)");
      }
    }
  }

  // --- TRAIT: REGENERATOR ---
  if (enemyRegens && enemyDmg === 0 && enemy.hp < enemy.maxHp) {
      enemyHeal = 1;
      messages.push("敌方再生核心启动，恢复生命！(+1HP)");
  }

  // --- TRAIT: UNSTABLE REACTOR ---
  if (enemyTrait?.randomDestroySelfDmg && enemyMove === MoveType.DESTROY) {
      enemyDmg += 1;
      messages.push("敌方反应堆过热自损！(-1HP)");
  }

  return {
    playerDmg,
    enemyDmg,
    message: messages.join(' '),
    playerEnergyChange,
    enemyEnergyChange,
    enemyHeal
  };
};

export const getEnemyMove = (
    enemyState: RobotState, 
    playerState: RobotState, 
    levelOrScore: number,
    playerPreviousMove: MoveType = MoveType.NONE
): MoveType => {
  const eEnergy = Math.floor(enemyState.energy);
  const pEnergy = Math.floor(playerState.energy);
  const trait = enemyState.traits?.[0];

  // Low Energy Priority
  if (eEnergy < 1) {
      if (Math.random() < 0.9) return MoveType.CHARGE;
  }

  // --- T3: MIMIC ---
  if (trait?.mimicPlayer) {
      // First turn random, else copy
      if (playerPreviousMove !== MoveType.NONE) {
          // Check if has energy to copy
          const cost = MOVE_COSTS[playerPreviousMove];
          if (eEnergy >= cost) return playerPreviousMove;
          return MoveType.CHARGE; // Fallback
      }
  }

  // --- T3: UNSTABLE REACTOR ---
  if (trait?.randomDestroySelfDmg) {
      // 50% chance to destroy if alive
      if (Math.random() < 0.5) return MoveType.DESTROY; 
      // Else normal AI
  }

  // --- BOSS: TACTICAL AI ---
  if (trait?.cheats) {
      if (Math.random() < 0.3) {
          // Counter player's current move (Passed in PlayerState ideally, but here we predict or cheat)
          // Since we don't pass current move, we can simulate "prediction" or just use standard logic
          // Let's make it smart based on Player Energy:
          if (pEnergy >= 5) return MoveType.FIELD; // Expect Destroy
          if (pEnergy < 1) return MoveType.LASER; // Punish Charge
      }
  }

  const canShield = !trait?.cantUseShield && !trait?.onlyChargeAndDestroy && !trait?.isInvincibleOddTurns && !trait?.periodicInvincibleField;
  const canLaser = !trait?.cantUseLaser && !trait?.onlyChargeAndDestroy && !trait?.periodicInvincibleField;
  const canField = !trait?.cantUseField && !trait?.onlyChargeAndDestroy && !trait?.periodicInvincibleField;
  
  const destroyCost = trait?.destroyCostOverride ?? 5;
  const fieldCost = trait?.fieldCostOverride ?? 3;

  // Special: Quick Draw
  if (trait?.laserIsFree && canLaser) {
      if (Math.random() < 0.7) return MoveType.LASER;
  }

  // Standard AI Logic
  if (trait?.onlyChargeAndDestroy) {
      if (eEnergy >= destroyCost) return MoveType.DESTROY;
      return MoveType.CHARGE;
  }

  if (trait?.forceMultiAttack) {
      if (eEnergy >= destroyCost && Math.random() > 0.5) return MoveType.DESTROY;
      if (eEnergy >= 1) return MoveType.LASER;
      return MoveType.CHARGE;
  }

  if (trait?.id === 'DEATH_STAR') {
      if (eEnergy >= destroyCost) return MoveType.DESTROY;
      return MoveType.CHARGE;
  }

  if (trait?.id === 'BERSERKER') {
      if (eEnergy >= destroyCost) return MoveType.DESTROY;
      if (eEnergy >= 1 && Math.random() < 0.8) return MoveType.LASER;
      return MoveType.CHARGE;
  }

  if (eEnergy >= destroyCost) {
    if (pEnergy >= 3 && Math.random() < 0.3) return MoveType.CHARGE; 
    return MoveType.DESTROY;
  }

  if (pEnergy >= 5) {
    if (canField && eEnergy >= fieldCost && Math.random() > 0.1) return MoveType.FIELD;
    if (eEnergy >= destroyCost) return MoveType.DESTROY; 
    if (canShield && enemyState.hp > 2) return MoveType.SHIELD;
  }

  const availableMoves: MoveType[] = [MoveType.CHARGE];
  if (canLaser && (eEnergy >= 1 || trait?.laserIsFree)) availableMoves.push(MoveType.LASER);
  if (canShield) availableMoves.push(MoveType.SHIELD);

  if (trait?.id === 'LOW_POWER' && Math.random() < 0.6) return MoveType.CHARGE;

  if (Math.random() < 0.5) return MoveType.CHARGE;
  return availableMoves[Math.floor(Math.random() * availableMoves.length)];
};