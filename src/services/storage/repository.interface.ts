import { Question, Subject, Difficulty, AttemptRecord, BookmarkRecord, TopicItem, UserPreferences } from '@/types';

export interface QuestionFilter {
  subject?: Subject | 'all';
  topics?: string[];
  subtopics?: string[];
  difficulty?: Difficulty | 'mixed';
  selection?: 'all' | 'unseen' | 'incorrect' | 'bookmarked' | 'randomized' | 'previously_attempted';
  searchQuery?: string;
  limit?: number;
}

export interface IQuestionRepository {
  // Questions
  getAllQuestions(): Promise<Question[]>;
  getQuestions(filter?: QuestionFilter): Promise<Question[]>;
  getQuestionById(id: string): Promise<Question | undefined>;
  saveQuestions(questions: Question[]): Promise<number>;
  updateQuestion(question: Question): Promise<void>;
  deleteQuestion(id: string): Promise<void>;
  clearQuestions(): Promise<void>;

  // Attempts & History
  getAllAttempts(): Promise<AttemptRecord[]>;
  getAttemptById(id: string): Promise<AttemptRecord | undefined>;
  saveAttempt(attempt: AttemptRecord): Promise<void>;
  deleteAttempt(id: string): Promise<void>;
  clearAttempts(): Promise<void>;

  // Bookmarks
  getBookmarks(): Promise<BookmarkRecord[]>;
  toggleBookmark(questionId: string, notes?: string): Promise<boolean>;
  isBookmarked(questionId: string): Promise<boolean>;

  // Topic Inventory
  getAllTopics(): Promise<TopicItem[]>;
  saveTopics(topics: TopicItem[]): Promise<void>;

  // Preferences
  getPreferences(): UserPreferences;
  savePreferences(prefs: Partial<UserPreferences>): void;

  // Seeding & Reset
  isSeeded(): Promise<boolean>;
  seedInitialData(): Promise<number>;
  resetAllData(): Promise<void>;
}
