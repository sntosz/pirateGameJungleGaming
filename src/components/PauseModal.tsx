import React from 'react';
import { useFitScale } from '../hooks/useFitScale';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface PauseModalProps {
  onResume: () => void;
  onAbandon: () => void;
  onOptions?: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({ onResume, onAbandon, onOptions }) => {
  const scale = useFitScale(572, 420);
  const dialogRef = useFocusTrap<HTMLDivElement>();

  const primaryButtonStyle = {
    backgroundImage: `url('/assets/png/default/ui/menu/button_primary_normal.png')`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    width: 280,
    height: 66,
  } as const;

  return (
    <div
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Game Paused"
      data-testid="modal-pause"
    >
      <div
        className="relative flex flex-col items-center justify-center text-center"
        style={{
          backgroundImage: `url('/assets/png/default/ui/menu/frame.png')`,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          width: 540,
          aspectRatio: '1570 / 829',
          padding: '6% 10%',
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-[0.08em] text-[#f7dfaa] drop-shadow-md">
          Paused
        </h2>
        <p className="mt-2 text-[13px] sm:text-sm font-medium text-[#f1d8a0] opacity-90">
          Ready when you are.
        </p>

        <div className="mt-7 flex flex-col items-center gap-2.5">
          <button
            onClick={onResume}
            className="flex items-center justify-center border-0 bg-transparent px-4 text-[15px] font-black uppercase tracking-[0.12em] text-[#1d2d41] shadow-none transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-pirate-gold"
            style={primaryButtonStyle}
            data-testid="btn-resume"
          >
            <span>Resume</span>
          </button>

          {onOptions && (
            <button
              onClick={onOptions}
              className="flex items-center justify-center border-0 bg-transparent px-4 text-[15px] font-black uppercase tracking-[0.12em] text-[#1d2d41] shadow-none transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-pirate-gold"
              style={primaryButtonStyle}
              data-testid="btn-pause-options"
            >
              <span>Options</span>
            </button>
          )}

          <button
            onClick={onAbandon}
            className="flex items-center justify-center border-0 bg-transparent px-4 text-[15px] font-black uppercase tracking-[0.12em] text-[#1d2d41] shadow-none transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-pirate-gold"
            style={primaryButtonStyle}
            data-testid="btn-abandon"
          >
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
