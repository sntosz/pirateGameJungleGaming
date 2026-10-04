import React from 'react';

export const RotateOverlay: React.FC = () => {
  return (
    <div className="hidden portrait:flex fixed inset-0 z-50 flex-col items-center justify-center bg-gray-950 text-white gap-6 p-8 text-center">
      <svg
        className="w-20 h-20 animate-[spin_2s_ease-in-out_infinite]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="5" y="2" width="14" height="20" rx="2" transform="rotate(90 12 12)" />
        <path d="M17 8l3 4-3 4" />
      </svg>
      <p className="text-xl font-bold text-pirate-gold">Gire o dispositivo</p>
      <p className="text-sm text-gray-300 max-w-xs">
        Este jogo foi feito para ser jogado na horizontal. Vire o celular para continuar.
      </p>
    </div>
  );
};
