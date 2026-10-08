import React from 'react';
import { Play, Clock, BookOpen, Sparkles, Compass } from 'lucide-react';
import { StoryIllustration } from './StoryIllustrations';
import { soundEffects } from '../utils/audio';

interface CoverScreenProps {
  onStart: () => void;
}

export const CoverScreen: React.FC<CoverScreenProps> = ({ onStart }) => {
  const handleStart = () => {
    soundEffects.playSuccessChime();
    onStart();
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col min-h-[calc(100vh-4rem)] p-3 sm:p-5 justify-between">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between text-xs font-semibold text-amber-900 bg-amber-100/70 px-3.5 py-1.5 rounded-2xl border border-amber-200/60 mb-2">
        <div className="flex items-center gap-1.5">
          <Compass className="w-4 h-4 text-amber-700" />
          <span>초등 4~5학년 영어 동화 탐정 (CEFR A1)</span>
        </div>
        <span className="text-amber-700 font-mono text-[11px]">8 Pages</span>
      </div>

      {/* Main Cover Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-amber-200/80 text-center space-y-4 flex-1 flex flex-col justify-center">
        {/* Title */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mystery Forest</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-stone-900 leading-tight">
            The Missing Acorn
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 font-medium">
            사라진 도토리의 비밀 · 다람쥐 Pip의 숲속 추리 모험
          </p>
        </div>

        {/* Forest Scene Illustration */}
        <div className="relative rounded-2xl overflow-hidden border border-emerald-100 bg-emerald-50/40 p-2 sm:p-3 my-1">
          <StoryIllustration scene="cover" className="w-full h-auto max-h-56 sm:max-h-64 object-contain mx-auto" />
        </div>

        {/* Learning Targets Overview */}
        <div className="bg-amber-50/70 rounded-2xl p-3 border border-amber-200/60 text-left space-y-1.5">
          <div className="text-xs font-bold text-amber-950 flex items-center gap-1">
            <span>🎯 이번 모험의 핵심 목표 과거형:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { verb: 'went', base: 'go' },
              { verb: 'saw', base: 'see' },
              { verb: 'found', base: 'find' },
              { verb: 'helped', base: 'help' },
            ].map(({ verb, base }) => (
              <span
                key={verb}
                className="bg-white border border-amber-200 text-amber-900 text-xs px-2 py-0.5 rounded-lg font-semibold"
              >
                <strong>{verb}</strong> <span className="text-stone-400 font-normal">({base})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Info and Start Action */}
      <div className="space-y-3 pt-3">
        {/* Info Badges */}
        <div className="flex items-center justify-center gap-4 text-xs text-stone-500 font-medium">
          <div className="flex items-center gap-1">
            <BookOpen className="w-4 h-4 text-emerald-600" />
            <span>8페이지 동화</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>10~15분 코스</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1">
            <span>듣기 → 읽기 → 퀴즈 → 정리</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 px-6 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white rounded-2xl font-bold font-display text-lg sm:text-xl flex items-center justify-center gap-2 shadow-md shadow-amber-200 active:scale-98 transition-all cursor-pointer"
        >
          <span>시작하기</span>
          <Play className="w-5 h-5 fill-current" />
        </button>
      </div>
    </div>
  );
};
