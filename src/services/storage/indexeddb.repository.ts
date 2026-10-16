import { openDB, IDBPDatabase } from 'idb';
import { Question, AttemptRecord, BookmarkRecord, TopicItem, UserPreferences, Subject } from '@/types';
import { IQuestionRepository, QuestionFilter } from './repository.interface';
import { APP_CONFIG } from '@/config/app.config';

// Import seed question banks directly
import linuxBank from '@/data/seed/linux_question_bank.json';
import windowsBank from '@/data/seed/windows_question_bank.json';
import crossBank from '@/data/seed/cross_platform_question_bank.json';
import topicInventory from '@/data/seed/topic_inventory.json';

const DB_NAME = 'nexus_cmce_database';
const DB_VERSION = 1;
const PREFS_STORAGE_KEY = 'nexus_user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  userName: 'Admin Candidate',
  sidebarCollapsed: false,
  practicePassingThreshold: APP_CONFIG.defaultPassingThreshold,
  soundEnabled: true,
  keyboardShortcutsEnabled: true,
  defaultTimerMinutes: 30,
};

export class IndexedDBRepository implements IQuestionRepository {
  private dbPromise: Promise<IDBPDatabase> | null = null;
  // In-memory cache for ultra-fast queries & test environments
  private inMemoryQuestions: Map<string, Question> = new Map();
  private inMemoryAttempts: Map<string, AttemptRecord> = new Map();
  private inMemoryBookmarks: Map<string, BookmarkRecord> = new Map();
  private inMemoryTopics: Map<string, TopicItem> = new Map();
  private isInitialized = false;

  private async getDB(): Promise<IDBPDatabase | null> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return null;
    }
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Questions store
          if (!db.objectStoreNames.contains('questions')) {
            const qStore = db.createObjectStore('questions', { keyPath: 'question_id' });
            qStore.createIndex('subject', 'subject', { unique: false });
            qStore.createIndex('topic_id', 'topic_id', { unique: false });
            qStore.createIndex('difficulty', 'difficulty', { unique: false });
          }

          // Attempts store
          if (!db.objectStoreNames.contains('attempts')) {
            const aStore = db.createObjectStore('attempts', { keyPath: 'id' });
            aStore.createIndex('startedAt', 'startedAt', { unique: false });
            aStore.createIndex('isCompleted', 'isCompleted', { unique: false });
          }

          // Bookmarks store
          if (!db.objectStoreNames.contains('bookmarks')) {
            db.createObjectStore('bookmarks', { keyPath: 'questionId' });
          }

          // Topics store
          if (!db.objectStoreNames.contains('topics')) {
            const tStore = db.createObjectStore('topics', { keyPath: 'topic_id' });
            tStore.createIndex('subject', 'subject', { unique: false });
          }

          // Metadata store
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        },
      });
    }
    return this.dbPromise;
  }

  public async isSeeded(): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (!db) {
        return this.inMemoryQuestions.size > 0;
      }
      const count = await db.count('questions');
      return count > 0;
    } catch {
      return this.inMemoryQuestions.size > 0;
    }
  }

  public async seedInitialData(): Promise<number> {
    const allQuestions: Question[] = [
      ...(linuxBank.questions as unknown as Question[]),
      ...(windowsBank.questions as unknown as Question[]),
      ...(crossBank.questions as unknown as Question[]),
    ];

    const topics: TopicItem[] = (topicInventory.topics as unknown as TopicItem[]) || [];

    await this.saveQuestions(allQuestions);
    await this.saveTopics(topics);

    const db = await this.getDB();
    if (db) {
      await db.put('metadata', { key: 'seeded_version', value: '1.0.0', date: new Date().toISOString() });
    }

    return allQuestions.length;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const db = await this.getDB();
      if (db) {
        const count = await db.count('questions');
        if (count === 0) {
          await this.seedInitialData();
        }
      } else {
        // Fallback to in-memory seeding
        if (this.inMemoryQuestions.size === 0) {
          await this.seedInitialData();
        }
      }
    } catch {
      // In case of error (e.g. storage quota / private browsing), fallback to memory
      if (this.inMemoryQuestions.size === 0) {
        await this.seedInitialData();
      }
    }
    this.isInitialized = true;
  }

  public async getAllQuestions(): Promise<Question[]> {
    await this.init();
    try {
      const db = await this.getDB();
      if (db) {
        return await db.getAll('questions');
      }
    } catch (e) {
      console.warn('IDB read error, using in-memory cache', e);
    }
    return Array.from(this.inMemoryQuestions.values());
  }

  public async getQuestions(filter?: QuestionFilter): Promise<Question[]> {
    let questions = await this.getAllQuestions();

    if (!filter) return questions;

    // Filter by subject
    if (filter.subject && filter.subject !== 'all') {
      questions = questions.filter((q) => q.subject === filter.subject);
    }

    // Filter by topic list
    if (filter.topics && filter.topics.length > 0) {
      const topicSet = new Set(filter.topics);
      questions = questions.filter((q) => topicSet.has(q.topic) || topicSet.has(q.topic_id));
    }

    // Filter by difficulty
    if (filter.difficulty && filter.difficulty !== 'mixed') {
      questions = questions.filter((q) => q.difficulty === filter.difficulty);
    }

    // Filter by text search query
    if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
      const query = filter.searchQuery.toLowerCase();
      questions = questions.filter(
        (q) =>
          q.question_id.toLowerCase().includes(query) ||
          q.question_text.toLowerCase().includes(query) ||
          q.topic.toLowerCase().includes(query) ||
          q.subtopic.toLowerCase().includes(query) ||
          (q.tags && q.tags.some((t) => t.toLowerCase().includes(query))) ||
          q.options.some((opt) => opt.text.toLowerCase().includes(query))
      );
    }

    // Filter by selection criteria
    if (filter.selection && filter.selection !== 'all') {
      const attempts = await this.getAllAttempts();
      const bookmarks = await this.getBookmarks();
      const bookmarkedIds = new Set(bookmarks.map((b) => b.questionId));

      const attemptedQuestionIds = new Set<string>();
      const incorrectQuestionIds = new Set<string>();

      for (const att of attempts) {
        for (const item of att.items) {
          if (item.selectedOptionId) {
            attemptedQuestionIds.add(item.questionId);
            if (item.selectedOptionId !== item.originalQuestion.correct_option_id) {
              incorrectQuestionIds.add(item.questionId);
            }
          }
        }
      }

      switch (filter.selection) {
        case 'unseen':
          questions = questions.filter((q) => !attemptedQuestionIds.has(q.question_id));
          break;
        case 'incorrect':
          questions = questions.filter((q) => incorrectQuestionIds.has(q.question_id));
          break;
        case 'bookmarked':
          questions = questions.filter((q) => bookmarkedIds.has(q.question_id));
          break;
        case 'previously_attempted':
          questions = questions.filter((q) => attemptedQuestionIds.has(q.question_id));
          break;
        case 'randomized':
          questions = [...questions].sort(() => Math.random() - 0.5);
          break;
      }
    }

    if (filter.limit && filter.limit > 0 && filter.limit < questions.length) {
      questions = questions.slice(0, filter.limit);
    }

    return questions;
  }

  public async getQuestionById(id: string): Promise<Question | undefined> {
    await this.init();
    try {
      const db = await this.getDB();
      if (db) {
        const item = await db.get('questions', id);
        if (item) return item;
      }
    } catch (e) {
      console.warn('IDB getQuestionById error', e);
    }
    return this.inMemoryQuestions.get(id);
  }

  public async saveQuestions(questions: Question[]): Promise<number> {
    let savedCount = 0;
    try {
      const db = await this.getDB();
      if (db) {
        const tx = db.transaction('questions', 'readwrite');
        for (const q of questions) {
          await tx.store.put(q);
          this.inMemoryQuestions.set(q.question_id, q);
          savedCount++;
        }
        await tx.done;
        return savedCount;
      }
    } catch (e) {
      console.warn('IDB saveQuestions error, saving to in-memory', e);
    }

    for (const q of questions) {
      this.inMemoryQuestions.set(q.question_id, q);
      savedCount++;
    }
    return savedCount;
  }

  public async updateQuestion(question: Question): Promise<void> {
    try {
      const db = await this.getDB();
      if (db) {
        await db.put('questions', question);
      }
    } catch (e) {
      console.warn('IDB updateQuestion error', e);
    }
    this.inMemoryQuestions.set(question.question_id, question);
  }

  public async deleteQuestion(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      if (db) {
        await db.delete('questions', id);
      }
    } catch (e) {
      console.warn('IDB deleteQuestion error', e);
    }
    this.inMemoryQuestions.delete(id);
  }

  public async clearQuestions(): Promise<void> {
    try {
      const db = await this.getDB();
      if (db) {
        await db.clear('questions');
      }
    } catch (e) {
      console.warn('IDB clearQuestions error', e);
    }
    this.inMemoryQuestions.clear();
  }

  // Attempts
  public async getAllAttempts(): Promise<AttemptRecord[]> {
    try {
      const db = await this.getDB();
      if (db) {
        const list = await db.getAll('attempts');
        return list.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      }
    } catch (e) {
      console.warn('IDB getAllAttempts error', e);
    }
    return Array.from(this.inMemoryAttempts.values()).sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
  }

  public async getAttemptById(id: string): Promise<AttemptRecord | undefined> {
    try {
      const db = await this.getDB();
      if (db) {
        const item = await db.get('attempts', id);
        if (item) return item;
      }
    } catch (e) {
      console.warn('IDB getAttemptById error', e);
    }
    return this.inMemoryAttempts.get(id);
  }

  public async saveAttempt(attempt: AttemptRecord): Promise<void> {
    try {
      const db = await this.getDB();
      if (db) {
        await db.put('attempts', attempt);
      }
    } catch (e) {
      console.warn('IDB saveAttempt error', e);
    }
    this.inMemoryAttempts.set(attempt.id, attempt);
  }

  public async deleteAttempt(id: string): Promise<void> {
    try {
      const db = await this.getDB();
      if (db) {
        await db.delete('attempts', id);
      }
    } catch (e) {
      console.warn('IDB deleteAttempt error', e);
    }
    this.inMemoryAttempts.delete(id);
  }

  public async clearAttempts(): Promise<void> {
    try {
      const db = await this.getDB();
      if (db) {
        await db.clear('attempts');
      }
    } catch (e) {
      console.warn('IDB clearAttempts error', e);
    }
    this.inMemoryAttempts.clear();
  }

  // Bookmarks
  public async getBookmarks(): Promise<BookmarkRecord[]> {
    try {
      const db = await this.getDB();
      if (db) {
        return await db.getAll('bookmarks');
      }
    } catch (e) {
      console.warn('IDB getBookmarks error', e);
    }
    return Array.from(this.inMemoryBookmarks.values());
  }

  public async toggleBookmark(questionId: string, notes?: string): Promise<boolean> {
    const isCurrently = await this.isBookmarked(questionId);
    try {
      const db = await this.getDB();
      if (isCurrently) {
        if (db) await db.delete('bookmarks', questionId);
        this.inMemoryBookmarks.delete(questionId);
        return false;
      } else {
        const bm: BookmarkRecord = { questionId, bookmarkedAt: new Date().toISOString(), notes };
        if (db) await db.put('bookmarks', bm);
        this.inMemoryBookmarks.set(questionId, bm);
        return true;
      }
    } catch (e) {
      console.warn('IDB toggleBookmark error', e);
      if (isCurrently) {
        this.inMemoryBookmarks.delete(questionId);
        return false;
      } else {
        this.inMemoryBookmarks.set(questionId, { questionId, bookmarkedAt: new Date().toISOString(), notes });
        return true;
      }
    }
  }

  public async isBookmarked(questionId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      if (db) {
        const item = await db.get('bookmarks', questionId);
        return !!item;
      }
    } catch (e) {
      console.warn('IDB isBookmarked error', e);
    }
    return this.inMemoryBookmarks.has(questionId);
  }

  // Topics
  public async getAllTopics(): Promise<TopicItem[]> {
    try {
      const db = await this.getDB();
      if (db) {
        const topics = await db.getAll('topics');
        if (topics.length > 0) return topics;
      }
    } catch (e) {
      console.warn('IDB getAllTopics error', e);
    }
    if (this.inMemoryTopics.size > 0) {
      return Array.from(this.inMemoryTopics.values());
    }
    return (topicInventory.topics as unknown as TopicItem[]) || [];
  }

  public async saveTopics(topics: TopicItem[]): Promise<void> {
    try {
      const db = await this.getDB();
      if (db) {
        const tx = db.transaction('topics', 'readwrite');
        for (const t of topics) {
          await tx.store.put(t);
          this.inMemoryTopics.set(t.topic_id, t);
        }
        await tx.done;
        return;
      }
    } catch (e) {
      console.warn('IDB saveTopics error', e);
    }
    for (const t of topics) {
      this.inMemoryTopics.set(t.topic_id, t);
    }
  }

  // Preferences
  public getPreferences(): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const stored = localStorage.getItem(PREFS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('localStorage getPreferences error', e);
    }
    return DEFAULT_PREFERENCES;
  }

  public savePreferences(prefs: Partial<UserPreferences>): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getPreferences();
      const updated = { ...current, ...prefs };
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('localStorage savePreferences error', e);
    }
  }

  public async resetAllData(): Promise<void> {
    await this.clearQuestions();
    await this.clearAttempts();
    try {
      const db = await this.getDB();
      if (db) {
        await db.clear('bookmarks');
        await db.clear('topics');
        await db.clear('metadata');
      }
    } catch (e) {
      console.warn('IDB resetAllData error', e);
    }
    this.inMemoryBookmarks.clear();
    this.inMemoryTopics.clear();
    await this.seedInitialData();
  }
}

// Singleton repository instance for app-wide use
export const questionRepository = new IndexedDBRepository();
