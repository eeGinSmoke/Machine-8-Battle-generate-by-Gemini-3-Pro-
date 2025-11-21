import React, { useState } from 'react';
import Menu from './components/Menu';
import Game from './components/Game';
import CharacterSelect from './components/CharacterSelect';
import Stars from './components/Stars';
import { GameState, CharacterType, GameMode } from './types';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [selectedChar, setSelectedChar] = useState<CharacterType>(CharacterType.PROTOTYPE);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CAMPAIGN);

  const handleStartClick = (mode: GameMode) => {
    setGameMode(mode);
    setGameState(GameState.CHARACTER_SELECT);
  };

  const handleCharacterSelect = (charId: CharacterType) => {
    setSelectedChar(charId);
    setGameState(GameState.PLAYING);
  };

  const handleExit = () => {
    setGameState(GameState.EXIT);
  };

  const handleBackToMenu = () => {
    setGameState(GameState.MENU);
  };

  if (gameState === GameState.EXIT) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h1 className="text-4xl mb-4">已退出</h1>
          <button onClick={handleBackToMenu} className="text-cyan-500 underline">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gradient-to-b from-slate-950 to-black text-white select-none">
      <Stars />
      
      {gameState === GameState.MENU && (
        <Menu onStart={handleStartClick} onExit={handleExit} />
      )}

      {gameState === GameState.CHARACTER_SELECT && (
        <CharacterSelect 
          onSelect={handleCharacterSelect} 
          onBack={handleBackToMenu} 
        />
      )}
      
      {gameState === GameState.PLAYING && (
        <Game 
          characterType={selectedChar} 
          gameMode={gameMode}
          onBackToMenu={handleBackToMenu} 
        />
      )}
    </div>
  );
};

export default App;