import React from 'react';
import { Volume2, X, ArrowLeft, Sparkles } from 'lucide-react';
import { UnderlinedWord } from '../types';
import { soundEffects, ttsEngine } from '../utils/audio';

interface WordPopupModalProps {
  wordData: UnderlinedWord | null;
  onClose: () => void;
  speed: number;
}

export const WordPopupModal: React.FC<WordPopupModalProps> = ({ wordData, onClose, speed }) => {
  if (!wordData) return null;

  const handlePronounce = () => {
    soundEffects.playPop();
    ttsEngine.speakText(wordData.word, { rate: speed });
  };

  const handleBasePronounce = () => {
    if (!wordData.baseForm) return;
    soundEffects.playPop();
    ttsEngine.speakText(wordData.baseForm, { rate: speed });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl shadow-xl border-2 border-amber-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warm Theme */}
        <div className="bg-amber-100/70 px-5 py-4 flex items-center justify-between border-b border-amber-200/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔍</span>
            <span className="text-xs font-semibold text-amber-900 tracking-wide">
              단서 단어 돋보기 (Word Clue)
            </span>
          </div>
          <button
            onClick={() => {
              soundEffects.playPop();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/80 hover:bg-white text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors shadow-xs active:scale-95"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          {/* Main Word + Audio */}
          <div className="flex items-center justify-between bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/50">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold font-display text-amber-950">
                  {wordData.word}
                </span>
                {wordData.pronunciation && (
                  <span className="text-xs text-amber-700/80 font-mono">
                    {wordData.pronunciation}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-amber-800 mt-0.5">
                {wordData.meaning}
              </p>
            </div>

            <button
              onClick={handlePronounce}
              className="p-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl shadow-xs transition-transform flex items-center justify-center"
              title="발음 듣기"
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Past Tense / Base Form Connection */}
          {wordData.baseForm && (
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200/60 flex items-center justify-between">
              <div className="space-y-1">
                <div className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>원형(현재형)과 비교하기</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-bold text-emerald-950 font-display">{wordData.word}</span>
                  <span className="text-xs text-emerald-600 flex items-center gap-0.5">
                    <ArrowLeft className="w-3 h-3" /> 과거형
                  </span>
                  <span className="font-semibold text-stone-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    {wordData.baseForm}
                  </span>
                </div>
              </div>

              <button
                onClick={handleBasePronounce}
                className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors"
                title="원형 발음 듣기"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Kid-friendly Tip */}
          <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80 text-xs text-stone-700 leading-relaxed">
            <span className="font-bold text-stone-900 mr-1">💡 탐정 도움말:</span>
            {wordData.tip}
          </div>

          {/* Example Sentence */}
          {wordData.exampleSentence && (
            <div className="text-xs text-stone-500 px-1 italic">
              &quot;{wordData.exampleSentence}&quot;
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={() => {
              soundEffects.playPop();
              onClose();
            }}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors active:scale-98"
          >
            확인했어요 (Got it!)
          </button>
        </div>
      </div>
    </div>
  );
};
