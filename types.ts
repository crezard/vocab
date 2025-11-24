export interface Word {
  term: string;
  definition: string;
  example: string;
  partOfSpeech: string;
  pronunciation?: string; // Phonetic spelling
}

export enum AppMode {
  LEARN = 'LEARN',
  QUIZ = 'QUIZ',
}

export enum Difficulty {
  GRADE_1 = 'Grade 1 (초1-2 수준)',
  GRADE_2 = 'Grade 2 (초3-4 수준)',
  GRADE_3 = 'Grade 3 (초5-6 수준)',
}

export interface QuizState {
  currentQuestionIndex: number;
  score: number;
  isFinished: boolean;
  shuffledOptions: string[][]; // Array of options for each question
}

export type Topic = 
  | "Daily Life"
  | "School"
  | "Travel"
  | "Science"
  | "Emotions"
  | "Food"
  | "Hobbies";
