export type ScreenType = 'cover' | 'story' | 'question' | 'wrapup' | 'result';

export interface UnderlinedWord {
  id: string;
  word: string;
  baseForm?: string; // e.g. "go", "see", "find", "help"
  meaning: string; // Korean meaning
  pronunciation?: string;
  tip: string; // Friendly tip for elementary students
  exampleSentence?: string;
}

export interface StorySentence {
  id: string;
  text: string;
  koreanText?: string;
  audioText: string;
}

export interface StoryPage {
  pageNumber: number; // 1 to 8
  title: string;
  sentences: StorySentence[];
  underlinedWordIds: string[];
  illustrationScene: string;
  clueQuestionIndex?: number; // 0, 1, 2, 3 (for pages 2, 4, 6, 8)
}

export interface ClueQuestion {
  id: string;
  pageNumber: number; // 2, 4, 6, 8
  questionNumber: number; // 1, 2, 3, 4
  questionText: string;
  koreanQuestion: string;
  choices: {
    id: string;
    text: string;
    koreanText: string;
  }[];
  correctChoiceId: string;
  hint: string;
  explanation: string;
}

export interface StorySequenceCard {
  id: string;
  orderNumber: number; // 1, 2, 3
  englishText: string;
  koreanText: string;
  iconName: string;
}

export interface PastTenseMatchItem {
  id: string;
  verb: string;
  baseVerb: string;
  meaning: string;
  matchTargetId: string;
  actionText: string;
  koreanAction: string;
  iconName: string;
}

export interface QuestionState {
  firstChoiceId: string;
  finalChoiceId: string;
  attemptsCount: number;
  isResolved: boolean;
  isCorrect: boolean;
}

export interface StorySummarySentences {
  first: string;
  then: string;
  finally: string;
}

export interface UserProgressState {
  currentScreen: ScreenType;
  currentPage: number;
  currentQuestionIndex: number;
  readPages: Record<number, boolean>;
  // Question attempts: records first choice and whether it was correct
  questionFirstAttempts: Record<number, { choiceId: string; isCorrect: boolean }>;
  questionFinalStatus: Record<number, { choiceId: string; isCorrect: boolean; attempts: number }>;
  // Wrap-up Step 1: Sequence
  sequenceOrder: string[]; // array of card ids
  sequenceCompleted: boolean;
  // Wrap-up Step 2: Past tense matching
  matchingFirstAttempts: Record<string, boolean>; // verbId -> was first match correct
  matchedPairs: Record<string, string>; // verbId -> targetId
  matchingCompleted: boolean;
  // Wrap-up Step 3: Sentence builder
  selectedTransition: 'First' | 'Then' | 'Finally';
  completedSentence: string;
  hasReadSentenceAloud: boolean;
}
