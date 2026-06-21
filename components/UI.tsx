import React from 'react';
import { Joystick } from './Joystick';
import { TouchLook } from './TouchLook';
import { useGameStore, controlsRef } from '../store';
import { Crosshair, Shield, RefreshCw, Play, Skull } from 'lucide-react';

export const UI = () => {
  const { isPlaying, isGameOver, score, health, ammo, weapon, level, enemiesTotal, enemiesKilled, actions } = useGameStore();

  const handleJump = (e: React.SyntheticEvent) => { e.preventDefault(); controlsRef.current.jump = true; };
  const handleShootStart = (e: React.SyntheticEvent) => { e.preventDefault(); controlsRef.current.shoot = true; };
  const handleShootEnd = (e: React.SyntheticEvent) => { e.preventDefault(); controlsRef.current.shoot = false; };
  const handleReload = (e: React.SyntheticEvent) => { e.preventDefault(); actions.reload(); };

  const getWeaponMaxAmmo = () => {
    switch (weapon) {
      case 'laser': return 100;
      case 'plasma': return 5;
      default: return 30;
    }
  };

  const levelObjectiveMet = enemiesTotal > 0 && enemiesKilled >= enemiesTotal;

  if (level > 3) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md">
        <div className="text-center text-white p-8 border border-green-500/30 rounded-xl bg-gray-900/90 shadow-2xl shadow-green-900/50">
          <div className="flex justify-center mb-4"><Shield size={64} className="text-green-500" /></div>
          <h1 className="text-5xl font-bold mb-2 text-green-500 tracking-tighter uppercase">MISSION ACCOMPLISHED</h1>
          <p className="text-3xl mb-8 font-mono">Final Score: {score}</p>
          <button 
            onClick={actions.reset}
            className="px-12 py-4 bg-green-600 hover:bg-green-500 text-black font-bold rounded-lg text-xl transition flex items-center gap-2 mx-auto uppercase tracking-wider active:scale-95 transform"
          >
            <RefreshCw /> Play Again
          </button>
        </div>
      </div>
    );
  }

  if (isGameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md">
        <div className="text-center text-white p-8 border border-red-500/30 rounded-xl bg-gray-900/90 shadow-2xl shadow-red-900/50">
          <div className="flex justify-center mb-4"><Skull size={64} className="text-red-500" /></div>
          <h1 className="text-5xl font-bold mb-2 text-red-500 tracking-tighter uppercase">Mission Failed</h1>
          <p className="text-3xl mb-8 font-mono">Final Score: {score}</p>
          <button 
            onClick={actions.reset}
            className="px-12 py-4 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg text-xl transition flex items-center gap-2 mx-auto uppercase tracking-wider active:scale-95 transform"
          >
            <RefreshCw /> Respawn
          </button>
        </div>
      </div>
    );
  }

  if (!isPlaying) {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/70">
        <div className="text-center text-white">
          <h1 className="text-6xl font-bold mb-4 uppercase tracking-wider">Strike Force</h1>
          <p className="text-lg text-gray-400 mb-8">Tap 'Start' to deploy.</p>
          <button 
            onClick={actions.startGame}
            className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-2xl transition transform active:scale-95"
          >
            Start
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="crosshair"></div>

      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-50 pointer-events-none">
        <div className="flex items-center gap-4 bg-black/60 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-white/10">
            <div className="flex items-center gap-2 text-white pr-4 border-r border-gray-500">
                <Shield className="w-6 h-6 text-green-500" />
                <span className="text-2xl font-bold font-mono">{health}</span>
            </div>
            <div className="flex items-center gap-2 text-white">
                <span className="text-sm font-bold font-mono tracking-widest text-yellow-500">SCORE:</span>
                <span className="text-2xl font-bold font-mono text-yellow-500">{score}</span>
            </div>
        </div>

        <div className="flex flex-col items-center">
            <div className="bg-black/60 backdrop-blur-sm px-6 py-2 rounded-t-lg border-t border-x border-white/10">
               <span className="text-white font-mono font-bold tracking-widest uppercase">Level {level}</span>
            </div>
            <div className={`bg-black/80 backdrop-blur-sm px-6 py-3 rounded-lg border border-white/10 ${levelObjectiveMet ? 'border-green-500 shadow-[0_0_15px_rgba(0,255,0,0.3)]' : ''}`}>
               {levelObjectiveMet ? (
                   <span className="text-green-500 font-bold tracking-widest uppercase animate-pulse">AREA CLEARED - PROCEED TO EXIT</span>
               ) : (
                   <span className="text-red-500 font-bold tracking-widest uppercase">ELIMINATE TARGETS: {enemiesTotal - enemiesKilled} LEFT</span>
               )}
            </div>
        </div>
        
        {/* Placeholder to balance the flex layout */}
        <div className="w-48"></div>
      </div>

      <TouchLook />

      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none z-50">
        <Joystick />

        <div className="absolute bottom-6 right-6 flex items-end gap-4 pointer-events-auto">
          <div className="absolute bottom-36 right-0 bg-black/60 backdrop-blur-sm p-3 rounded-l-lg shadow-lg text-right">
            <div className="text-sm text-gray-400 font-mono mb-1">WEAPON [1,2,3]</div>
            <div className="text-xl font-black text-yellow-500 uppercase">{weapon.toUpperCase()}</div>
          </div>

          <div className="text-right">
              <div className={`text-5xl font-black italic transition-colors ${ammo < 10 ? 'text-red-500' : 'text-white'}`}>{ammo}</div>
              <div className="text-sm text-gray-400 font-mono">/ {getWeaponMaxAmmo()}</div>
          </div>
          
          <div className="flex flex-col items-center gap-4">
            <button 
              onPointerDown={handleReload}
              onTouchStart={handleReload}
              onMouseDown={handleReload}
              className="w-16 h-16 rounded-full bg-gray-800/90 border-2 border-gray-500 flex items-center justify-center text-white active:bg-gray-700 transition shadow-lg backdrop-blur-sm"
            >
              <RefreshCw size={24} />
            </button>
            <button 
              onPointerDown={handleJump}
              onTouchStart={handleJump}
              onMouseDown={handleJump}
              className="w-20 h-20 rounded-full bg-blue-600/90 border-2 border-blue-400 flex items-center justify-center text-white font-bold active:bg-blue-500 transition shadow-lg backdrop-blur-sm"
            >
              JUMP
            </button>
          </div>
          
          <button 
            onPointerDown={handleShootStart}
            onTouchStart={handleShootStart}
            onMouseDown={handleShootStart}
            onPointerUp={handleShootEnd}
            onTouchEnd={handleShootEnd}
            onMouseUp={handleShootEnd}
            onPointerLeave={handleShootEnd}
            onMouseLeave={handleShootEnd}
            className="w-28 h-28 rounded-full bg-red-600/80 border-[6px] border-red-500/50 flex items-center justify-center text-white active:bg-red-500 active:scale-95 transition shadow-xl shadow-red-900/40 backdrop-blur-sm"
          >
            <Crosshair size={48} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </>
  );
};