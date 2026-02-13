
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import { GameStatus } from './types';
import { getJungleWisdom } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [wisdom, setWisdom] = useState("¡Cuidado con los tigres, busca las bananas!");
  const [isLoadingWisdom, setIsLoadingWisdom] = useState(false);

  const handleGameOver = () => {
    setStatus(GameStatus.GAME_OVER);
    if (score > highScore) setHighScore(score);
    fetchNewWisdom();
  };

  const fetchNewWisdom = async () => {
    setIsLoadingWisdom(true);
    const text = await getJungleWisdom(score);
    setWisdom(text);
    setIsLoadingWisdom(false);
  };

  const startGame = () => {
    setStatus(GameStatus.PLAYING);
    setScore(0);
  };

  return (
    <div className="min-h-screen bg-[#022c22] text-white flex flex-col items-center overflow-x-hidden">
      {/* Header Compacto para Móviles */}
      <header className="w-full py-4 px-6 text-center bg-black/20 border-b border-emerald-900/50">
        <h1 className="text-4xl md:text-6xl text-yellow-400 drop-shadow-lg mb-1 game-font">Jungle Dash</h1>
        <p className="text-xs md:text-sm text-emerald-400 font-bold uppercase tracking-[0.2em]">Monkey Business</p>
      </header>

      <main className="w-full max-w-6xl flex flex-col lg:flex-row gap-4 p-4 md:p-8 flex-grow">
        
        {/* Panel de Información Lateral / Superior */}
        <div className="flex flex-col gap-3 w-full lg:w-1/4 order-2 lg:order-1">
          {/* Stats Bar */}
          <div className="flex lg:flex-col gap-2 w-full">
            <div className="flex-1 bg-emerald-900/80 p-4 rounded-xl border-2 border-emerald-700 shadow-lg text-center lg:text-left">
              <span className="block text-[10px] md:text-xs text-emerald-400 uppercase font-black">Bananas</span>
              <span className="text-3xl md:text-4xl text-yellow-400 font-black leading-tight">{score}</span>
            </div>
            <div className="flex-1 bg-orange-950/80 p-4 rounded-xl border-2 border-orange-900 shadow-lg text-center lg:text-left">
              <span className="block text-[10px] md:text-xs text-orange-400 uppercase font-black">Record</span>
              <span className="text-2xl md:text-3xl text-orange-200 font-black leading-tight">{highScore}</span>
            </div>
          </div>

          {/* Wisdom Box */}
          <div className="bg-black/40 p-4 rounded-xl border-2 border-white/10 shadow-xl backdrop-blur-sm">
            <h2 className="text-xs mb-2 text-emerald-300 uppercase tracking-widest font-bold">Mei Hóuwáng dice:</h2>
            <p className="italic text-sm md:text-base text-emerald-50 leading-relaxed min-h-[40px]">
              {isLoadingWisdom ? "Invocando al chamán..." : `"${wisdom}"`}
            </p>
          </div>
          
          {/* Controls Help */}
          <div className="bg-emerald-950/50 p-4 rounded-xl border-2 border-emerald-800">
             <h3 className="text-[10px] font-black text-emerald-500 uppercase mb-2">Controles</h3>
             <p className="text-[10px] text-emerald-400 mb-2">Usa exclusivamente el teclado.</p>
             <div className="flex justify-center gap-1 text-[10px]">
                <div className="bg-emerald-800/80 p-2 rounded border border-emerald-700 text-center font-bold text-xl px-4">WASD</div>
             </div>
          </div>
        </div>

        {/* Área del Juego */}
        <div className="relative flex-grow order-1 lg:order-2 w-full max-w-[800px] mx-auto">
          <GameCanvas 
            status={status} 
            onScoreUpdate={setScore} 
            onGameOver={handleGameOver} 
          />

          {/* Overlays Adaptativos */}
          {status === GameStatus.START && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 backdrop-blur-md p-6 text-center">
              <h2 className="text-4xl md:text-7xl text-yellow-400 mb-6 game-font animate-bounce">¡PREPÁRATE!</h2>
              <div className="max-w-md space-y-4 mb-8">
                <p className="text-lg md:text-2xl text-white font-bold">Recolecta las bananas y escapa de los tigres.</p>
                <p className="text-sm md:text-lg text-emerald-300 bg-emerald-900/40 p-3 rounded-lg border border-emerald-700">
                  Usa las teclas <strong>WASD</strong> para mover al mono.
                </p>
              </div>
              <button 
                onClick={startGame}
                className="group relative bg-green-600 hover:bg-green-500 text-white px-10 py-4 md:px-16 md:py-6 rounded-full text-2xl md:text-4xl font-black transition-all hover:scale-105 active:scale-95 shadow-[0_10px_0_0_#166534] active:shadow-none active:translate-y-[10px]"
              >
                ¡A JUGAR!
              </button>
            </div>
          )}

          {status === GameStatus.GAME_OVER && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-xl p-6 text-center">
              <h2 className="text-5xl md:text-8xl text-red-600 mb-2 game-font">¡CAZADO!</h2>
              <p className="text-xl md:text-3xl text-white mb-8 font-black uppercase tracking-tighter">
                ¡Has sido el almuerzo del tigre!
              </p>
              <div className="bg-black/40 p-6 rounded-2xl border-2 border-red-900 mb-8 scale-110">
                <span className="block text-sm text-red-400 uppercase font-black">Bananas Totales</span>
                <span className="text-6xl text-yellow-400 font-black">{score}</span>
              </div>
              <button 
                onClick={startGame}
                className="bg-orange-600 hover:bg-orange-500 text-white px-12 py-5 rounded-full text-2xl md:text-3xl font-black transition-all hover:scale-105 active:scale-95 shadow-[0_8px_0_0_#9a3412] active:shadow-none active:translate-y-[8px]"
              >
                REINTENTAR
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-emerald-800 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-black/10">
        Jungle Dash • WASD Only Edition
      </footer>
    </div>
  );
};

export default App;
