import React, { useState } from 'react';
import { useFitScale } from '../hooks/useFitScale';

interface TouchControlsProps {
  onMoveChange: (thrust: number, turn: number) => void;
  onFrontFire: () => void;
  onLeftFire: () => void;
  onRightFire: () => void;
}

const roundButton = (size: number) =>
  ({
    backgroundImage: `url('/assets/png/default/ui/controls/button_round_normal.png')`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    width: size,
    height: size,
  }) as const;

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveChange,
  onFrontFire,
  onLeftFire,
  onRightFire,
}) => {
  const [thrust, setThrust] = useState(0);
  const [turn, setTurn] = useState(0);
  const scale = useFitScale(520, 110);

  const updateMove = (newThrust: number, newTurn: number) => {
    setThrust(newThrust);
    setTurn(newTurn);
    onMoveChange(newThrust, newTurn);
  };

  return (
    <div
      className="absolute inset-x-0 bottom-4 px-6 pointer-events-none flex justify-between items-end z-20 select-none touch-none"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div
        className="pointer-events-auto flex items-end gap-2"
        style={{ transform: `scale(${scale})`, transformOrigin: 'bottom left' }}
      >
        <button
          onTouchStart={() => updateMove(thrust, -1)}
          onTouchEnd={() => updateMove(thrust, 0)}
          onTouchCancel={() => updateMove(thrust, 0)}
          onMouseDown={() => updateMove(thrust, -1)}
          onMouseUp={() => updateMove(thrust, 0)}
          onMouseLeave={() => turn === -1 && updateMove(thrust, 0)}
          className="flex items-center justify-center border-0 bg-transparent p-0 transition-transform active:scale-95"
          style={roundButton(56)}
          aria-label="Turn Left"
        >
          <img src="/assets/png/default/ui/controls/icon_turn_left.png" alt="" className="w-6 h-6 object-contain" />
        </button>

        <button
          onTouchStart={() => updateMove(1, turn)}
          onTouchEnd={() => updateMove(0, turn)}
          onTouchCancel={() => updateMove(0, turn)}
          onMouseDown={() => updateMove(1, turn)}
          onMouseUp={() => updateMove(0, turn)}
          onMouseLeave={() => thrust === 1 && updateMove(0, turn)}
          className={`flex items-center justify-center border-0 bg-transparent p-0 transition-transform active:scale-95 ${
            thrust === 1 ? 'brightness-125' : ''
          }`}
          style={roundButton(64)}
          aria-label="Thrust Forward"
        >
          <img src="/assets/png/default/ui/controls/icon_forward.png" alt="" className="w-7 h-7 object-contain" />
        </button>

        <button
          onTouchStart={() => updateMove(thrust, 1)}
          onTouchEnd={() => updateMove(thrust, 0)}
          onTouchCancel={() => updateMove(thrust, 0)}
          onMouseDown={() => updateMove(thrust, 1)}
          onMouseUp={() => updateMove(thrust, 0)}
          onMouseLeave={() => turn === 1 && updateMove(thrust, 0)}
          className="flex items-center justify-center border-0 bg-transparent p-0 transition-transform active:scale-95"
          style={roundButton(56)}
          aria-label="Turn Right"
        >
          <img src="/assets/png/default/ui/controls/icon_turn_right.png" alt="" className="w-6 h-6 object-contain" />
        </button>
      </div>

      <div
        className="pointer-events-auto flex items-end gap-2"
        style={{ transform: `scale(${scale})`, transformOrigin: 'bottom right' }}
      >
        <button
          onTouchStart={onLeftFire}
          onMouseDown={onLeftFire}
          className="flex items-center justify-center border-0 bg-transparent p-0 transition-transform active:scale-95"
          style={roundButton(56)}
          aria-label="Fire Left Broadside"
        >
          <img src="/assets/png/default/ui/controls/icon_fire_left.png" alt="" className="w-6 h-6 object-contain" />
        </button>

        <button
          onTouchStart={onFrontFire}
          onMouseDown={onFrontFire}
          className="flex items-center justify-center border-0 bg-transparent p-0 transition-transform active:scale-95"
          style={roundButton(64)}
          aria-label="Fire Front Cannon"
        >
          <img src="/assets/png/default/ui/controls/icon_fire_front.png" alt="" className="w-7 h-7 object-contain" />
        </button>

        <button
          onTouchStart={onRightFire}
          onMouseDown={onRightFire}
          className="flex items-center justify-center border-0 bg-transparent p-0 transition-transform active:scale-95"
          style={roundButton(56)}
          aria-label="Fire Right Broadside"
        >
          <img src="/assets/png/default/ui/controls/icon_fire_right.png" alt="" className="w-6 h-6 object-contain" />
        </button>
      </div>
    </div>
  );
};
