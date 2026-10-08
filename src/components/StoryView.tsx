import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Volume2, Square, RotateCcw, CheckCircle2, ChevronLeft, ChevronRight, Sparkles, BookOpen } from 'lucide-react';
import { StoryPage, UnderlinedWord } from '../types';
import { VOCABULARY_LIST } from '../data/storyData';
import { StoryIllustration } from './StoryIllustrations';
import { soundEffects, ttsEngine } from '../utils/audio';
import { WordPopupModal } from './WordPopupModal';

interface StoryViewProps {
  page: StoryPage;
  totalPages: number;
  isRead: boolean;
  canNavigateFreely?: boolean;
  onMarkReadComplete: (pageNumber: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const StoryView: React.FC<StoryViewProps> = ({
  page,
  totalPages,
  isRead,
  canNavigateFreely = false,
  onMarkReadComplete,
  onNext,
  onPrev,
}) => {
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
  const [speakingSentenceIndex, setSpeakingSentenceIndex] = useState<number | null>(null);
  const [selectedWord, setSelectedWord] = useState<UnderlinedWord | null>(null);
  const [showKoreanTranslation, setShowKoreanTranslation] = useState(false);

  // Stop audio on page change or unmount
  useEffect(() => {
    ttsEngine.stop();
    setIsPlayingAll(false);
    setSelectedSentenceIndex(null);
    setSpeakingSentenceIndex(null);
  }, [page.pageNumber]);

  // Clean stop audio
  const handleStopAudio = useCallback(() => {
    soundEffects.playPop();
    ttsEngine.stop();
    setIsPlayingAll(false);
    setSpeakingSentenceIndex(null);
  }, []);

  // Sequential playback through all sentences with bright yellow highlighting
  const playEntirePageAudio = useCallback(() => {
    soundEffects.playPop();
    if (isPlayingAll) {
      handleStopAudio();
      return;
    }

    setIsPlayingAll(true);
    const sentences = page.sentences.map((s) => s.audioText);

    ttsEngine.speakSentenceSequence(sentences, {
      onSentenceChange: (index) => {
        setSelectedSentenceIndex(index);
        setSpeakingSentenceIndex(index);
      },
      onComplete: () => {
        setIsPlayingAll(false);
        setSpeakingSentenceIndex(null);
      },
      onError: () => {
        setIsPlayingAll(false);
        setSpeakingSentenceIndex(null);
      },
    });
  }, [page.sentences, isPlayingAll, handleStopAudio]);

  const handleReplay = () => {
    handleStopAudio();
    setTimeout(() => {
      playEntirePageAudio();
    }, 150);
  };

  // Single sentence selection and pronunciation playback
  const handleSentenceClick = (idx: number) => {
    soundEffects.playPop();
    ttsEngine.stop();
    setIsPlayingAll(false);

    setSelectedSentenceIndex(idx);
    setSpeakingSentenceIndex(idx);

    ttsEngine.speakText(page.sentences[idx].audioText, {
      rate: 1.0,
      onStart: () => {
        setSpeakingSentenceIndex(idx);
      },
      onEnd: () => {
        setSpeakingSentenceIndex(null);
      },
      onError: () => {
        setSpeakingSentenceIndex(null);
      },
    });
  };

  const handleWordClick = (wordKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playPop();
    const wordItem = VOCABULARY_LIST[wordKey.toLowerCase()];
    if (wordItem) {
      setSelectedWord(wordItem);
    }
  };

  const handleReadComplete = () => {
    soundEffects.playSuccessChime();
    onMarkReadComplete(page.pageNumber);
  };

  // Helper to render text with clickable underlined target vocabulary (ONLY new words for this page)
  const renderInteractiveText = (text: string) => {
    const pageTargetWords = (page.underlinedWordIds || []).map((w) => w.toLowerCase());
    if (pageTargetWords.length === 0) {
      return <span>{text}</span>;
    }

    const regex = new RegExp(`\\b(${pageTargetWords.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      const lower = part.toLowerCase();
      if (pageTargetWords.includes(lower) && VOCABULARY_LIST[lower]) {
        const isCoreTarget = ['went', 'saw', 'found', 'helped'].includes(lower);
        return (
          <button
            key={index}
            onClick={(e) => handleWordClick(lower, e)}
            className={`inline-block font-semibold px-1 py-0.5 mx-0.5 rounded-md transition-all cursor-pointer ${
              isCoreTarget
                ? 'text-amber-900 bg-amber-200/70 hover:bg-amber-300 underline decoration-amber-500 decoration-2 underline-offset-4 shadow-xs'
                : 'text-emerald-900 bg-emerald-100/70 hover:bg-emerald-200 underline decoration-emerald-500 decoration-1 underline-offset-4'
            }`}
            title="단어 뜻 보기"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col min-h-[calc(100vh-4rem)] p-3 sm:p-4">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-amber-900 text-sm sm:text-base">
            Page {page.pageNumber} / {totalPages}
          </span>
          <span className="text-stone-300">·</span>
          <span className="text-xs text-stone-500 font-medium truncate max-w-[180px] sm:max-w-xs">
            {page.title}
          </span>
        </div>

        {/* Translation Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              soundEffects.playPop();
              setShowKoreanTranslation(!showKoreanTranslation);
            }}
            className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${
              showKoreanTranslation
                ? 'bg-amber-100 border-amber-300 text-amber-900 font-semibold'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {showKoreanTranslation ? '한국어 숨기기' : '한국어 번역'}
          </button>
        </div>
      </div>

      {/* Main Illustration Area */}
      <div className="bg-white rounded-3xl p-3 sm:p-4 shadow-xs border border-amber-200/60 mb-4 transition-all overflow-hidden relative">
        <StoryIllustration scene={page.illustrationScene} className="w-full h-auto max-h-56 sm:max-h-64 object-contain rounded-2xl" />
        
        {/* Underlined Word Discovery Tip */}
        <div className="absolute top-5 right-5 bg-amber-50/90 backdrop-blur-xs border border-amber-200/80 px-2 py-1 rounded-lg text-[11px] font-medium text-amber-800 flex items-center gap-1 shadow-xs pointer-events-none">
          <Sparkles className="w-3 h-3 text-amber-600" />
          <span>밑줄 단어를 눌러보세요</span>
        </div>
      </div>

      {/* Story Text Area */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-amber-100 flex-1 flex flex-col justify-between mb-4">
        <div className="space-y-3.5">
          {page.sentences.map((sentence, idx) => {
            const isSpeaking = speakingSentenceIndex === idx;
            const isSelected = selectedSentenceIndex === idx;

            return (
              <div
                key={sentence.id}
                onClick={() => handleSentenceClick(idx)}
                className={`p-3.5 rounded-2xl transition-all cursor-pointer border-2 relative ${
                  isSpeaking
                    ? 'bg-yellow-200 border-yellow-400 shadow-md ring-4 ring-yellow-300 text-stone-950 font-semibold scale-[1.015]'
                    : isSelected
                    ? 'bg-amber-100/90 border-amber-300 ring-2 ring-amber-300/70 text-stone-950 font-semibold shadow-xs'
                    : 'bg-stone-50/70 hover:bg-amber-50/60 border-stone-200/60 hover:border-amber-200 text-stone-900'
                }`}
              >
                {/* Sentence Header Status Bar */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1">
                    <span>문장 {idx + 1}</span>
                  </span>

                  {isSpeaking ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-950 bg-yellow-300/90 px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                      <Volume2 className="w-3.5 h-3.5 text-amber-900" />
                      <span>소리 내어 읽는 중...</span>
                    </span>
                  ) : isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full shadow-xs">
                      <Volume2 className="w-3.5 h-3.5 text-amber-800" />
                      <span>선택됨 · 다시 듣기</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-stone-400 hover:text-amber-800 transition-colors">
                      <Volume2 className="w-3 h-3" />
                      <span>클릭하여 듣기</span>
                    </span>
                  )}
                </div>

                <div className="text-base sm:text-lg text-stone-950 leading-relaxed font-medium">
                  {renderInteractiveText(sentence.text)}
                </div>
                {showKoreanTranslation && sentence.koreanText && (
                  <div className="text-xs sm:text-sm text-stone-600 mt-1.5 font-normal animate-in fade-in duration-150">
                    {sentence.koreanText}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Audio & Reading Action Deck (3 Spacious Buttons) */}
        <div className="mt-5 pt-4 border-t border-stone-100">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Play / Stop Button */}
            <button
              onClick={isPlayingAll ? handleStopAudio : playEntirePageAudio}
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-xs ${
                isPlayingAll
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isPlayingAll ? (
                <>
                  <Square className="w-4 h-4 fill-current" />
                  <span>정지</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>본문 듣기</span>
                </>
              )}
            </button>

            {/* Replay Button */}
            <button
              onClick={handleReplay}
              className="py-3 px-3 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-stone-500" />
              <span>다시 듣기</span>
            </button>

            {/* Self-check Read Complete Button */}
            <button
              onClick={handleReadComplete}
              className={`py-3 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-transform active:scale-95 shadow-xs ${
                isRead
                  ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              <CheckCircle2 className={`w-4 h-4 ${isRead ? 'text-emerald-600' : 'text-white'}`} />
              <span>{isRead ? '읽기 완료 ✓' : '읽기 완료'}</span>
            </button>
          </div>

          {!isRead && !canNavigateFreely && (
            <p className="text-[11px] text-center text-stone-500 mt-2 font-medium flex items-center justify-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>본문을 스스로 소리 내어 읽은 후 [읽기 완료]를 누르면 다음으로 갈 수 있어요!</span>
            </p>
          )}
        </div>
      </div>

      {/* Bottom Navigation Controls: [이전] / [다음] */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => {
            soundEffects.playPageFlip();
            onPrev();
          }}
          disabled={page.pageNumber === 1}
          className={`px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1 transition-all ${
            page.pageNumber === 1
              ? 'opacity-40 cursor-not-allowed text-stone-400 bg-stone-100'
              : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 active:scale-95'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>이전</span>
        </button>

        <div className="text-xs text-stone-400 font-medium">
          {page.clueQuestionIndex !== undefined ? '✨ 다음은 단서 퀴즈!' : `Page ${page.pageNumber}`}
        </div>

        <button
          onClick={() => {
            soundEffects.playPageFlip();
            onNext();
          }}
          disabled={!isRead && !canNavigateFreely}
          className={`px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1 transition-all shadow-xs ${
            isRead || canNavigateFreely
              ? 'bg-stone-900 hover:bg-stone-800 text-white active:scale-95 cursor-pointer'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>{page.clueQuestionIndex !== undefined ? '단서 질문 풀기' : '다음'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Modal Popup for Underlined Words */}
      <WordPopupModal
        wordData={selectedWord}
        onClose={() => setSelectedWord(null)}
        speed={1.0}
      />
    </div>
  );
};
