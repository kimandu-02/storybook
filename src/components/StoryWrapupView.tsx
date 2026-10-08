import React, { useState, useRef, useEffect } from 'react';
import { Volume2, CheckCircle2, RotateCcw, ArrowRight, ArrowUp, ArrowDown, Mic, Square, Play, Sparkles, Check } from 'lucide-react';
import { PastTenseMatchItem, StorySequenceCard, StorySummarySentences } from '../types';
import { STORY_SEQUENCE_CARDS, PAST_TENSE_MATCH_ITEMS, SENTENCE_BUILDER_DATA } from '../data/storyData';
import { soundEffects, ttsEngine, createSimulatedAudioBlob } from '../utils/audio';

interface StoryWrapupViewProps {
  onFinishWrapup: (results: {
    sequenceCompleted: boolean;
    matchingFirstAttemptScore: number;
    matchingFinalPairs: Record<string, string>;
    completedSentences: StorySummarySentences;
  }) => void;
}

export const StoryWrapupView: React.FC<StoryWrapupViewProps> = ({
  onFinishWrapup,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // -------------------------------------------------------------
  // STEP 1 STATE: Sequence 3 Cards
  // -------------------------------------------------------------
  const [cardsOrder, setCardsOrder] = useState<StorySequenceCard[]>([
    STORY_SEQUENCE_CARDS[1],
    STORY_SEQUENCE_CARDS[0],
    STORY_SEQUENCE_CARDS[2],
  ]);
  const [sequenceChecked, setSequenceChecked] = useState(false);
  const [sequenceIsCorrect, setSequenceIsCorrect] = useState(false);

  const moveCard = (index: number, direction: 'up' | 'down') => {
    soundEffects.playPop();
    const newOrder = [...cardsOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    setCardsOrder(newOrder);
    setSequenceChecked(false);
  };

  const handleCheckSequence = () => {
    soundEffects.playPop();
    const isCorrect =
      cardsOrder[0].orderNumber === 1 &&
      cardsOrder[1].orderNumber === 2 &&
      cardsOrder[2].orderNumber === 3;

    setSequenceChecked(true);
    setSequenceIsCorrect(isCorrect);

    if (isCorrect) {
      soundEffects.playSuccessChime();
    } else {
      soundEffects.playTryAgainBoop();
    }
  };

  const handleResetSequence = () => {
    soundEffects.playPop();
    setCardsOrder([
      STORY_SEQUENCE_CARDS[1],
      STORY_SEQUENCE_CARDS[0],
      STORY_SEQUENCE_CARDS[2],
    ]);
    setSequenceChecked(false);
    setSequenceIsCorrect(false);
  };

  // -------------------------------------------------------------
  // STEP 2 STATE: Past Tense 4 Match (Bidirectional)
  // -------------------------------------------------------------
  const [selectedVerbId, setSelectedVerbId] = useState<string | null>(null);
  const [selectedActionTargetId, setSelectedActionTargetId] = useState<string | null>(null);
  const [currentPairs, setCurrentPairs] = useState<Record<string, string>>({}); // verbId -> targetId
  const [matchingChecked, setMatchingChecked] = useState(false);
  const [matchingScore, setMatchingScore] = useState<number>(4);

  const [actionTargets] = useState<PastTenseMatchItem[]>([
    PAST_TENSE_MATCH_ITEMS[1], // saw
    PAST_TENSE_MATCH_ITEMS[3], // helped
    PAST_TENSE_MATCH_ITEMS[0], // went
    PAST_TENSE_MATCH_ITEMS[2], // found
  ]);

  const handleSelectVerb = (verbId: string) => {
    soundEffects.playPop();
    if (selectedActionTargetId) {
      setCurrentPairs((prev) => ({
        ...prev,
        [verbId]: selectedActionTargetId,
      }));
      setSelectedVerbId(null);
      setSelectedActionTargetId(null);
      setMatchingChecked(false);
    } else {
      setSelectedVerbId((prev) => (prev === verbId ? null : verbId));
      setSelectedActionTargetId(null);
    }
  };

  const handleSelectAction = (targetId: string) => {
    soundEffects.playPop();
    if (selectedVerbId) {
      setCurrentPairs((prev) => ({
        ...prev,
        [selectedVerbId]: targetId,
      }));
      setSelectedVerbId(null);
      setSelectedActionTargetId(null);
      setMatchingChecked(false);
    } else {
      setSelectedActionTargetId((prev) => (prev === targetId ? null : targetId));
      setSelectedVerbId(null);
    }
  };

  const handleDisconnect = (verbId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playPop();
    setCurrentPairs((prev) => {
      const copy = { ...prev };
      delete copy[verbId];
      return copy;
    });
    setMatchingChecked(false);
  };

  const handleCheckMatching = () => {
    soundEffects.playPop();
    let correctCount = 0;
    PAST_TENSE_MATCH_ITEMS.forEach((item) => {
      if (currentPairs[item.id] === item.matchTargetId) {
        correctCount += 1;
      }
    });

    setMatchingScore(correctCount);
    setMatchingChecked(true);

    if (correctCount === 4) {
      soundEffects.playSuccessChime();
    } else {
      soundEffects.playTryAgainBoop();
    }
  };

  const handleResetMatching = () => {
    soundEffects.playPop();
    setCurrentPairs({});
    setSelectedVerbId(null);
    setSelectedActionTargetId(null);
    setMatchingChecked(false);
  };

  // -------------------------------------------------------------
  // STEP 3 STATE: Sentence Builder & Aloud Recording (First, Then, Finally)
  // -------------------------------------------------------------
  type SentencePhase = 'First' | 'Then' | 'Finally';
  const [currentSentencePhase, setCurrentSentencePhase] = useState<SentencePhase>('First');

  // Completed sentence data store
  const [sentenceParts, setSentenceParts] = useState<
    Record<SentencePhase, { subject: string; predicate: string; readComplete: boolean }>
  >({
    First: { subject: '', predicate: '', readComplete: false },
    Then: { subject: '', predicate: '', readComplete: false },
    Finally: { subject: '', predicate: '', readComplete: false },
  });

  // Audio Recording (MediaRecorder API + Safe Simulated Recording Fallback)
  const [isRecording, setIsRecording] = useState(false);
  const [isSimulatedRecording, setIsSimulatedRecording] = useState(false);
  const [isSpeakingActiveSentence, setIsSpeakingActiveSentence] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordError, setRecordError] = useState<string | null>(null);
  const [recordingBlobUrls, setRecordingBlobUrls] = useState<Record<SentencePhase, string | null>>({
    First: null,
    Then: null,
    Finally: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up recorded audio object URLs and streams on unmount
  useEffect(() => {
    return () => {
      Object.values(recordingBlobUrls).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [recordingBlobUrls]);

  const activeBuilderData = SENTENCE_BUILDER_DATA[currentSentencePhase];
  const activeSubject = sentenceParts[currentSentencePhase].subject;
  const activePredicate = sentenceParts[currentSentencePhase].predicate;
  const isBothSelected = activeSubject.length > 0 && activePredicate.length > 0;
  
  // REAL CORRECTNESS CHECK:
  const isSubjectCorrect = activeSubject === activeBuilderData.correctSubject;
  const isPredicateCorrect = activePredicate === activeBuilderData.correctPredicate;
  const isCurrentSentenceCorrect = isBothSelected && isSubjectCorrect && isPredicateCorrect;

  const getFullSentence = (phase: SentencePhase) => {
    const data = sentenceParts[phase];
    return `${phase}, ${data.subject || '...'} ${data.predicate || '...'}.`;
  };

  const handleSelectSubject = (subj: string) => {
    soundEffects.playPop();
    const willBeCorrect = subj === activeBuilderData.correctSubject && activePredicate === activeBuilderData.correctPredicate;
    if (activePredicate.length > 0) {
      if (willBeCorrect) {
        soundEffects.playSuccessChime();
      } else {
        soundEffects.playTryAgainBoop();
      }
    }
    setSentenceParts((prev) => ({
      ...prev,
      [currentSentencePhase]: {
        ...prev[currentSentencePhase],
        subject: subj,
        // Reset read complete if answer becomes incorrect
        readComplete: willBeCorrect ? prev[currentSentencePhase].readComplete : false,
      },
    }));
  };

  const handleSelectPredicate = (pred: string) => {
    soundEffects.playPop();
    const willBeCorrect = activeSubject === activeBuilderData.correctSubject && pred === activeBuilderData.correctPredicate;
    if (activeSubject.length > 0) {
      if (willBeCorrect) {
        soundEffects.playSuccessChime();
      } else {
        soundEffects.playTryAgainBoop();
      }
    }
    setSentenceParts((prev) => ({
      ...prev,
      [currentSentencePhase]: {
        ...prev[currentSentencePhase],
        predicate: pred,
        // Reset read complete if answer becomes incorrect
        readComplete: willBeCorrect ? prev[currentSentencePhase].readComplete : false,
      },
    }));
  };

  // TTS Model pronunciation with visual sentence highlight
  const handleSpeakActiveSentence = () => {
    soundEffects.playPop();
    const sentenceToSpeak = `${currentSentencePhase}, ${activeSubject} ${activePredicate}.`;
    setIsSpeakingActiveSentence(true);
    ttsEngine.speakText(sentenceToSpeak, {
      rate: 1.0,
      onEnd: () => setIsSpeakingActiveSentence(false),
      onError: () => setIsSpeakingActiveSentence(false),
    });
  };

  // Safe simulated recording launcher (used when microphone permission is denied or device not found)
  const startSimulatedRecording = (wasDenied = false) => {
    setIsSimulatedRecording(true);
    setIsRecording(true);
    setRecordingSeconds(0);
    if (wasDenied) {
      setRecordError('마이크 권한이 차단된 환경(미리보기/보안 환경)이어서 [연습 녹음 모드]로 안전하게 진행됩니다. ⏹️ 녹음 중지를 누르면 연습 녹음본이 생성되어 바로 재생할 수 있습니다.');
    }

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  // Start voice recording with MediaRecorder (auto-falls back to simulated recording on permission denied)
  const handleStartRecording = async () => {
    soundEffects.playPop();
    setRecordError(null);

    // If mediaDevices is not supported in current iframe/environment
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      startSimulatedRecording(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];
      setIsSimulatedRecording(false);

      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || options.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(audioBlob);

        setRecordingBlobUrls((prev) => ({
          ...prev,
          [currentSentencePhase]: url,
        }));

        setSentenceParts((prev) => ({
          ...prev,
          [currentSentencePhase]: {
            ...prev[currentSentencePhase],
            readComplete: true,
          },
        }));

        soundEffects.playSuccessChime();

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      // Permission denied or microphone unavailable:
      // Smoothly switch to Simulated Recording mode so the learner can still record, test playback, and progress!
      startSimulatedRecording(true);
    }
  };

  // Stop voice recording (handles both real and simulated recording)
  const handleStopRecording = () => {
    soundEffects.playPop();
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (isSimulatedRecording) {
      const simulatedBlob = createSimulatedAudioBlob(Math.max(2, recordingSeconds));
      const url = URL.createObjectURL(simulatedBlob);

      setRecordingBlobUrls((prev) => ({
        ...prev,
        [currentSentencePhase]: url,
      }));

      setSentenceParts((prev) => ({
        ...prev,
        [currentSentencePhase]: {
          ...prev[currentSentencePhase],
          readComplete: true,
        },
      }));

      soundEffects.playSuccessChime();
      setIsSimulatedRecording(false);
      setIsRecording(false);
      return;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Manual self-read check
  const handleMarkReadComplete = () => {
    soundEffects.playSuccessChime();
    setSentenceParts((prev) => ({
      ...prev,
      [currentSentencePhase]: {
        ...prev[currentSentencePhase],
        readComplete: true,
      },
    }));
  };

  // Advance to next sentence (First -> Then -> Finally)
  const handleAdvancePhase = (nextPhase: SentencePhase) => {
    soundEffects.playPageFlip();
    if (isRecording) {
      handleStopRecording();
    }
    setCurrentSentencePhase(nextPhase);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // All 3 sentences completed with real correct answers?
  const allThreeSentencesCompleted =
    sentenceParts.First.subject === SENTENCE_BUILDER_DATA.First.correctSubject &&
    sentenceParts.First.predicate === SENTENCE_BUILDER_DATA.First.correctPredicate &&
    sentenceParts.Then.subject === SENTENCE_BUILDER_DATA.Then.correctSubject &&
    sentenceParts.Then.predicate === SENTENCE_BUILDER_DATA.Then.correctPredicate &&
    sentenceParts.Finally.subject === SENTENCE_BUILDER_DATA.Finally.correctSubject &&
    sentenceParts.Finally.predicate === SENTENCE_BUILDER_DATA.Finally.correctPredicate &&
    sentenceParts.First.readComplete &&
    sentenceParts.Then.readComplete &&
    sentenceParts.Finally.readComplete;

  const handleCompleteAll = () => {
    soundEffects.playFanfare();
    onFinishWrapup({
      sequenceCompleted: true,
      matchingFirstAttemptScore: matchingScore,
      matchingFinalPairs: currentPairs,
      completedSentences: {
        first: `First, ${sentenceParts.First.subject} ${sentenceParts.First.predicate}.`,
        then: `Then, ${sentenceParts.Then.subject} ${sentenceParts.Then.predicate}.`,
        finally: `Finally, ${sentenceParts.Finally.subject} ${sentenceParts.Finally.predicate}.`,
      },
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col min-h-[calc(100vh-4rem)] p-3 sm:p-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 mb-3">
        <div className="flex items-center gap-2">
          <span className="bg-amber-500 text-white font-bold px-2.5 py-1 rounded-lg text-xs font-display">
            Step {currentStep} / 3
          </span>
          <span className="text-xs sm:text-sm font-semibold text-stone-700">
            {currentStep === 1 && '사건 3장 순서 배열'}
            {currentStep === 2 && '과거형 4개 연결'}
            {currentStep === 3 && '이야기 문장 3개 완성 & 녹음'}
          </span>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                currentStep === step
                  ? 'bg-amber-600 scale-125'
                  : currentStep > step
                  ? 'bg-emerald-500'
                  : 'bg-stone-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* STEP 1: EVENT SEQUENCING (3 Cards) */}
      {/* ========================================================= */}
      {currentStep === 1 && (
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/60 text-xs sm:text-sm text-amber-950">
            <span className="font-bold">🔎 미션:</span> Pip의 모험 이야기를 처음부터 끝까지 순서대로 맞춰보세요. 위/아래 버튼을 눌러 카드를 바꿀 수 있어요!
          </div>

          <div className="space-y-3 flex-1">
            {cardsOrder.map((card, idx) => (
              <div
                key={card.id}
                className="bg-white p-3.5 sm:p-4 rounded-2xl border-2 border-stone-200 shadow-xs flex items-center justify-between gap-3 hover:border-amber-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold font-display text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <div className="text-sm sm:text-base font-semibold text-stone-900 leading-snug">
                      {card.englishText}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">
                      {card.koreanText}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button
                    onClick={() => moveCard(idx, 'up')}
                    disabled={idx === 0}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      idx === 0
                        ? 'text-stone-300 border-stone-100 cursor-not-allowed'
                        : 'text-stone-700 bg-stone-50 hover:bg-amber-100 border-stone-200 active:scale-95'
                    }`}
                    title="위로 이동"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveCard(idx, 'down')}
                    disabled={idx === cardsOrder.length - 1}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      idx === cardsOrder.length - 1
                        ? 'text-stone-300 border-stone-100 cursor-not-allowed'
                        : 'text-stone-700 bg-stone-50 hover:bg-amber-100 border-stone-200 active:scale-95'
                    }`}
                    title="아래로 이동"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {sequenceChecked && (
            <div
              className={`p-3.5 rounded-2xl border text-xs sm:text-sm font-medium animate-in fade-in ${
                sequenceIsCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              {sequenceIsCorrect ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>완벽해요! 사건 3개의 순서를 올바르게 맞추었습니다!</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>순서가 아직 맞지 않아요. 화살표 버튼으로 다시 순서를 바꿔보세요!</span>
                </div>
              )}
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleResetSequence}
              className="py-3 px-4 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl font-semibold text-xs sm:text-sm active:scale-95 transition-transform"
            >
              다시 선택
            </button>

            {!sequenceIsCorrect ? (
              <button
                onClick={handleCheckSequence}
                className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold font-display text-sm sm:text-base active:scale-98 transition-all shadow-xs"
              >
                확인 (Check Order)
              </button>
            ) : (
              <button
                onClick={() => {
                  soundEffects.playPageFlip();
                  setCurrentStep(2);
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold font-display text-sm sm:text-base flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
              >
                <span>다음: 과거형 4개 연결하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 2: PAST TENSE MATCHING (4 Target Verbs) */}
      {/* ========================================================= */}
      {currentStep === 2 && (
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/60 text-xs sm:text-sm text-amber-950">
            <span className="font-bold">🔎 미션:</span> 과거형 단어나 행동 문장 중 원하는 쪽을 먼저 누른 뒤, 알맞은 짝을 눌러 연결해 보세요! (단어의 뜻은 문맥과 한국어 문장에서 유추할 수 있어요)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
            {/* Left: Verbs */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                과거형 단어 (Target Verbs)
              </div>
              {PAST_TENSE_MATCH_ITEMS.map((item) => {
                const isSelected = selectedVerbId === item.id;
                const connectedTargetId = currentPairs[item.id];
                const isPaired = !!connectedTargetId;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectVerb(item.id)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 border-amber-500 shadow-xs ring-2 ring-amber-300'
                        : isPaired
                        ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
                        : selectedActionTargetId
                        ? 'bg-white hover:bg-amber-50/60 border-amber-300 text-stone-800'
                        : 'bg-white border-stone-200 hover:border-amber-300 text-stone-800'
                    }`}
                  >
                    <div>
                      <div className="text-lg font-bold font-display text-stone-900">
                        {item.verb}
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5">
                        원형: <span className="font-semibold text-stone-600">{item.baseVerb}</span>
                      </div>
                    </div>
                    {isPaired && (
                      <div className="flex items-center gap-1.5">
                        <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                        <button
                          onClick={(e) => handleDisconnect(item.id, e)}
                          className="text-stone-400 hover:text-rose-500 p-1 text-xs"
                          title="연결 해제"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right: Actions */}
            <div className="space-y-2.5">
              <div className="text-xs font-bold text-stone-500 uppercase tracking-wider px-1">
                행동 및 장면 (Story Actions)
              </div>
              {actionTargets.map((target) => {
                const connectedVerbId = Object.keys(currentPairs).find(
                  (verbId) => currentPairs[verbId] === target.matchTargetId
                );
                const connectedVerbItem = connectedVerbId
                  ? PAST_TENSE_MATCH_ITEMS.find((v) => v.id === connectedVerbId)
                  : null;

                const isSelected = selectedActionTargetId === target.matchTargetId;

                return (
                  <div
                    key={target.matchTargetId}
                    onClick={() => handleSelectAction(target.matchTargetId)}
                    className={`w-full text-left p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-100 border-amber-500 shadow-xs ring-2 ring-amber-300'
                        : connectedVerbItem
                        ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
                        : selectedVerbId
                        ? 'bg-white hover:bg-amber-50/60 border-amber-300 text-stone-800'
                        : 'bg-white border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                      {target.actionText}
                    </div>
                    <div className="text-[11px] text-amber-800 font-medium mt-1">
                      {target.koreanAction}
                    </div>

                    {connectedVerbItem && (
                      <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-200/80 text-emerald-950 text-xs font-bold px-2 py-0.5 rounded-md">
                        <span>연결:</span>
                        <span className="font-display underline">{connectedVerbItem.verb}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {matchingChecked && (
            <div className="p-3.5 rounded-2xl border bg-stone-50 border-stone-300 text-xs sm:text-sm font-medium">
              <div className="flex items-center justify-between">
                <span>
                  연결 점수: <strong>{matchingScore} / 4</strong>
                </span>
                <span className="text-stone-500">
                  {matchingScore === 4
                    ? '✨ 모든 과거형을 완벽히 맞췄어요!'
                    : '틀린 연결은 다시 눌러 수정할 수 있어요!'}
                </span>
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button
              onClick={handleResetMatching}
              className="py-3 px-4 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl font-semibold text-xs sm:text-sm active:scale-95 transition-transform"
            >
              다시 선택
            </button>

            {!matchingChecked || matchingScore < 4 ? (
              <button
                onClick={handleCheckMatching}
                disabled={Object.keys(currentPairs).length < 4}
                className={`flex-1 py-3 px-4 rounded-xl font-bold font-display text-sm sm:text-base transition-all shadow-xs ${
                  Object.keys(currentPairs).length === 4
                    ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-98'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                확인 (Check Matches)
              </button>
            ) : (
              <button
                onClick={() => {
                  soundEffects.playPageFlip();
                  setCurrentStep(3);
                }}
                className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold font-display text-sm sm:text-base flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
              >
                <span>다음: 이야기 문장 완성 & 녹음</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STEP 3: 3-SENTENCE BUILDER & VOICE RECORDING */}
      {/* ========================================================= */}
      {currentStep === 3 && (
        <div className="space-y-4 flex-1 flex flex-col">
          {/* Phase Stepper Pills (First -> Then -> Finally) */}
          <div className="bg-amber-50/80 p-2 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-1.5">
            {(['First', 'Then', 'Finally'] as const).map((phase, pIdx) => {
              const isCurrent = currentSentencePhase === phase;
              const isDone = sentenceParts[phase].readComplete && sentenceParts[phase].subject;
              return (
                <button
                  key={phase}
                  onClick={() => handleAdvancePhase(phase)}
                  className={`flex-1 py-2 px-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-amber-500 text-white shadow-xs'
                      : isDone
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'
                  }`}
                >
                  <span>{pIdx + 1}. {phase}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="bg-white p-3 rounded-2xl border border-amber-100 text-xs sm:text-sm text-amber-950 font-medium">
            <span className="font-bold">🔎 {currentSentencePhase} 단계: </span>
            {currentSentencePhase === 'First' && '이야기 시작 문장(First)을 완성하고 소리 내어 녹음해 보세요!'}
            {currentSentencePhase === 'Then' && '이야기 중간 문장(Then)을 완성하고 소리 내어 녹음해 보세요!'}
            {currentSentencePhase === 'Finally' && '이야기 결말 문장(Finally)을 완성하고 소리 내어 녹음해 보세요!'}
          </div>

          {/* Builder Options for Active Phase */}
          <div className="space-y-3 bg-stone-50/60 p-3.5 rounded-2xl border border-stone-200/70">
            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1.5">
                주인공 선택 (Subject):
              </label>
              <div className="flex flex-wrap gap-2">
                {activeBuilderData.subjects.map((subj) => (
                  <button
                    key={subj}
                    onClick={() => handleSelectSubject(subj)}
                    className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                      activeSubject === subj
                        ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300 shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    {subj}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-stone-600 block mb-1.5">
                행동 과거형 선택 (Predicate):
              </label>
              <div className="flex flex-wrap gap-2">
                {activeBuilderData.verbs.map((pred) => (
                  <button
                    key={pred}
                    onClick={() => handleSelectPredicate(pred)}
                    className={`py-2 px-3.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                      activePredicate === pred
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-400 ring-2 ring-emerald-300 shadow-xs'
                        : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                    }`}
                  >
                    {pred}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sentence Display & Audio / Recording Action Deck */}
          <div className={`p-4 rounded-3xl border-2 transition-all text-center space-y-3 ${
            isSpeakingActiveSentence
              ? 'bg-yellow-200 border-yellow-400 ring-4 ring-yellow-300 shadow-md scale-[1.01]'
              : 'bg-amber-50/90 border-amber-300 shadow-xs'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                {currentSentencePhase} 문장 미리보기
              </span>
              {isSpeakingActiveSentence && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-950 bg-yellow-300 px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                  <Volume2 className="w-3.5 h-3.5 text-amber-900" />
                  <span>소리 내어 읽는 중...</span>
                </span>
              )}
            </div>
            <div className="text-base sm:text-xl font-bold font-display text-amber-950 leading-relaxed min-h-[2.8rem] flex items-center justify-center">
              {isBothSelected ? (
                <span>&quot;{currentSentencePhase}, {activeSubject} {activePredicate}.&quot;</span>
              ) : (
                <span className="text-stone-400 text-sm font-normal">
                  위에서 주인공과 행동 조각을 눌러 문장을 완성해 보세요.
                </span>
              )}
            </div>

            {/* Verification Feedback */}
            {isBothSelected && !isCurrentSentenceCorrect && (
              <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-3.5 text-center space-y-1 animate-in fade-in">
                <div className="text-xs sm:text-sm font-bold text-rose-900 flex items-center justify-center gap-1.5">
                  <span>❌ 아쉬워요! 이야기 내용과 일치하지 않아요.</span>
                </div>
                <p className="text-xs text-rose-700">
                  동화 속 진짜 주인공과 행동을 다시 골라보세요. 정답을 맞추면 발음 듣기와 녹음이 열려요!
                </p>
              </div>
            )}

            {isCurrentSentenceCorrect && (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3.5 text-center space-y-1 animate-in fade-in">
                <div className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>🎉 딩동댕! 정확한 정답 문장을 완성했어요!</span>
                </div>
                <div className="text-xs text-emerald-800 font-medium">
                  💡 뜻: &ldquo;{activeBuilderData.sentenceKorean}&rdquo;
                </div>
              </div>
            )}

            {/* Practice & Voice Recording Studio - UNLOCKED ONLY ON CORRECT ANSWER */}
            {isCurrentSentenceCorrect && (
              <div className="space-y-3 pt-2 border-t border-amber-200/80">
                <div className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>정답 문장의 발음을 듣고 내 목소리로 소리 내어 녹음해 보세요!</span>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {/* 1. Listen via TTS */}
                  <button
                    onClick={handleSpeakActiveSentence}
                    className="py-2.5 px-3.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs transition-transform cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>🔊 모델 발음 듣기</span>
                  </button>

                  {/* 2. Record voice (MediaRecorder) */}
                  <button
                    onClick={isRecording ? handleStopRecording : handleStartRecording}
                    className={`py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs active:scale-95 transition-all cursor-pointer ${
                      isRecording
                        ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4 fill-current" />
                        <span>⏹️ 녹음 중지 ({formatSeconds(recordingSeconds)})</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>🎙️ 내 목소리 녹음하기</span>
                      </>
                    )}
                  </button>

                  {/* 3. Self Read check fallback */}
                  <button
                    onClick={handleMarkReadComplete}
                    className={`py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors active:scale-95 border cursor-pointer ${
                      sentenceParts[currentSentencePhase].readComplete
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                        : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                    }`}
                  >
                    <span>{sentenceParts[currentSentencePhase].readComplete ? '읽기/녹음 완료 ✓' : '소리 내어 읽었어요'}</span>
                  </button>
                </div>

                {/* Error Banner with Instant Action */}
                {recordError && (
                  <div className="text-xs text-amber-950 bg-amber-50/90 p-3 rounded-2xl border border-amber-300 text-center space-y-2 leading-relaxed animate-in fade-in">
                    <p>{recordError}</p>
                    <button
                      onClick={handleMarkReadComplete}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs active:scale-95 transition-transform cursor-pointer text-xs"
                    >
                      🗣️ 직접 소리 내어 읽고 완료하기
                    </button>
                  </div>
                )}

                {/* Native HTML5 Audio Player for Student's Recorded Voice */}
                {recordingBlobUrls[currentSentencePhase] && (
                  <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-300 space-y-2 text-left animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>내 목소리 녹음 완료! 아래 플레이어를 재생하여 발음을 확인해 보세요:</span>
                      </span>
                      <button
                        onClick={handleStartRecording}
                        className="text-[11px] font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-0.5 rounded-lg transition-colors cursor-pointer"
                      >
                        🔄 다시 녹음
                      </button>
                    </div>
                    <audio
                      key={recordingBlobUrls[currentSentencePhase]}
                      controls
                      src={recordingBlobUrls[currentSentencePhase]!}
                      className="w-full h-10 rounded-xl"
                      preload="auto"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stepper Navigation Buttons */}
          <div className="pt-2">
            {currentSentencePhase === 'First' && (
              <button
                onClick={() => handleAdvancePhase('Then')}
                disabled={!isCurrentSentenceCorrect || !sentenceParts.First.readComplete}
                className={`w-full py-3.5 px-4 rounded-2xl font-bold font-display text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xs ${
                  isCurrentSentenceCorrect && sentenceParts.First.readComplete
                    ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-98'
                    : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {!isCurrentSentenceCorrect
                    ? '정답 문장을 완성해 주세요'
                    : !sentenceParts.First.readComplete
                    ? '발음을 듣거나 녹음해 보세요'
                    : '다음: Then 문장 만들기'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {currentSentencePhase === 'Then' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAdvancePhase('First')}
                  className="py-3 px-4 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer"
                >
                  이전 (First)
                </button>
                <button
                  onClick={() => handleAdvancePhase('Finally')}
                  disabled={!isCurrentSentenceCorrect || !sentenceParts.Then.readComplete}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold font-display text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xs ${
                    isCurrentSentenceCorrect && sentenceParts.Then.readComplete
                      ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-98'
                      : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <span>
                    {!isCurrentSentenceCorrect
                      ? '정답 문장을 완성해 주세요'
                      : !sentenceParts.Then.readComplete
                      ? '발음을 듣거나 녹음해 보세요'
                      : '다음: Finally 문장 만들기'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {currentSentencePhase === 'Finally' && (
              <div className="space-y-3">
                {/* 3-Sentence Summary Card */}
                {allThreeSentencesCompleted && (
                  <div className="bg-emerald-50/90 rounded-2xl p-4 border border-emerald-300 text-left space-y-2 animate-in fade-in">
                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span>완성된 3단 탐정 이야기 (Story Complete!)</span>
                    </div>
                    <div className="space-y-1.5 text-xs sm:text-sm font-semibold text-stone-800">
                      <div>1. {getFullSentence('First')}</div>
                      <div>2. {getFullSentence('Then')}</div>
                      <div>3. {getFullSentence('Finally')}</div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAdvancePhase('Then')}
                    className="py-3.5 px-4 bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 rounded-xl font-semibold text-xs sm:text-sm"
                  >
                    이전 (Then)
                  </button>
                  <button
                    onClick={handleCompleteAll}
                    disabled={!allThreeSentencesCompleted}
                    className={`flex-1 py-3.5 px-4 rounded-2xl font-bold font-display text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-xs ${
                      allThreeSentencesCompleted
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-98 shadow-emerald-200'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>탐정 활동 완료! 결과 보기 (See Results)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
