import React from 'react';
import { Home } from 'lucide-react';
import { ScreenType } from '../types';
import { soundEffects } from '../utils/audio';

interface NavbarProps {
  currentScreen: ScreenType;
  currentPage: number;
  totalPages: number;
  onGoHome: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  currentPage,
  totalPages,
  onGoHome,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-amber-200/70 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xs">
      {/* Zone 1: Single text element wordmark */}
      <button
        onClick={() => {
          soundEffects.playPop();
          onGoHome();
        }}
        className="text-base sm:text-lg font-bold font-display text-amber-950 flex items-center gap-1.5 hover:text-amber-700 transition-colors cursor-pointer"
      >
        <span className="text-xl">🐿️</span>
        <span className="tracking-tight">Mystery Forest</span>
      </button>

      {/* Zone 2: Progress indicator / Clean metadata */}
      <div className="flex items-center gap-2 text-xs font-medium text-stone-600">
        {currentScreen === 'cover' && (
          <span className="text-stone-400">The Missing Acorn</span>
        )}

        {currentScreen === 'story' && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-amber-900">본문 읽기</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500 font-mono">{currentPage} / {totalPages}</span>
          </div>
        )}

        {currentScreen === 'question' && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-amber-900">단서 질문</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-500">Quiz</span>
          </div>
        )}

        {currentScreen === 'wrapup' && (
          <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            이야기 정리 (Wrap-up)
          </span>
        )}

        {currentScreen === 'result' && (
          <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
            탐정 결과 (Badge)
          </span>
        )}
      </div>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {currentScreen !== 'cover' && (
          <button
            onClick={() => {
              soundEffects.playPop();
              onGoHome();
            }}
            className="p-1.5 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
            title="처음으로 이동"
            aria-label="처음으로"
          >
            <Home className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
