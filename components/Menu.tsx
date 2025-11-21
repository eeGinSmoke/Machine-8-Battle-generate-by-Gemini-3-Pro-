import React, { useState } from 'react';
import { HOW_TO_PLAY_TEXT, TRAITS_ALL } from '../constants';
import { GameMode, EnemyTrait } from '../types';

interface MenuProps {
  onStart: (mode: GameMode) => void;
  onExit: () => void;
}

const Menu: React.FC<MenuProps> = ({ onStart, onExit }) => {
  const [showHelp, setShowHelp] = useState(false);
  const [showBestiary, setShowBestiary] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [bestiaryTab, setBestiaryTab] = useState<string>(Object.keys(TRAITS_ALL)[0]);

  const handleStartClick = () => {
    setShowModeSelect(true);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full z-10 relative space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 to-blue-700 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)] animate-pulse">
          MACHINE 8 BATTLE
        </h1>
        <p className="text-cyan-100/60 tracking-[0.5em] text-sm md:text-lg uppercase">八打人机</p>
      </div>

      {!showModeSelect ? (
        <div className="flex flex-col space-y-4 w-64">
          <button
            onClick={handleStartClick}
            className="group relative px-8 py-4 bg-black/50 border-2 border-cyan-500/50 text-cyan-400 font-bold text-xl tracking-widest uppercase overflow-hidden hover:text-black transition-colors duration-300"
          >
            <div className="absolute inset-0 w-0 bg-cyan-400 transition-all duration-[250ms] ease-out group-hover:w-full opacity-100"></div>
            <span className="relative">开始游戏</span>
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="group relative px-8 py-4 bg-black/50 border-2 border-yellow-500/50 text-yellow-400 font-bold text-xl tracking-widest uppercase overflow-hidden hover:text-black transition-colors duration-300"
          >
            <div className="absolute inset-0 w-0 bg-yellow-400 transition-all duration-[250ms] ease-out group-hover:w-full opacity-100"></div>
            <span className="relative">玩法说明</span>
          </button>
          
          <button
            onClick={() => setShowBestiary(true)}
            className="group relative px-8 py-4 bg-black/50 border-2 border-purple-500/50 text-purple-400 font-bold text-xl tracking-widest uppercase overflow-hidden hover:text-black transition-colors duration-300"
          >
            <div className="absolute inset-0 w-0 bg-purple-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-100"></div>
            <span className="relative">敌人图鉴</span>
          </button>

          <button
            onClick={onExit}
            className="group relative px-8 py-4 bg-black/50 border-2 border-red-500/50 text-red-400 font-bold text-xl tracking-widest uppercase overflow-hidden hover:text-black transition-colors duration-300"
          >
             <div className="absolute inset-0 w-0 bg-red-500 transition-all duration-[250ms] ease-out group-hover:w-full opacity-100"></div>
            <span className="relative">退出游戏</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col space-y-4 w-80 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => onStart(GameMode.CAMPAIGN)}
              className="group relative px-6 py-6 bg-black/70 border-2 border-cyan-500/50 hover:border-cyan-400 text-left transition-all"
            >
               <div className="text-2xl font-bold text-cyan-400 mb-1 group-hover:text-white">闯关模式</div>
               <div className="text-sm text-gray-400">战胜三个等级的敌人，守护地球。</div>
            </button>
            
            <button
              onClick={() => onStart(GameMode.ENDLESS)}
              className="group relative px-6 py-6 bg-black/70 border-2 border-purple-500/50 hover:border-purple-400 text-left transition-all"
            >
               <div className="text-2xl font-bold text-purple-400 mb-1 group-hover:text-white">无尽模式</div>
               <div className="text-sm text-gray-400">挑战无限的敌人，对抗随机特质，获取强力升级。</div>
            </button>

            <button
              onClick={() => setShowModeSelect(false)}
              className="text-center text-gray-500 hover:text-white mt-4 underline"
            >
                返回
            </button>
        </div>
      )}

      <div className="absolute bottom-8 text-xs text-gray-600">
         POWERED BY REACT & TAILWIND
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="bg-gray-900/90 border border-yellow-500/30 p-6 md:p-8 rounded-2xl max-w-2xl w-full shadow-[0_0_50px_rgba(234,179,8,0.2)] overflow-y-auto max-h-[80vh]">
            <h2 className="text-3xl font-black text-yellow-400 mb-6 tracking-wider text-center">玩法说明</h2>
            <div className="space-y-6 font-sans">
              {HOW_TO_PLAY_TEXT.map((section, idx) => (
                <div key={idx} className="border-l-2 border-yellow-500/50 pl-4">
                  <h3 className="text-yellow-200 font-bold text-lg mb-1">{section.title}</h3>
                  <p className="text-gray-300 text-sm md:text-base leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => setShowHelp(false)}
                className="px-8 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded shadow transition-all"
              >
                明白
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bestiary Modal */}
      {showBestiary && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4 animate-in fade-in duration-200">
          <div className="bg-gray-900/90 border border-purple-500/30 p-6 md:p-8 rounded-2xl max-w-4xl w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col max-h-[85vh]">
            <h2 className="text-3xl font-black text-purple-400 mb-4 tracking-wider text-center">敌人图鉴</h2>
            
            {/* Tabs */}
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-hide justify-center">
                {Object.keys(TRAITS_ALL).map(tab => (
                    <button 
                        key={tab}
                        onClick={() => setBestiaryTab(tab)}
                        className={`px-4 py-2 rounded-t-lg border-b-2 transition-colors whitespace-nowrap ${bestiaryTab === tab ? 'border-purple-500 text-purple-400 bg-purple-900/20' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                {(TRAITS_ALL as any)[bestiaryTab].map((trait: EnemyTrait) => (
                    <div key={trait.id} className="bg-black/40 border border-purple-500/20 p-4 rounded-lg hover:border-purple-500/50 transition-all">
                        <div className="flex justify-between items-start mb-2">
                             <h3 className="text-lg font-bold text-purple-200">{trait.name}</h3>
                             <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-1 rounded">HP {trait.hpRange[0]}-{trait.hpRange[1]}</span>
                        </div>
                        <p className="text-sm text-gray-400">{trait.description}</p>
                        {trait.startEnergy ? <div className="text-xs text-yellow-500 mt-2">初始能量: {trait.startEnergy}</div> : null}
                        {trait.immuneToLaser ? <div className="text-xs text-red-400 mt-2">! 免疫激光</div> : null}
                        {trait.regenerates ? <div className="text-xs text-green-400 mt-2">! 自动再生</div> : null}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex justify-center">
              <button 
                onClick={() => setShowBestiary(false)}
                className="px-8 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded shadow transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Menu;