import React, { useState, useEffect, useRef } from 'react';
import Robot from './Robot';
import { RobotState, MoveType, TurnPhase, CharacterType, GameMode, PlayerUpgrade } from '../types';
import { INITIAL_ENERGY, MOVE_COSTS, MOVE_NAMES, WIN_MESSAGE, LOSE_MESSAGE, CHARACTERS, LEVEL_CONFIGS, PLAYER_UPGRADES } from '../constants';
import { resolveTurn, getEnemyMove, generateEndlessEnemy } from '../services/gameLogic';

interface GameProps {
  characterType: CharacterType;
  gameMode: GameMode;
  onBackToMenu: () => void;
}

const RoundOverlay = ({ levelName, round, visible }: { levelName: string, round: number, visible: boolean }) => {
    if (!visible) return null;
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="animate-in zoom-in duration-300 fade-out slide-out-to-top-10 duration-1000 fill-mode-forwards flex flex-col items-center">
                <div className="text-6xl md:text-8xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 drop-shadow-[0_0_20px_rgba(34,211,238,0.8)] skew-x-[-10deg]">
                    ROUND {round}
                </div>
                <div className="text-xl text-yellow-400 font-bold tracking-[0.5em] mt-4 bg-black/50 px-4 py-1 rounded">
                    {levelName}
                </div>
            </div>
        </div>
    )
}

const UpgradeModal = ({ options, onSelect, onSkip }: { options: PlayerUpgrade[], onSelect: (u: PlayerUpgrade) => void, onSkip: () => void }) => {
    return (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300 px-4">
            <div className="max-w-5xl w-full">
                <h2 className="text-4xl font-black text-center text-yellow-400 mb-2">升级核心</h2>
                <p className="text-center text-gray-400 mb-8">检测到BOSS残骸，请选择一项技术进行融合</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {options.map(opt => (
                        <button 
                            key={opt.id} 
                            onClick={() => onSelect(opt)}
                            className="bg-gradient-to-b from-gray-800 to-gray-950 border border-white/20 p-6 rounded-xl hover:border-yellow-400 hover:scale-105 transition-all group text-left flex flex-col"
                        >
                            <h3 className="text-xl font-bold text-yellow-200 mb-2 group-hover:text-yellow-400">{opt.name}</h3>
                            <p className="text-sm text-gray-300 leading-relaxed">{opt.description}</p>
                        </button>
                    ))}
                </div>
                
                <div className="flex justify-center">
                    <button onClick={onSkip} className="text-gray-500 hover:text-white underline">跳过升级</button>
                </div>
            </div>
        </div>
    )
}

const Game: React.FC<GameProps> = ({ characterType, gameMode, onBackToMenu }) => {
  const charConfig = CHARACTERS[characterType];
  
  // Game State
  const [endlessScore, setEndlessScore] = useState(0);
  const [campaignIndex, setCampaignIndex] = useState(0);
  const [upgradeOptions, setUpgradeOptions] = useState<PlayerUpgrade[] | null>(null);
  
  const levelName = gameMode === GameMode.CAMPAIGN 
    ? LEVEL_CONFIGS[campaignIndex]?.name 
    : (endlessScore > 0 && endlessScore % 10 === 0 ? `BOSS STAGE (Score: ${endlessScore})` : `Endless Wave (Score: ${endlessScore})`);

  const [roundCount, setRoundCount] = useState(1);
  const [showRoundOverlay, setShowRoundOverlay] = useState(false);
  
  // Tooltip State
  const [showEnemyTooltip, setShowEnemyTooltip] = useState(false);
  const [showPlayerTooltip, setShowPlayerTooltip] = useState<PlayerUpgrade | null>(null);

  const [player, setPlayer] = useState<RobotState>({
    id: 'player',
    type: characterType,
    hp: charConfig.maxHp,
    maxHp: charConfig.maxHp,
    energy: charConfig.initialEnergy,
    currentMove: MoveType.NONE,
    isDead: false,
    delayedAttackDamage: 0,
    upgrades: []
  });

  const [enemy, setEnemy] = useState<RobotState>({
    id: 'enemy',
    type: 'INIT', // Placeholder
    hp: 1,
    maxHp: 1,
    energy: 0,
    currentMove: MoveType.NONE,
    isDead: false,
  });

  // Initialize Enemy on Mount
  useEffect(() => {
    if (gameMode === GameMode.CAMPAIGN) {
        const cfg = LEVEL_CONFIGS[0];
        setEnemy({
            id: 'enemy',
            type: 'ENEMY_V1',
            hp: cfg.hp,
            maxHp: cfg.hp,
            energy: 0,
            currentMove: MoveType.NONE,
            isDead: false
        });
    } else {
        setEnemy(generateEndlessEnemy(0));
    }
  }, [gameMode]);

  const [turnPhase, setTurnPhase] = useState<TurnPhase>(TurnPhase.WAITING);
  const [battleLog, setBattleLog] = useState<string[]>([`战斗开始！模式：${gameMode === GameMode.CAMPAIGN ? '闯关' : '无尽'}`]);
  const [endGameMessage, setEndGameMessage] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [battleLog]);

  // Round Start Animation
  useEffect(() => {
      if (turnPhase === TurnPhase.WAITING && !endGameMessage && !upgradeOptions) {
          setShowRoundOverlay(true);
          const t = setTimeout(() => setShowRoundOverlay(false), 2000);
          return () => clearTimeout(t);
      }
  }, [roundCount, campaignIndex, endlessScore, turnPhase, endGameMessage, upgradeOptions]);

  // Progression Logic
  const handleEnemyDefeated = () => {
      if (gameMode === GameMode.CAMPAIGN) {
          if (campaignIndex >= LEVEL_CONFIGS.length - 1) {
              setEndGameMessage(WIN_MESSAGE);
          } else {
              const nextIndex = campaignIndex + 1;
              setCampaignIndex(nextIndex);
              const nextLevel = LEVEL_CONFIGS[nextIndex];
              setBattleLog(prev => [...prev, `击败敌人！进入下一关：${nextLevel.name}`, `>> HP +1`]);
              
              setEnemy({
                  id: 'enemy',
                  type: nextIndex === 1 ? 'ENEMY_V2' : 'ENEMY_V3',
                  hp: nextLevel.hp,
                  maxHp: nextLevel.hp,
                  energy: 0,
                  currentMove: MoveType.NONE,
                  isDead: false
              });
              healPlayer(1);
              setRoundCount(1); // Reset Round
              setTurnPhase(TurnPhase.WAITING);
          }
      } else {
          // ENDLESS MODE
          const newScore = endlessScore + 1;
          setEndlessScore(newScore);
          setBattleLog(prev => [...prev, `敌人已歼灭！当前积分：${newScore}`, `>> HP +1`]);
          healPlayer(1);

          // Check for Boss Kill (Reward Upgrade)
          const isBossKill = enemy.type.includes('BOSS');

          if (isBossKill) {
              // Trigger Upgrade UI
              const validUpgrades = PLAYER_UPGRADES.filter(u => {
                  // Filter out invalid upgrades
                  if (u.id === 'WEAPON_MOD' && characterType === CharacterType.MODEL_J) return false; // J can't use laser
                  if (u.id === 'WEAPON_MOD' && characterType === CharacterType.MILITARY) return false; // Military already has multi
                  // Prevent duplicate unique passives? Most stack okay or are bools.
                  const hasIt = player.upgrades?.some(pu => pu.id === u.id);
                  if (hasIt && (u.shieldReflect || u.upgradeLaserToMulti || u.costReduction)) return false;
                  return true;
              });
              
              // Pick 3 random
              const shuffled = [...validUpgrades].sort(() => 0.5 - Math.random());
              setUpgradeOptions(shuffled.slice(0, 3));
          } else {
              startNextEndlessRound(newScore);
          }
      }
  };

  const startNextEndlessRound = (score: number) => {
      setEnemy(generateEndlessEnemy(score));
      setRoundCount(1); // Reset Round
      setTurnPhase(TurnPhase.WAITING);
  };

  const healPlayer = (amount: number) => {
      setPlayer(prev => ({
          ...prev,
          hp: Math.min(prev.hp + amount, prev.maxHp),
          currentMove: MoveType.NONE,
          delayedAttackDamage: 0
      }));
  };

  const handleUpgradeSelect = (upgrade: PlayerUpgrade) => {
      setPlayer(prev => {
          let newHp = prev.hp;
          let newMaxHp = prev.maxHp;
          let newEnergy = prev.energy;
          const newUpgrades = [...(prev.upgrades || []), upgrade];

          if (upgrade.maxHpBonus) newMaxHp += upgrade.maxHpBonus;
          if (upgrade.healOnPickup) newHp = Math.min(newHp + upgrade.healOnPickup, newMaxHp);
          if (upgrade.energyOnPickup) newEnergy += upgrade.energyOnPickup;

          return {
              ...prev,
              hp: newHp,
              maxHp: newMaxHp,
              energy: newEnergy,
              upgrades: newUpgrades
          };
      });
      setBattleLog(prev => [...prev, `>> 系统升级：${upgrade.name} 已安装！`]);
      setUpgradeOptions(null);
      startNextEndlessRound(endlessScore);
  };

  const handlePlayerAction = (move: MoveType) => {
    if (turnPhase !== TurnPhase.WAITING) return;

    // CALCULATE COST
    let cost = MOVE_COSTS[move];
    
    // Character Discounts
    if (characterType === CharacterType.MILITARY && move === MoveType.SHIELD) cost = 1;
    if (characterType === CharacterType.MODEL_J && move === MoveType.DESTROY) cost = 3;
    
    // Upgrade Discounts ('UNDERCLOCK')
    const hasCostReduction = player.upgrades?.some(u => u.id === 'UNDERCLOCK');
    if (hasCostReduction && (move === MoveType.DESTROY || move === MoveType.FIELD)) {
        cost = Math.max(0, cost - 1);
    }

    if (Math.floor(player.energy) < cost) return; // Use floor for comparison

    // Update Player
    setPlayer(prev => ({
      ...prev,
      energy: move === MoveType.CHARGE ? prev.energy + 1 : prev.energy - cost,
      currentMove: move
    }));

    // Determine Enemy Move
    const enemyAction = getEnemyMove(enemy, player, gameMode === GameMode.CAMPAIGN ? campaignIndex + 1 : endlessScore);
    
    // Calc Enemy Cost (Handle overrides in traits)
    let enemyCost = MOVE_COSTS[enemyAction];
    const trait = enemy.traits?.[0];
    if (enemyAction === MoveType.DESTROY && trait?.destroyCostOverride !== undefined) enemyCost = trait.destroyCostOverride;
    if (enemyAction === MoveType.FIELD && trait?.fieldCostOverride !== undefined) enemyCost = trait.fieldCostOverride;
    
    // Boss Charge Override
    let enemyChargeAmt = 1;
    if (enemyAction === MoveType.CHARGE && trait?.chargeAmountOverride) enemyChargeAmt = trait.chargeAmountOverride;

    setEnemy(prev => ({
      ...prev,
      energy: enemyAction === MoveType.CHARGE ? prev.energy + enemyChargeAmt : prev.energy - enemyCost,
      currentMove: enemyAction 
    }));

    setTurnPhase(TurnPhase.RESOLVING);
  };

  // Resolution Phase
  useEffect(() => {
    if (turnPhase === TurnPhase.RESOLVING) {
      const timer = setTimeout(() => {
        
        // 1. Check Industrial Passive
        const isIndustrialBonus = (characterType === CharacterType.INDUSTRIAL && (roundCount % 3 === 0));
        if (isIndustrialBonus) {
           setBattleLog(prev => [...prev, ">> 工业型被动触发：自动加载防护罩！"]);
        }

        // 2. Resolve Turn
        const result = resolveTurn(
          player, 
          enemy, 
          roundCount
        );
        
        // 3. Handle Military Multi-Laser / Weapon Mod Upgrade
        const hasWeaponMod = player.upgrades?.some(u => u.id === 'WEAPON_MOD');
        let nextTurnDelayedDamage = 0;
        
        if (player.currentMove === MoveType.LASER) {
             if (characterType === CharacterType.MILITARY) {
                 nextTurnDelayedDamage = 1;
                 setBattleLog(prev => [...prev, ">> 军用型被动：多重射击充能完毕！"]);
             } else if (hasWeaponMod) {
                 nextTurnDelayedDamage = 1;
                 setBattleLog(prev => [...prev, ">> 武器改装触发：多重射击充能完毕！"]);
             }
        }

        // Update HP
        let newPlayerHP = player.hp - result.playerDmg;
        let newEnemyHP = enemy.hp - result.enemyDmg;

        // Cap at 0
        if (newPlayerHP < 0) newPlayerHP = 0;
        if (newEnemyHP < 0) newEnemyHP = 0;

        setPlayer(prev => ({ 
          ...prev, 
          hp: newPlayerHP, 
          isDead: newPlayerHP === 0,
          delayedAttackDamage: nextTurnDelayedDamage 
        }));

        setEnemy(prev => ({ ...prev, hp: newEnemyHP, isDead: newEnemyHP === 0 }));
        
        setBattleLog(prev => [...prev, `[Round ${roundCount}] ${result.message}`]);
        setTurnPhase(TurnPhase.RESULT);

      }, 1000); 

      return () => clearTimeout(timer);
    }
  }, [turnPhase]); // Keep dependencies minimal to avoid double triggers

  // Result Phase Check
  useEffect(() => {
    if (turnPhase === TurnPhase.RESULT) {
      const timer = setTimeout(() => {
        if (player.isDead) {
           setEndGameMessage(gameMode === GameMode.ENDLESS ? `你的征程结束了。最终得分: ${endlessScore}` : LOSE_MESSAGE);
        } else if (enemy.isDead) {
           handleEnemyDefeated();
        } else {
           // Continue Game
           // Passives: J Type Regen (+1), Overclock (+0.5)
           const hasOverclock = player.upgrades?.some(u => u.id === 'OVERCLOCK');
           let energyGain = 0;
           if (characterType === CharacterType.MODEL_J) energyGain += 1;
           if (hasOverclock) energyGain += 0.5;

           setPlayer(prev => ({
             ...prev,
             currentMove: MoveType.NONE,
             energy: prev.energy + energyGain
           }));
           setEnemy(e => ({ ...e, currentMove: MoveType.NONE }));
           setRoundCount(r => r + 1);
           setTurnPhase(TurnPhase.WAITING);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [turnPhase, player.isDead, enemy.isDead]);


  // UI Helper for Buttons
  const ControlButton = ({ type }: { type: MoveType }) => {
    let cost = MOVE_COSTS[type];
    
    // Apply Visual Cost Reductions
    if (characterType === CharacterType.MILITARY && type === MoveType.SHIELD) cost = 1;
    if (characterType === CharacterType.MODEL_J && type === MoveType.DESTROY) cost = 3;
    const hasCostReduction = player.upgrades?.some(u => u.id === 'UNDERCLOCK');
    if (hasCostReduction && (type === MoveType.DESTROY || type === MoveType.FIELD)) {
        cost = Math.max(0, cost - 1);
    }

    const canAfford = Math.floor(player.energy) >= cost;
    
    let isDisabled = false;
    if (characterType === CharacterType.MODEL_J) {
        if (type === MoveType.SHIELD) isDisabled = true;
        if (type === MoveType.LASER) isDisabled = true;
    }
    
    // Labels
    let label = MOVE_NAMES[type];
    if (type === MoveType.LASER) {
        if (characterType === CharacterType.MILITARY || player.upgrades?.some(u => u.id === 'WEAPON_MOD')) {
            label = "多重射击";
        }
    }

    let colorTheme = "gray";
    if (type === MoveType.CHARGE) colorTheme = "yellow";
    if (type === MoveType.LASER) colorTheme = "blue";
    if (type === MoveType.SHIELD) colorTheme = "green";
    if (type === MoveType.FIELD) colorTheme = "purple";
    if (type === MoveType.DESTROY) colorTheme = "red";

    const bgColors: Record<string, string> = {
      yellow: "bg-yellow-900/60 border-yellow-500",
      blue: "bg-blue-900/60 border-blue-500",
      green: "bg-green-900/60 border-green-500",
      purple: "bg-purple-900/60 border-purple-500",
      red: "bg-red-900/60 border-red-500",
      gray: "bg-gray-800 border-gray-600"
    };
    
    const baseClass = (canAfford && !isDisabled)
      ? `${bgColors[colorTheme]} hover:brightness-125 text-white cursor-pointer transform hover:-translate-y-1 shadow-[0_0_10px_rgba(0,0,0,0.5)]` 
      : "bg-gray-900/80 border-gray-800 text-gray-600 cursor-not-allowed opacity-60 grayscale";

    if (isDisabled) {
        return (
            <button disabled className={`relative w-full h-24 rounded-xl border-2 border-gray-800 bg-black/80 flex flex-col items-center justify-center text-gray-700`}>
                <span className="text-xs font-bold">禁用</span>
            </button>
        )
    }

    return (
      <button
        disabled={!canAfford || turnPhase !== TurnPhase.WAITING}
        onClick={() => handlePlayerAction(type)}
        className={`relative w-full h-24 rounded-xl border-2 flex flex-col items-center justify-center transition-all duration-200 group overflow-hidden ${baseClass}`}
      >
         <div className={`absolute top-2 right-2 text-xs font-black px-2 py-0.5 rounded ${canAfford ? 'bg-black/50 text-white' : 'bg-black/20 text-gray-600'}`}>
            {type === MoveType.CHARGE ? '+1' : (cost === 0 ? '0' : `-${cost}`)} EN
         </div>

         <span className="text-2xl mb-1">
            {type === MoveType.CHARGE && '⚡'}
            {type === MoveType.LASER && '🔫'}
            {type === MoveType.SHIELD && '🛡️'}
            {type === MoveType.FIELD && '💠'}
            {type === MoveType.DESTROY && '☢️'}
         </span>
         <span className="font-bold text-xs md:text-sm text-center px-1">{label}</span>
      </button>
    );
  };

  // Boss Invincible Check
  const isBossInvincible = enemy.traits?.[0]?.isInvincibleOddTurns && (roundCount % 2 !== 0);

  return (
    <div className="w-full h-full flex flex-col relative z-10 max-h-screen overflow-hidden">
      <RoundOverlay levelName={levelName} round={roundCount} visible={showRoundOverlay} />
      
      {upgradeOptions && (
          <UpgradeModal options={upgradeOptions} onSelect={handleUpgradeSelect} onSkip={() => { setUpgradeOptions(null); startNextEndlessRound(endlessScore); }} />
      )}

      {/* Top Info Bar */}
      <div className="w-full p-4 flex justify-between items-center bg-black/60 backdrop-blur-md border-b border-white/10 shadow-lg z-20 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center gap-2 relative">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
                <div className="text-cyan-400 font-bold tracking-wider text-sm md:text-base">{charConfig.name}</div>
            </div>
            {/* Player Upgrades Icons */}
            <div className="flex gap-1">
                {player.upgrades?.map((u, i) => (
                    <div 
                      key={i} 
                      className="w-5 h-5 bg-yellow-500 rounded-sm text-[10px] flex items-center justify-center text-black font-bold cursor-help hover:scale-110 transition-transform border border-yellow-300" 
                      onMouseEnter={() => setShowPlayerTooltip(u)}
                      onMouseLeave={() => setShowPlayerTooltip(null)}
                    >
                        {u.name[0]}
                    </div>
                ))}
            </div>
            
            {/* Player Tooltip */}
            {showPlayerTooltip && (
                <div className="absolute top-10 left-0 w-64 bg-gray-900/95 border border-yellow-500/50 p-4 rounded-xl shadow-xl z-50 backdrop-blur-lg animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-yellow-400 font-bold mb-1">{showPlayerTooltip.name}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{showPlayerTooltip.description}</p>
                </div>
            )}
        </div>

        <div className="flex items-center gap-4">
             <div className="flex flex-col items-center">
                  <div className="text-2xl font-black text-white/20 tracking-[0.2em] italic">
                      {gameMode === GameMode.CAMPAIGN ? `LEVEL ${campaignIndex + 1}` : `SCORE ${endlessScore}`}
                  </div>
                  <div className="text-xs text-yellow-500">{levelName}</div>
             </div>
             
             {/* Quit Button */}
             <button 
                onClick={onBackToMenu}
                className="ml-2 px-3 py-1 border border-red-900/50 bg-red-950/30 text-red-400 text-xs hover:bg-red-900/50 hover:text-red-200 rounded transition-all"
             >
                退出
             </button>
        </div>
        
        {/* Enemy Info & Tooltip */}
        <div className="relative">
            <div 
                className="flex items-center gap-2 cursor-help"
                onMouseEnter={() => setShowEnemyTooltip(true)}
                onMouseLeave={() => setShowEnemyTooltip(false)}
            >
                <div className="text-right">
                    <div className="text-red-500 font-bold tracking-wider text-sm md:text-base">
                        {enemy.type}
                    </div>
                    {gameMode === GameMode.ENDLESS && enemy.traits?.[0] && (
                        <div className="text-[10px] text-red-400/80">{enemy.traits[0].name}</div>
                    )}
                </div>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            </div>

            {/* Tooltip */}
            {showEnemyTooltip && enemy.traits && enemy.traits.length > 0 && (
                <div className="absolute top-10 right-0 w-64 bg-gray-900/95 border border-red-500/50 p-4 rounded-xl shadow-xl z-50 backdrop-blur-lg animate-in fade-in slide-in-from-top-2">
                    <h4 className="text-red-400 font-bold mb-1">{enemy.traits[0].name}</h4>
                    <p className="text-xs text-gray-300 leading-relaxed">{enemy.traits[0].description}</p>
                    <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-gray-500">
                        HP: {enemy.hp} | EN: {Math.floor(enemy.energy)}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex items-center justify-between px-4 md:px-20 lg:px-40 relative shrink-0 min-h-[300px]">
        <Robot 
            {...player} 
            energy={Math.floor(player.energy)} // Display integer energy
            bonusShield={characterType === CharacterType.INDUSTRIAL && roundCount % 3 === 0}
            isPhantomFiring={(characterType === CharacterType.MILITARY || player.upgrades?.some(u => u.id === 'WEAPON_MOD')) && player.delayedAttackDamage! > 0 && turnPhase === TurnPhase.RESOLVING}
        />
        <Robot 
            {...enemy} 
            energy={Math.floor(enemy.energy)}
            isInvincible={isBossInvincible}
        />
      </div>

      {/* Battle Log & Controls */}
      <div className="flex flex-col bg-black/80 backdrop-blur-lg border-t border-white/10 pb-safe shrink-0">
        <div className="h-32 overflow-y-auto px-4 py-2 border-b border-white/10 space-y-1 scrollbar-thin scrollbar-thumb-cyan-900 scrollbar-track-black">
            {battleLog.map((log, index) => (
                <div key={index} className={`text-sm font-mono ${index === battleLog.length - 1 ? 'text-white font-bold animate-pulse' : 'text-gray-400'}`}>
                    {log}
                </div>
            ))}
            <div ref={logEndRef} />
        </div>

        <div className="p-4 pb-6 md:pb-8">
            <div className="grid grid-cols-5 gap-2 md:gap-4 max-w-5xl mx-auto">
            <ControlButton type={MoveType.CHARGE} />
            <ControlButton type={MoveType.LASER} />
            <ControlButton type={MoveType.SHIELD} />
            <ControlButton type={MoveType.FIELD} />
            <ControlButton type={MoveType.DESTROY} />
            </div>
        </div>
      </div>

      {/* End Game Modal */}
      {endGameMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500 px-4">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-cyan-500/30 p-8 rounded-2xl max-w-lg w-full text-center shadow-[0_0_100px_rgba(34,211,238,0.15)] relative overflow-hidden">
            <div className={`absolute inset-0 opacity-20 ${player.isDead ? 'bg-red-500' : 'bg-cyan-500'}`}></div>
            
            <h2 className={`text-4xl md:text-5xl font-black mb-8 relative ${player.isDead ? 'text-red-500' : 'text-cyan-400'} drop-shadow-lg`}>
               {player.isDead ? 'MISSION FAILED' : 'VICTORY'}
            </h2>
            
            <div className="bg-black/40 p-6 rounded-xl border border-white/10 mb-8 backdrop-blur-sm relative">
                 <p className="text-lg md:text-xl text-white font-orbitron leading-relaxed">{endGameMessage}</p>
            </div>

            <div className="flex gap-4 justify-center relative">
                <button 
                    onClick={onBackToMenu}
                    className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-lg tracking-widest shadow-lg transition-all hover:scale-105"
                >
                    返回基地
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game;