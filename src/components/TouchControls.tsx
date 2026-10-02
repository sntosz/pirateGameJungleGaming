import React, { useState } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Flame, ChevronLeft, ChevronRight } from 'lucide-react';

interface TouchControlsProps {
  onMoveChange: (thrust: number, turn: number) => void;
  onFrontFire: () => void;
  onLeftFire: () => void;
  onRightFire: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveChange,
  onFrontFire,
  onLeftFire,
  onRightFire,
}) => {
  const [thrust, setThrust] = useState(0);
  const [turn, setTurn] = useState(0);

  const updateMove = (newThrust: number, newTurn: number) => {
    setThrust(newThrust);
    setTurn(newTurn);
    onMoveChange(newThrust, newTurn);
  };

  return (
    <div className="absolute inset-x-0 bottom-4 px-6 pointer-events-none flex justify-between items-end z-20 md:hidden select-none">
      <div className="pointer-events-auto grid grid-cols-3 gap-1 bg-gray-900/80 p-2 rounded-full border border-pirate-gold/40 shadow-xl backdrop-blur">
        <div />
        <button
          onTouchStart={() => updateMove(1, turn)}
          onTouchEnd={() => updateMove(0, turn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center border border-gray-600 ${
            thrust === 1 ? 'bg-pirate-gold text-gray-900' : 'bg-gray-800 text-pirate-gold'
          }`}
          aria-label="Thrust Forward"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          onTouchStart={() => updateMove(thrust, -1)}
          onTouchEnd={() => updateMove(thrust, 0)}
          className={`w-12 h-12 rounded-full flex items-center justify-center border border-gray-600 ${
            turn === -1 ? 'bg-pirate-gold text-gray-900' : 'bg-gray-800 text-pirate-gold'
          }`}
          aria-label="Turn Left"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onTouchStart={() => updateMove(-1, turn)}
          onTouchEnd={() => updateMove(0, turn)}
          className={`w-12 h-12 rounded-full flex items-center justify-center border border-gray-600 ${
            thrust === -1 ? 'bg-pirate-gold text-gray-900' : 'bg-gray-800 text-pirate-gold'
          }`}
          aria-label="Reverse"
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        <button
          onTouchStart={() => updateMove(thrust, 1)}
          onTouchEnd={() => updateMove(thrust, 0)}
          className={`w-12 h-12 rounded-full flex items-center justify-center border border-gray-600 ${
            turn === 1 ? 'bg-pirate-gold text-gray-900' : 'bg-gray-800 text-pirate-gold'
          }`}
          aria-label="Turn Right"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      <div className="pointer-events-auto flex items-end gap-2 bg-gray-900/80 p-2 rounded-2xl border border-pirate-gold/40 backdrop-blur shadow-xl">
        <button
          onTouchStart={onLeftFire}
          className="w-14 h-14 rounded-full bg-amber-700 hover:bg-amber-600 text-white flex flex-col items-center justify-center border border-amber-400 active:scale-95 transition-transform"
          aria-label="Fire Left Broadside"
        >
          <ChevronLeft className="w-6 h-6" />
          <span className="text-[9px] font-bold">LEFT</span>
        </button>

        <button
          onTouchStart={onFrontFire}
          className="w-16 h-16 rounded-full bg-pirate-red hover:bg-red-600 text-white flex flex-col items-center justify-center border-2 border-pirate-gold active:scale-95 transition-transform shadow-lg"
          aria-label="Fire Front Cannon"
        >
          <Flame className="w-8 h-8 text-pirate-gold" />
          <span className="text-[10px] font-bold">FRONT</span>
        </button>

        <button
          onTouchStart={onRightFire}
          className="w-14 h-14 rounded-full bg-amber-700 hover:bg-amber-600 text-white flex flex-col items-center justify-center border border-amber-400 active:scale-95 transition-transform"
          aria-label="Fire Right Broadside"
        >
          <ChevronRight className="w-6 h-6" />
          <span className="text-[9px] font-bold">RIGHT</span>
        </button>
      </div>
    </div>
  );
};
