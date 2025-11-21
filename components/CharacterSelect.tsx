import React from 'react';
import { CharacterType } from '../types';
import { CHARACTERS } from '../constants';

interface CharacterSelectProps {
  onSelect: (type: CharacterType) => void;
  onBack: () => void;
}

const CharacterSelect: React.FC<CharacterSelectProps> = ({ onSelect, onBack }) => {
  const charList = Object.values(CHARACTERS);

  return (
    <div className="flex flex-col items-center justify-center h-full z-10 relative p-4 overflow-y-auto">
      <h2 className="text-3xl md:text-5xl font-black text-cyan-400 mb-8 tracking-widest drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
        SELECT PILOT
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-6xl w-full mb-8">
        {charList.map((char) => (
          <button
            key={char.id}
            onClick={() => onSelect(char.id)}
            className="group relative overflow-hidden bg-black/60 border border-white/20 p-6 rounded-xl hover:border-cyan-400 hover:bg-cyan-900/20 transition-all duration-300 text-left flex flex-col gap-2"
          >
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-300">{char.name}</h3>
              <div className="flex gap-1">
                 {[...Array(char.maxHp)].map((_, i) => (
                     <div key={i} className="w-3 h-3 bg-green-500 rounded-sm shadow-[0_0_5px_#4ade80]"></div>
                 ))}
              </div>
            </div>
            <div className="text-xs font-orbitron text-gray-400 mb-1">MAX HP: {char.maxHp} | EN: {char.initialEnergy}</div>
            <p className="text-sm text-gray-300 leading-relaxed">
              {char.description}
            </p>
            
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-cyan-400 transition-opacity duration-300 pointer-events-none"></div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="px-6 py-2 text-gray-400 hover:text-white underline tracking-widest"
      >
        返回菜单
      </button>
    </div>
  );
};

export default CharacterSelect;
