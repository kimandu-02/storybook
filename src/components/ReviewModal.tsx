import React from 'react';
import { X, Volume2, HelpCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { ClueQuestion, PastTenseMatchItem } from '../types';
import { soundEffects, ttsEngine } from '../utils/audio';

interface ReviewModalProps {
  missedQuestions: {
    question: ClueQuestion;
    chosenChoiceId: string;
  }[];
  missedVerbs: PastTenseMatchItem[];
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  missedQuestions,
  missedVerbs,
  onClose,
}) => {
  const handleSpeak = (text: string) => {
    soundEffects.playPop();
    ttsEngine.speakText(text, { rate: 1.0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border-2 border-amber-200 max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-amber-100/80 px-5 py-4 flex items-center justify-between border-b border-amber-200">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-800" />
            <h3 className="font-display font-bold text-amber-950 text-base sm:text-lg">
              틀린 항목 복습 (Review Missed Items)
            </h3>
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

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 flex-1">
          {/* Missed Questions Section */}
          {missedQuestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>첫 시도에서 놓친 내용 질문 ({missedQuestions.length}개)</span>
              </h4>

              <div className="space-y-3">
                {missedQuestions.map(({ question, chosenChoiceId }) => {
                  const wrongChoice = question.choices.find((c) => c.id === chosenChoiceId);
                  const correctChoice = question.choices.find((c) => c.id === question.correctChoiceId);

                  return (
                    <div
                      key={question.id}
                      className="bg-amber-50/50 rounded-2xl p-4 border border-amber-200/80 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-md">
                            Question {question.questionNumber}
                          </span>
                          <div className="text-sm sm:text-base font-semibold text-stone-900 mt-1">
                            {question.questionText}
                          </div>
                          <div className="text-xs text-stone-500">
                            {question.koreanQuestion}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSpeak(question.questionText)}
                          className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg shrink-0"
                          title="질문 듣기"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* What user picked vs Correct Answer */}
                      <div className="space-y-1.5 text-xs sm:text-sm">
                        {wrongChoice && (
                          <div className="bg-rose-50 text-rose-900 p-2.5 rounded-xl border border-rose-200 flex items-center justify-between">
                            <span>
                              <strong className="text-rose-700">처음 선택: </strong>
                              {wrongChoice.text}
                            </span>
                            <span className="text-xs text-rose-500 font-medium">오답</span>
                          </div>
                        )}

                        {correctChoice && (
                          <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                            <span>
                              <strong className="text-emerald-700">정답: </strong>
                              {correctChoice.text}
                            </span>
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 정답
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Explanation */}
                      <div className="bg-white p-3 rounded-xl border border-stone-200 text-xs text-stone-600 leading-relaxed">
                        <strong className="text-stone-900">💡 설명: </strong>
                        {question.explanation}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Missed Past Tense Matching Verbs */}
          {missedVerbs.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>복습할 핵심 과거형 단어 ({missedVerbs.length}개)</span>
              </h4>

              <div className="space-y-2.5">
                {missedVerbs.map((verbItem) => (
                  <div
                    key={verbItem.id}
                    className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold font-display text-emerald-950">
                          {verbItem.verb}
                        </span>
                        <span className="text-xs text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                          원형: {verbItem.baseVerb}
                        </span>
                        <span className="text-xs text-stone-600 font-medium">
                          ({verbItem.meaning})
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm text-stone-700 mt-1 font-medium">
                        &quot;{verbItem.actionText}&quot;
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {verbItem.koreanAction}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSpeak(verbItem.actionText)}
                      className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors shrink-0"
                      title="발음 듣기"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-end">
          <button
            onClick={() => {
              soundEffects.playPop();
              onClose();
            }}
            className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors active:scale-98"
          >
            복습 완료 (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
