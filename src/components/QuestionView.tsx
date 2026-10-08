import React, { useState, useEffect } from 'react';
import { Volume2, CheckCircle2, RotateCcw, ArrowRight, ArrowLeft, HelpCircle, Sparkles, XCircle } from 'lucide-react';
import { ClueQuestion, QuestionState } from '../types';
import { soundEffects, ttsEngine } from '../utils/audio';

interface QuestionViewProps {
  question: ClueQuestion;
  totalQuestions: number;
  savedState?: QuestionState;
  onSaveAttempt: (questionIndex: number, state: QuestionState) => void;
  onContinue: () => void;
  onPrevStory: () => void;
  isLastQuestion: boolean;
}

export const QuestionView: React.FC<QuestionViewProps> = ({
  question,
  totalQuestions,
  savedState,
  onSaveAttempt,
  onContinue,
  onPrevStory,
  isLastQuestion,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(
    savedState ? savedState.finalChoiceId || savedState.firstChoiceId : null
  );
  const [attemptsCount, setAttemptsCount] = useState<number>(savedState ? savedState.attemptsCount : 0);
  const [isResolved, setIsResolved] = useState<boolean>(savedState ? savedState.isResolved : false);
  const [showHint, setShowHint] = useState<boolean>(
    savedState ? savedState.attemptsCount === 1 && !savedState.isResolved : false
  );

  // Sync state if question changes or savedState updates
  useEffect(() => {
    if (savedState) {
      setSelectedChoiceId(savedState.finalChoiceId || savedState.firstChoiceId);
      setAttemptsCount(savedState.attemptsCount);
      setIsResolved(savedState.isResolved);
      setShowHint(savedState.attemptsCount === 1 && !savedState.isResolved);
    } else {
      setSelectedChoiceId(null);
      setAttemptsCount(0);
      setIsResolved(false);
      setShowHint(false);
    }
  }, [question.id, savedState]);

  const handleSpeakQuestion = () => {
    soundEffects.playPop();
    ttsEngine.speakText(question.questionText, { rate: 1.0 });
  };

  const handleSpeakChoice = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playPop();
    ttsEngine.speakText(text, { rate: 1.0 });
  };

  const handleSelectChoice = (choiceId: string) => {
    soundEffects.playPop();
    const isCorrect = choiceId === question.correctChoiceId;

    if (attemptsCount === 0) {
      // FIRST ATTEMPT
      setSelectedChoiceId(choiceId);
      setAttemptsCount(1);

      if (isCorrect) {
        setIsResolved(true);
        setShowHint(false);
        soundEffects.playSuccessChime();
        onSaveAttempt(question.questionNumber - 1, {
          firstChoiceId: choiceId,
          finalChoiceId: choiceId,
          attemptsCount: 1,
          isResolved: true,
          isCorrect: true,
        });
      } else {
        // Incorrect on first attempt: give hint and allow 1 retry
        setShowHint(true);
        soundEffects.playTryAgainBoop();
        onSaveAttempt(question.questionNumber - 1, {
          firstChoiceId: choiceId,
          finalChoiceId: choiceId,
          attemptsCount: 1,
          isResolved: false,
          isCorrect: false,
        });
      }
    } else {
      // SUBSEQUENT ATTEMPT (Retry or updating answer)
      setSelectedChoiceId(choiceId);
      setAttemptsCount((prev) => Math.max(prev, 2));
      setIsResolved(true);
      setShowHint(false);

      const firstChoice = savedState?.firstChoiceId || selectedChoiceId || choiceId;

      if (isCorrect) {
        soundEffects.playSuccessChime();
      } else {
        soundEffects.playTryAgainBoop();
      }

      onSaveAttempt(question.questionNumber - 1, {
        firstChoiceId: firstChoice,
        finalChoiceId: choiceId,
        attemptsCount: Math.max(attemptsCount, 2),
        isResolved: true,
        // If the student chooses correctly on retry, mark as correct!
        isCorrect: isCorrect,
      });
    }
  };

  const handleResetForRetry = () => {
    soundEffects.playPop();
    setSelectedChoiceId(null);
  };

  const isCurrentChoiceCorrect = selectedChoiceId === question.correctChoiceId;
  const isWaitingRetry = attemptsCount === 1 && !isResolved;
  const correctChoice = question.choices.find((c) => c.id === question.correctChoiceId);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col min-h-[calc(100vh-4rem)] p-3 sm:p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-amber-100 text-amber-900 font-bold px-2.5 py-1 rounded-lg text-xs font-display">
            Question {question.questionNumber} / {totalQuestions}
          </span>
          <span className="text-xs text-stone-500 font-medium">
            단서 퀴즈 (Page {question.pageNumber} 연결)
          </span>
        </div>

        <button
          onClick={handleSpeakQuestion}
          className="p-2 text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-xl transition-colors active:scale-95 flex items-center gap-1 text-xs font-semibold"
          title="질문 듣기"
        >
          <Volume2 className="w-4 h-4" />
          <span className="hidden sm:inline">질문 듣기</span>
        </button>
      </div>

      {/* Main Question Box */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-amber-200/80 mb-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">🧐</span>
          <div>
            <h2 className="text-base sm:text-lg font-bold font-display text-stone-900 leading-snug">
              {question.questionText}
            </h2>
            <p className="text-xs sm:text-sm text-stone-500 mt-1 font-normal">
              {question.koreanQuestion}
            </p>
          </div>
        </div>
      </div>

      {/* 3 Choices Deck */}
      <div className="space-y-3 flex-1 mb-4">
        {question.choices.map((choice, index) => {
          const isSelected = selectedChoiceId === choice.id;
          const isTheCorrectOne = choice.id === question.correctChoiceId;

          let containerStyle = 'bg-white hover:bg-amber-50/60 border-stone-200 text-stone-800';
          let badgeStyle = 'bg-stone-100 text-stone-700';

          if (selectedChoiceId) {
            if (isSelected) {
              if (isTheCorrectOne) {
                containerStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 ring-2 ring-emerald-300';
                badgeStyle = 'bg-emerald-600 text-white';
              } else {
                containerStyle = 'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-200';
                badgeStyle = 'bg-rose-500 text-white';
              }
            } else if (isResolved && isTheCorrectOne) {
              // Highlight correct answer if resolved
              containerStyle = 'bg-emerald-50/80 border-emerald-300 text-emerald-950';
              badgeStyle = 'bg-emerald-500 text-white';
            }
          }

          return (
            <div
              key={choice.id}
              onClick={() => handleSelectChoice(choice.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between shadow-xs ${containerStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold font-display shrink-0 ${badgeStyle}`}>
                  {index + 1}
                </span>
                <div>
                  <div className="text-sm sm:text-base font-semibold leading-snug">
                    {choice.text}
                  </div>
                  <div className="text-xs text-stone-500 mt-0.5">
                    {choice.koreanText}
                  </div>
                </div>
              </div>

              {/* TTS Listen Button for Choice */}
              <button
                onClick={(e) => handleSpeakChoice(choice.text, e)}
                className="p-2 text-stone-400 hover:text-amber-700 hover:bg-amber-100/50 rounded-lg transition-colors shrink-0 ml-2"
                title="보기 발음 듣기"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Feedback & Hint Panel */}
      <div className="space-y-3 mb-4">
        {/* State 1: Incorrect on 1st attempt -> Hint + Retry Button */}
        {isWaitingRetry && (
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 text-amber-900 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-950">
                <RotateCcw className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
                <span>🔁 다시 선택해 보세요! (1회 재시도 기회)</span>
              </div>
              <button
                onClick={handleResetForRetry}
                className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs active:scale-95 transition-transform"
              >
                선택 초기화
              </button>
            </div>

            {showHint && (
              <div className="text-xs sm:text-sm bg-white/80 p-3 rounded-xl border border-amber-200/70 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-amber-950 font-semibold">단서 힌트: </strong>
                  {question.hint}
                </span>
              </div>
            )}
          </div>
        )}

        {/* State 2: Resolved -> Correct OR Clearly Incorrect Explanation */}
        {isResolved && (
          <div
            className={`rounded-2xl p-4 border space-y-2.5 animate-in fade-in duration-150 ${
              isCurrentChoiceCorrect
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              {isCurrentChoiceCorrect ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-emerald-900">✅ 딩동댕! 정답입니다!</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span className="text-rose-900">
                    ❌ 아쉬워요! 정답은 <strong>&quot;{correctChoice?.text}&quot;</strong> 입니다.
                  </span>
                </>
              )}
            </div>

            <div className="text-xs sm:text-sm leading-relaxed pl-7 text-stone-700 bg-white/70 p-3 rounded-xl border border-stone-200/60">
              <strong className="text-stone-900 mr-1">💡 단서 해설:</strong>
              {question.explanation}
            </div>
          </div>
        )}
      </div>

      {/* Dual Navigation Controls: ALWAYS ALLOWS PREV AND NEXT */}
      <div className="pt-2 flex items-center justify-between gap-3">
        {/* Prev Story Page Button */}
        <button
          onClick={() => {
            soundEffects.playPageFlip();
            onPrevStory();
          }}
          className="py-3 px-4 rounded-2xl font-semibold text-xs sm:text-sm bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 active:scale-95 transition-all flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>이전 본문 (Page {question.pageNumber})</span>
        </button>

        {/* Forward / Continue Button */}
        <button
          onClick={() => {
            soundEffects.playPageFlip();
            onContinue();
          }}
          className={`flex-1 py-3 px-4 rounded-2xl font-bold font-display text-xs sm:text-base flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer active:scale-98 ${
            isResolved
              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-200'
              : 'bg-stone-800 hover:bg-stone-900 text-white'
          }`}
        >
          {isLastQuestion ? (
            <>
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>이야기 정리하러 가기 (Wrap-up)</span>
            </>
          ) : (
            <>
              <span>{isResolved ? '다음 본문으로' : '다음 본문으로 넘어가기'}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
