import React, { useState } from 'react';
import { RotateCcw, Volume2, Award, Sparkles, CheckCircle2, ChevronRight, BookOpen } from 'lucide-react';
import { ClueQuestion, PastTenseMatchItem, QuestionState, StorySummarySentences } from '../types';
import { CLUE_QUESTIONS, PAST_TENSE_MATCH_ITEMS } from '../data/storyData';
import { ForestDetectiveBadgeSVG } from './StoryIllustrations';
import { soundEffects, ttsEngine } from '../utils/audio';
import { ReviewModal } from './ReviewModal';

interface ResultViewProps {
  questionStates: Record<number, QuestionState>;
  matchingFirstAttemptScore: number;
  sequenceCompleted: boolean;
  completedSentences: StorySummarySentences;
  onRestart: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  questionStates,
  matchingFirstAttemptScore,
  sequenceCompleted,
  completedSentences,
  onRestart,
}) => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeSpeakingSentenceIndex, setActiveSpeakingSentenceIndex] = useState<number | null>(null);

  // Calculate question score: if user got it right (either first attempt or retry), count as correct!
  let questionScore = 0;
  const missedQuestions: { question: ClueQuestion; chosenChoiceId: string }[] = [];

  CLUE_QUESTIONS.forEach((q, idx) => {
    const qState = questionStates[idx];
    if (qState && qState.isCorrect) {
      questionScore += 1;
    } else if (qState && !qState.isCorrect) {
      missedQuestions.push({
        question: q,
        chosenChoiceId: qState.finalChoiceId || qState.firstChoiceId,
      });
    }
  });

  // Calculate missed verbs based on matchingFirstAttemptScore
  const missedVerbs: PastTenseMatchItem[] = matchingFirstAttemptScore < 4 ? PAST_TENSE_MATCH_ITEMS : [];

  const totalMissedCount = missedQuestions.length + missedVerbs.length;
  const hasMissedItems = totalMissedCount > 0;

  const handleSpeakSentence = (text: string, index: number) => {
    soundEffects.playPop();
    setActiveSpeakingSentenceIndex(index);
    ttsEngine.speakText(text, {
      rate: 1.0,
      onEnd: () => setActiveSpeakingSentenceIndex(null),
      onError: () => setActiveSpeakingSentenceIndex(null),
    });
  };

  const handleSpeakAllSentences = () => {
    soundEffects.playPop();
    const all = [completedSentences.first, completedSentences.then, completedSentences.finally];
    ttsEngine.speakSentenceSequence(all, {
      onSentenceChange: (idx) => {
        setActiveSpeakingSentenceIndex(idx);
      },
      onComplete: () => {
        setActiveSpeakingSentenceIndex(null);
      },
      onError: () => {
        setActiveSpeakingSentenceIndex(null);
      },
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col min-h-[calc(100vh-4rem)] p-3 sm:p-4">
      {/* Top Completion Header with Badge */}
      <div className="bg-gradient-to-b from-amber-100/90 to-amber-50/50 rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-sm text-center space-y-3 mb-4">
        {/* Animated Badge */}
        <div className="flex justify-center -mt-2">
          <div className="relative group transform hover:scale-105 transition-transform">
            <ForestDetectiveBadgeSVG className="w-28 h-28 sm:w-32 sm:h-32 drop-shadow-md" />
            <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
              OFFICIAL
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center gap-1.5 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <Award className="w-4 h-4 text-amber-600" />
            <span>수료 완료 · Forest Detective Certificate</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-stone-900 mt-1">
            축하합니다! 이야기 탐정 배지 획득! 🏅
          </h1>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            Pip과 함께 사라진 도토리의 비밀을 풀고 사건을 멋지게 정리했어요!
          </p>
        </div>
      </div>

      {/* Actual First Response Scores Deck */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-stone-200/80 space-y-3.5 mb-4">
        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
          나의 탐정 학습 결과 (My Learning Results)
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Score 1: Content Questions */}
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70">
            <div className="text-xs text-amber-800 font-medium">내용 질문 (단서 퀴즈)</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-bold font-display text-amber-950">
                {questionScore}
              </span>
              <span className="text-stone-400 font-bold text-sm">/ 4</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              {questionScore === 4 ? '🎉 완벽한 독해력!' : `${questionScore}문제 정답 달성!`}
            </div>
          </div>

          {/* Score 2: Past Tense Match */}
          <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-200/70">
            <div className="text-xs text-emerald-800 font-medium">과거형 연결 (핵심 동사)</div>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl sm:text-3xl font-bold font-display text-emerald-950">
                {matchingFirstAttemptScore}
              </span>
              <span className="text-stone-400 font-bold text-sm">/ 4</span>
            </div>
            <div className="text-[11px] text-stone-500 mt-1">
              {matchingFirstAttemptScore === 4 ? '✨ 과거형 마스터!' : `${matchingFirstAttemptScore}개 연결 완료`}
            </div>
          </div>
        </div>

        {/* Story Sequencing & Read Sentence Summary */}
        <div className="space-y-2 pt-1">
          <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between text-xs sm:text-sm">
            <span className="text-stone-700 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>사건 3장 순서 배열:</span>
            </span>
            <span className="font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-md">
              {sequenceCompleted ? '완료됨 (3 / 3)' : '진행중'}
            </span>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>내가 완성하고 녹음한 탐정 이야기 (3문장):</span>
              </span>
              <button
                onClick={handleSpeakAllSentences}
                className="py-1 px-2.5 text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold active:scale-95 shadow-xs cursor-pointer"
                title="3문장 전체 연속 듣기"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>전체 듣기</span>
              </button>
            </div>

            <div className="space-y-2 text-xs sm:text-sm font-semibold text-stone-900">
              <div
                onClick={() => handleSpeakSentence(completedSentences.first, 0)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  activeSpeakingSentenceIndex === 0
                    ? 'bg-yellow-200 border-yellow-400 ring-2 ring-yellow-300 shadow-xs scale-[1.01]'
                    : 'bg-white border-amber-200/60 hover:bg-amber-50/50 shadow-xs'
                }`}
              >
                <span>1. {completedSentences.first}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeakSentence(completedSentences.first, 0);
                  }}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                    activeSpeakingSentenceIndex === 0 ? 'text-amber-950 bg-yellow-300' : 'text-amber-700 hover:bg-amber-100'
                  }`}
                  title="이 문장 듣기"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                onClick={() => handleSpeakSentence(completedSentences.then, 1)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  activeSpeakingSentenceIndex === 1
                    ? 'bg-yellow-200 border-yellow-400 ring-2 ring-yellow-300 shadow-xs scale-[1.01]'
                    : 'bg-white border-amber-200/60 hover:bg-amber-50/50 shadow-xs'
                }`}
              >
                <span>2. {completedSentences.then}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeakSentence(completedSentences.then, 1);
                  }}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                    activeSpeakingSentenceIndex === 1 ? 'text-amber-950 bg-yellow-300' : 'text-amber-700 hover:bg-amber-100'
                  }`}
                  title="이 문장 듣기"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div
                onClick={() => handleSpeakSentence(completedSentences.finally, 2)}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                  activeSpeakingSentenceIndex === 2
                    ? 'bg-yellow-200 border-yellow-400 ring-2 ring-yellow-300 shadow-xs scale-[1.01]'
                    : 'bg-white border-amber-200/60 hover:bg-amber-50/50 shadow-xs'
                }`}
              >
                <span>3. {completedSentences.finally}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeakSentence(completedSentences.finally, 2);
                  }}
                  className={`p-1.5 rounded-lg transition-colors shrink-0 cursor-pointer ${
                    activeSpeakingSentenceIndex === 2 ? 'text-amber-950 bg-yellow-300' : 'text-amber-700 hover:bg-amber-100'
                  }`}
                  title="이 문장 듣기"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions: [틀린 항목 복습] & [다시 읽기] */}
      <div className="space-y-2.5 mt-auto pt-2">
        {/* Review Missed Items Button */}
        <button
          onClick={() => {
            soundEffects.playPop();
            setShowReviewModal(true);
          }}
          disabled={!hasMissedItems}
          className={`w-full py-3.5 px-4 rounded-2xl font-bold font-display text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xs ${
            hasMissedItems
              ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-98 shadow-amber-200'
              : 'bg-stone-100 text-stone-400 border border-stone-200 cursor-not-allowed'
          }`}
        >
          {hasMissedItems ? (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>틀린 항목 복습 ({totalMissedCount}개)</span>
              <ChevronRight className="w-4 h-4" />
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-stone-500 font-medium">모든 항목을 올바르게 맞혔어요! (완벽한 탐정)</span>
            </div>
          )}
        </button>

        {/* Read Again Button */}
        <button
          onClick={() => {
            soundEffects.playPageFlip();
            onRestart();
          }}
          className="w-full py-3 px-4 bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-800 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 active:scale-98 transition-all"
        >
          <BookOpen className="w-4 h-4 text-stone-500" />
          <span>다시 읽기 (Read Story Again)</span>
        </button>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          missedQuestions={missedQuestions}
          missedVerbs={missedVerbs}
          onClose={() => setShowReviewModal(false)}
        />
      )}
    </div>
  );
};
