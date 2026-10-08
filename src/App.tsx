import { useState } from 'react';
import { ScreenType, QuestionState, StorySummarySentences } from './types';
import { STORY_PAGES, CLUE_QUESTIONS } from './data/storyData';
import { Navbar } from './components/Navbar';
import { CoverScreen } from './components/CoverScreen';
import { StoryView } from './components/StoryView';
import { QuestionView } from './components/QuestionView';
import { StoryWrapupView } from './components/StoryWrapupView';
import { ResultView } from './components/ResultView';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('cover');
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0); // 0 to 7 (pages 1 to 8)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0); // 0 to 3 (questions 1 to 4)
  const [maxVisitedPageIndex, setMaxVisitedPageIndex] = useState<number>(0);

  // Read status by page number (1 to 8)
  const [readPages, setReadPages] = useState<Record<number, boolean>>({});

  // Question states: records first and final response, attempts count, resolution
  const [questionStates, setQuestionStates] = useState<Record<number, QuestionState>>({});

  // Wrap-up results
  const [sequenceCompleted, setSequenceCompleted] = useState<boolean>(false);
  const [matchingFirstAttemptScore, setMatchingFirstAttemptScore] = useState<number>(4);
  const [completedSentences, setCompletedSentences] = useState<StorySummarySentences>({
    first: 'First, Pip went to the forest.',
    then: 'Then, Ben and Robin helped Pip find clues.',
    finally: 'Finally, Pip and Mia found and shared the acorn.',
  });

  const handleStartStory = () => {
    setCurrentPageIndex(0);
    setMaxVisitedPageIndex(0);
    setCurrentScreen('story');
  };

  const handleGoHome = () => {
    setCurrentScreen('cover');
  };

  const handleMarkPageRead = (pageNumber: number) => {
    setReadPages((prev) => ({
      ...prev,
      [pageNumber]: true,
    }));
  };

  const handleStoryNext = () => {
    const currentPage = STORY_PAGES[currentPageIndex];
    setMaxVisitedPageIndex((prev) => Math.max(prev, currentPageIndex + 1));

    // If this page triggers a clue question (Page 2, 4, 6, 8)
    if (currentPage.clueQuestionIndex !== undefined) {
      setCurrentQuestionIndex(currentPage.clueQuestionIndex);
      setCurrentScreen('question');
    } else {
      if (currentPageIndex < STORY_PAGES.length - 1) {
        setCurrentPageIndex(currentPageIndex + 1);
      }
    }
  };

  const handleStoryPrev = () => {
    // If the immediately preceding step was a Question:
    // Page 3 (index 2) -> Question 0
    // Page 5 (index 4) -> Question 1
    // Page 7 (index 6) -> Question 2
    if (currentPageIndex === 2) {
      setCurrentQuestionIndex(0);
      setCurrentScreen('question');
    } else if (currentPageIndex === 4) {
      setCurrentQuestionIndex(1);
      setCurrentScreen('question');
    } else if (currentPageIndex === 6) {
      setCurrentQuestionIndex(2);
      setCurrentScreen('question');
    } else if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleSaveQuestionAttempt = (qIndex: number, state: QuestionState) => {
    setQuestionStates((prev) => ({
      ...prev,
      [qIndex]: state,
    }));
  };

  const handleQuestionPrev = () => {
    // Return to the story page before this question:
    // Question 0 (after Page 2) -> Page 2 (index 1)
    // Question 1 (after Page 4) -> Page 4 (index 3)
    // Question 2 (after Page 6) -> Page 6 (index 5)
    // Question 3 (after Page 8) -> Page 8 (index 7)
    const prevPageIndex = currentQuestionIndex * 2 + 1;
    setCurrentPageIndex(prevPageIndex);
    setCurrentScreen('story');
  };

  const handleQuestionContinue = () => {
    // If it was the last question (Question 4 after Page 8)
    if (currentQuestionIndex === 3) {
      setCurrentScreen('wrapup');
    } else {
      // Continue reading next page:
      // Question 0 was after page 2 (index 1) -> go to page 3 (index 2)
      // Question 1 was after page 4 (index 3) -> go to page 5 (index 4)
      // Question 2 was after page 6 (index 5) -> go to page 7 (index 6)
      const nextPageIndex = (currentQuestionIndex + 1) * 2;
      setMaxVisitedPageIndex((prev) => Math.max(prev, nextPageIndex));
      setCurrentPageIndex(nextPageIndex);
      setCurrentScreen('story');
    }
  };

  const handleFinishWrapup = (results: {
    sequenceCompleted: boolean;
    matchingFirstAttemptScore: number;
    matchingFinalPairs: Record<string, string>;
    completedSentences: StorySummarySentences;
  }) => {
    setSequenceCompleted(results.sequenceCompleted);
    setMatchingFirstAttemptScore(results.matchingFirstAttemptScore);
    setCompletedSentences(results.completedSentences);
    setCurrentScreen('result');
  };

  const handleRestart = () => {
    setCurrentPageIndex(0);
    setCurrentQuestionIndex(0);
    setMaxVisitedPageIndex(0);
    setReadPages({});
    setQuestionStates({});
    setSequenceCompleted(false);
    setMatchingFirstAttemptScore(4);
    setCompletedSentences({
      first: 'First, Pip went to the forest.',
      then: 'Then, Ben and Robin helped Pip find clues.',
      finally: 'Finally, Pip and Mia found and shared the acorn.',
    });
    setCurrentScreen('cover');
  };

  const currentPage = STORY_PAGES[currentPageIndex];
  const currentQuestion = CLUE_QUESTIONS[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans">
      <Navbar
        currentScreen={currentScreen}
        currentPage={currentPageIndex + 1}
        totalPages={STORY_PAGES.length}
        onGoHome={handleGoHome}
      />

      <main className="flex-1 flex flex-col items-center justify-start w-full">
        {currentScreen === 'cover' && (
          <CoverScreen onStart={handleStartStory} />
        )}

        {currentScreen === 'story' && currentPage && (
          <StoryView
            page={currentPage}
            totalPages={STORY_PAGES.length}
            isRead={!!readPages[currentPage.pageNumber]}
            canNavigateFreely={currentPageIndex < maxVisitedPageIndex}
            onMarkReadComplete={handleMarkPageRead}
            onNext={handleStoryNext}
            onPrev={handleStoryPrev}
          />
        )}

        {currentScreen === 'question' && currentQuestion && (
          <QuestionView
            question={currentQuestion}
            totalQuestions={CLUE_QUESTIONS.length}
            savedState={questionStates[currentQuestionIndex]}
            onSaveAttempt={handleSaveQuestionAttempt}
            onContinue={handleQuestionContinue}
            onPrevStory={handleQuestionPrev}
            isLastQuestion={currentQuestionIndex === CLUE_QUESTIONS.length - 1}
          />
        )}

        {currentScreen === 'wrapup' && (
          <StoryWrapupView
            onFinishWrapup={handleFinishWrapup}
          />
        )}

        {currentScreen === 'result' && (
          <ResultView
            questionStates={questionStates}
            matchingFirstAttemptScore={matchingFirstAttemptScore}
            sequenceCompleted={sequenceCompleted}
            completedSentences={completedSentences}
            onRestart={handleRestart}
          />
        )}
      </main>
    </div>
  );
}
