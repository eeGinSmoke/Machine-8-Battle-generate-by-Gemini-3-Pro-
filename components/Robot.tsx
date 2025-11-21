import React from 'react';
import { MoveType, CharacterType } from '../types';

interface RobotProps {
  id: 'player' | 'enemy';
  type: CharacterType | string;
  hp: number;
  maxHp: number;
  energy: number;
  currentMove: MoveType;
  isDead: boolean;
  bonusShield?: boolean; // For visual effect
  isPhantomFiring?: boolean; // For Military type delayed shot
  isInvincible?: boolean; // For Boss
}

const Robot: React.FC<RobotProps> = ({ id, type, hp, maxHp, energy, currentMove, isDead, bonusShield, isPhantomFiring, isInvincible }) => {
  const isPlayer = id === 'player';
  
  // Theme Colors
  let baseColor = '#22d3ee'; // Cyan (Default)
  let secondaryColor = '#0891b2';
  let glowColor = 'shadow-cyan-500/50';
  let textColor = 'text-cyan-400';

  if (!isPlayer) {
    // Enemy Themes
    baseColor = '#ef4444'; // Red
    secondaryColor = '#991b1b';
    glowColor = 'shadow-red-500/50';
    textColor = 'text-red-500';
    if (type === 'ENEMY_V2') { baseColor = '#f97316'; secondaryColor = '#c2410c'; textColor='text-orange-500'; } // Orange
    if (type === 'ENEMY_V3') { baseColor = '#a855f7'; secondaryColor = '#6b21a8'; textColor='text-purple-500'; } // Purple
  } else {
    // Player Themes
    if (type === CharacterType.INDUSTRIAL) {
      baseColor = '#eab308'; // Yellow
      secondaryColor = '#854d0e';
      textColor = 'text-yellow-400';
      glowColor = 'shadow-yellow-500/50';
    } else if (type === CharacterType.MILITARY) {
      baseColor = '#84cc16'; // Lime/Camo
      secondaryColor = '#3f6212';
      textColor = 'text-lime-400';
      glowColor = 'shadow-lime-500/50';
    } else if (type === CharacterType.MODEL_J) {
      baseColor = '#f472b6'; // Pink/Futuristic
      secondaryColor = '#be185d';
      textColor = 'text-pink-400';
      glowColor = 'shadow-pink-500/50';
    }
  }

  return (
    <div className={`relative flex flex-col items-center transition-all duration-500 ${isDead ? 'opacity-20 grayscale' : 'opacity-100'} animate-float`}>
      
      {/* Action Bubble */}
      <div className={`absolute -top-24 z-20 font-bold text-sm md:text-lg px-4 py-2 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 transform ${currentMove !== MoveType.NONE ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
           style={{ borderColor: baseColor, backgroundColor: 'rgba(0,0,0,0.8)', color: baseColor }}>
        {currentMove === MoveType.NONE ? '...' : 
           (currentMove === MoveType.CHARGE ? '⚡ 充能' :
           currentMove === MoveType.LASER ? '🔫 激光' :
           currentMove === MoveType.SHIELD ? '🛡️ 防护罩' :
           currentMove === MoveType.FIELD ? '💠 力场' :
           currentMove === MoveType.DESTROY ? '☢️ 毁灭' : '')
        }
        {bonusShield && <span className="block text-xs text-white">+ 被动护盾</span>}
        {isPhantomFiring && <span className="block text-xs text-lime-400">+ 后续射击</span>}
        {isInvincible && <span className="block text-xs text-yellow-400 font-black animate-pulse">! 无敌状态 !</span>}
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4 mb-4 text-xs md:text-sm font-orbitron font-bold tracking-wider bg-black/60 p-2 rounded-lg border border-white/10 backdrop-blur-md">
        <div className="flex flex-col items-center">
            <span className="text-gray-400 text-[10px]">HP ({hp}/{maxHp})</span>
            <div className="flex gap-1">
                {[...Array(maxHp)].map((_, i) => (
                    <div key={i} 
                         className={`w-2 h-3 md:w-3 md:h-4 rounded-sm border border-white/30 transition-all duration-300`}
                         style={{ backgroundColor: i < hp ? baseColor : '#1f2937', boxShadow: i < hp ? `0 0 5px ${baseColor}` : 'none' }}>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex flex-col items-center min-w-[40px]">
            <span className="text-gray-400 text-[10px]">EN</span>
            <span className={`text-xl leading-none ${energy >= 5 ? 'animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]' : 'text-white'}`} style={{ color: energy >= 5 ? '#facc15' : 'white' }}>{energy}</span>
        </div>
      </div>

      {/* The Robot SVG */}
      <div className={`w-40 h-40 md:w-56 md:h-56 relative filter drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
        
        {/* Invincible Aura */}
        {isInvincible && !isDead && (
            <div className="absolute inset-[-10%] border-4 border-yellow-400/80 rounded-full animate-spin-slow pointer-events-none z-0" style={{ borderStyle: 'dashed' }}></div>
        )}
        {isInvincible && !isDead && (
            <div className="absolute inset-[-5%] bg-yellow-500/10 rounded-full animate-pulse pointer-events-none z-0"></div>
        )}

        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible relative z-10">
           {/* Aura for Destroy Mode */}
           {currentMove === MoveType.DESTROY && !isDead && (
             <circle cx="50" cy="50" r="60" fill="none" stroke={baseColor} strokeWidth="2" strokeDasharray="4 4" className="animate-spin opacity-50" />
           )}
           
           {/* Shield Effect (Explicit OR Bonus) */}
           {((currentMove === MoveType.SHIELD || currentMove === MoveType.FIELD) || bonusShield) && !isDead && (
             <path d="M 15 20 Q 50 -15 85 20 V 60 Q 50 115 15 60 Z" fill={baseColor} fillOpacity="0.15" stroke={baseColor} strokeWidth="2" className="animate-pulse" />
           )}

           {isPlayer ? (
             /* === PLAYER ROBOTS === */
             <g transform="translate(10, 10) scale(0.8)">
                {/* Common Internal Frame */}
                <path d="M35 70 L30 100 L45 100 L45 70 Z" fill="#1a1a1a" stroke={baseColor} strokeWidth="1" />
                <path d="M65 70 L70 100 L55 100 L55 70 Z" fill="#1a1a1a" stroke={baseColor} strokeWidth="1" />
                
                {type === CharacterType.INDUSTRIAL && (
                  // Industrial: Blocky, Hazard stripes
                  <g>
                     <rect x="20" y="25" width="60" height="45" fill="#3f3f46" stroke={baseColor} strokeWidth="2" />
                     <path d="M20 25 L80 70 M40 25 L80 50 M20 45 L60 70" stroke="black" strokeWidth="3" opacity="0.3" />
                     <rect x="35" y="20" width="30" height="15" fill={baseColor} />
                     <rect x="10" y="35" width="10" height="30" fill="#1a1a1a" stroke={baseColor} />
                     <rect x="80" y="35" width="10" height="30" fill="#1a1a1a" stroke={baseColor} />
                     <circle cx="50" cy="40" r="5" fill="red" className="animate-ping" />
                  </g>
                )}

                {type === CharacterType.MILITARY && (
                  // Military: Shoulders, Gun arm
                   <g>
                    <path d="M30 30 L70 30 L60 70 L40 70 Z" fill="#365314" stroke={baseColor} strokeWidth="2" />
                    <path d="M15 25 L35 25 L35 45 L15 40 Z" fill="#1a2e05" stroke={baseColor} />
                    <path d="M85 25 L65 25 L65 45 L85 40 Z" fill="#1a2e05" stroke={baseColor} />
                    <path d="M40 20 L60 20 L50 5 Z" fill="#ecfccb" stroke={baseColor} /> 
                    <rect x="85" y="35" width="5" height="30" fill="#4d7c0f" /> {/* Big Gun */}
                    <path d="M45 25 L55 25" stroke="#ecfccb" strokeWidth="3" />
                   </g>
                )}

                {type === CharacterType.MODEL_J && (
                   // J Type: Sleek, thin, wings
                   <g>
                    <path d="M40 30 L60 30 L55 70 L45 70 Z" fill="#fbcfe8" stroke={baseColor} strokeWidth="1" />
                    <path d="M10 20 Q 30 40 40 40 L 40 30 Z" fill="none" stroke={baseColor} strokeWidth="2" />
                    <path d="M90 20 Q 70 40 60 40 L 60 30 Z" fill="none" stroke={baseColor} strokeWidth="2" />
                    <circle cx="50" cy="25" r="8" fill="white" stroke={baseColor} />
                    <path d="M48 25 L52 25" stroke={baseColor} />
                   </g>
                )}

                {type === CharacterType.PROTOTYPE && (
                   // Prototype (Original)
                   <g>
                    <path d="M10 30 L-10 10 L0 40 Z" fill={secondaryColor} stroke={baseColor} strokeWidth="1" />
                    <path d="M90 30 L110 10 L100 40 Z" fill={secondaryColor} stroke={baseColor} strokeWidth="1" />
                    <path d="M30 30 L70 30 L60 70 L40 70 Z" fill="#1e293b" stroke={baseColor} strokeWidth="2" />
                    <path d="M40 40 L60 40 L55 50 L45 50 Z" fill={baseColor} className="animate-pulse" opacity="0.6" />
                    <path d="M20 30 L30 25 L30 45 L15 40 Z" fill="#334155" stroke={baseColor} strokeWidth="1" />
                    <path d="M80 30 L70 25 L70 45 L85 40 Z" fill="#334155" stroke={baseColor} strokeWidth="1" />
                    <path d="M40 25 L60 25 L55 10 L45 10 Z" fill="#fff" stroke={baseColor} strokeWidth="1" />
                    <path d="M50 20 L30 5 L45 15 M50 20 L70 5 L55 15" fill="none" stroke="#fbbf24" strokeWidth="2" />
                    <path d="M42 22 L58 22" stroke="#22d3ee" strokeWidth="3" className={isDead ? "stroke-gray-700" : ""} />
                   </g>
                )}
             </g>
           ) : (
             /* === ENEMY ROBOTS === */
             <g transform="translate(10, 10) scale(0.8)">
                {/* Legs */}
                <path d="M30 70 Q 20 85 25 100 L 45 100 L 45 70 Z" fill="#1a1a1a" stroke={baseColor} strokeWidth="1" />
                <path d="M70 70 Q 80 85 75 100 L 55 100 L 55 70 Z" fill="#1a1a1a" stroke={baseColor} strokeWidth="1" />

                {/* Body */}
                <path d="M25 30 Q 50 10 75 30 V 70 Q 50 80 25 70 Z" fill={type === 'ENEMY_V3' ? '#2e1065' : '#3f1a1a'} stroke={baseColor} strokeWidth="2" />
                
                {/* Spikes/Armor based on level */}
                <path d="M10 35 L25 30 L25 50 L15 55 Z" fill={secondaryColor} stroke={baseColor} />
                <path d="M90 35 L75 30 L75 50 L85 55 Z" fill={secondaryColor} stroke={baseColor} />
                
                {/* Extra Spikes for V3 */}
                {(type === 'ENEMY_V3' || type === 'ENEMY_V2') && (
                   <path d="M50 10 L40 25 L60 25 Z" fill={secondaryColor} stroke={baseColor} />
                )}

                {/* Head/Eye */}
                <path d="M35 35 H 65 V 45 H 35 Z" fill="#000" stroke={baseColor} strokeWidth="1" />
                <circle cx="50" cy="40" r="4" fill={isDead ? "#333" : baseColor} className={isDead ? "" : "animate-ping"} />
             </g>
           )}
        </svg>

        {/* Attack Beams */}
        {currentMove === MoveType.LASER && !isDead && (
            <div 
              className={`absolute top-[45%] ${isPlayer ? 'left-[65%]' : 'right-[65%]'} w-[150vw] h-6 -mt-3 animate-laser pointer-events-none rounded-full`} 
              style={{
                  backgroundColor: baseColor, 
                  boxShadow: `0 0 25px ${baseColor}`,
                  transformOrigin: isPlayer ? 'left' : 'right', 
                  zIndex: 40
                }}
            >
                <div className="absolute inset-0 bg-white/50 animate-pulse"></div>
            </div>
        )}

        {/* Phantom Laser for Military Type */}
        {isPhantomFiring && !isDead && (
            <div 
              className={`absolute top-[35%] ${isPlayer ? 'left-[65%]' : 'right-[65%]'} w-[150vw] h-4 -mt-2 animate-laser pointer-events-none rounded-full`} 
              style={{
                  backgroundColor: '#a3e635', // Lime
                  boxShadow: `0 0 15px #a3e635`,
                  transformOrigin: isPlayer ? 'left' : 'right', 
                  zIndex: 39,
                  animationDelay: '0.2s' // Slight delay for visual effect
                }}
            >
               <div className="absolute inset-0 bg-white/80 animate-pulse"></div>
            </div>
        )}

         {currentMove === MoveType.DESTROY && !isDead && (
            <div 
              className={`absolute top-[45%] ${isPlayer ? 'left-[65%]' : 'right-[65%]'} w-[200vw] h-48 -mt-24 animate-destroy mix-blend-hard-light pointer-events-none`} 
              style={{
                  background: isPlayer ? `linear-gradient(to right, ${baseColor}00, ${baseColor}, transparent)` : `linear-gradient(to left, ${baseColor}00, ${baseColor}, transparent)`,
                  transformOrigin: isPlayer ? 'left' : 'right', 
                  zIndex: 50
              }}
            >
            </div>
        )}

      </div>
    </div>
  );
};

export default Robot;