import { openDB, IDBPDatabase } from 'idb';
import { Question, AttemptRecord, BookmarkRecord, TopicItem, UserPreferences, Subject } from '@/types';
import { IQuestionRepository, QuestionFilter } from './repository.interface';
import { APP_CONFIG } from '@/config/app.config';

// Import fallback seed question banks for offline/test environments
import linuxBank from '@/data/seed/linux_question_bank.json';
import windowsBank from '@/data/seed/windows_question_bank.json';
import crossBank from '@/data/seed/cross_platform_question_bank.json';
import topicInventory from '@/data/seed/topic_inventory.json';

const DB_NAME = 'nexus_cmce_database';
const DB_VERSION = 2;
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

/**
 * Normalizes question data across schema variants (snake_case vs camelCase)
 * ensuring full dual-property compatibility in IndexedDB and UI.
 */
export function normalizeQuestion(raw: any, subjectFallback?: Subject): Question {
  const qId = raw.question_id || raw.id || `q_${Math.random().toString(36).substring(2, 9)}`;
  const subj = (raw.subject || raw.subjectId || subjectFallback || 'cosa') as Subject;
  const topicId = raw.topic_id || raw.topicId || 'GENERAL';
  const topicName = raw.topic || raw.topicName || raw.topicId || 'General';
  const subtopicId = raw.subtopic_id || raw.subtopicId || 'GENERAL-SUB';
  const subtopicName = raw.subtopic || raw.subtopicName || raw.subtopicId || topicName;
  const correctOpt = (raw.correct_option_id || raw.correctOptionId || (raw.correctOptionIds && raw.correctOptionIds[0]) || 'A') as 'A' | 'B' | 'C' | 'D' | string;
  const qText = raw.question_text || raw.question || '';
  const diff = (raw.difficulty && ['foundational', 'intermediate', 'advanced'].includes(raw.difficulty))
    ? raw.difficulty
    : 'intermediate';
  const qType = raw.question_type || raw.questionType || 'conceptual';
  const optionExplanations = raw.option_explanations || raw.optionExplanations || {};

  return {
    ...raw,
    question_id: qId,
    id: qId,
    subject: subj,
    subjectId: subj,
    topic_id: topicId,
    topicId: topicId,
    subtopic_id: subtopicId,
    subtopicId: subtopicId,
    topic: topicName,
    topicName: topicName,
    subtopic: subtopicName,
    subtopicName: subtopicName,
    correct_option_id: correctOpt,
    correctOptionId: correctOpt,
    correctOptionIds: raw.correctOptionIds || [correctOpt],
    question_text: qText,
    question: qText,
    difficulty: diff,
    question_type: qType,
    questionType: qType,
    option_explanations: optionExplanations,
    optionExplanations: optionExplanations,
    options: raw.options || [],
    explanation: raw.explanation || '',
    source: raw.source || { document_id: 'CDAC-CMCE' },
    tags: raw.tags || [subj],
    related_question_ids: raw.related_question_ids || [],
    estimated_time_seconds: raw.estimated_time_seconds || 60,
  };
}

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
    const loadedQuestions: Question[] = [];

    // Attempt to load all 4 CMCE verified question banks from public directory
    const FINAL_BANKS = [
      { subject: 'cosa', file: 'cosa_final_question_bank.json' },
      { subject: 'fundamental-computer-networks', file: 'fundamental_computer_networks_final_question_bank.json' },
      { subject: 'programming-concepts', file: 'programming_concepts_final_question_bank.json' },
      { subject: 'it-infrastructure-devops', file: 'it_infrastructure_devops_final_question_bank.json' },
    ];

    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      try {
        const meta = (typeof import.meta !== 'undefined' ? (import.meta as unknown as { env?: { BASE_URL?: string } }) : null);
        const baseUrl = meta?.env?.BASE_URL ? meta.env.BASE_URL.replace(/\/$/, '') : '';

        for (const bank of FINAL_BANKS) {
          try {
            const url = `${baseUrl}/question-banks/final/${bank.file}`;
            const res = await fetch(url);
            if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data.questions)) {
                for (const rawQ of data.questions) {
                  loadedQuestions.push(normalizeQuestion(rawQ, bank.subject as Subject));
                }
              }
            } else {
              console.warn(`Failed to fetch ${url} (status ${res.status})`);
            }
          } catch (fetchErr) {
            console.warn(`Error fetching ${bank.file}:`, fetchErr);
          }
        }
      } catch (err) {
        console.warn('Error during dynamic bank fetch:', err);
      }
    }

    // Fallback to bundled seed banks if dynamic fetch returned no questions (e.g. offline unit tests)
    if (loadedQuestions.length === 0) {
      const fallbackQuestions: Question[] = [
        ...(linuxBank.questions as unknown as Question[]),
        ...(windowsBank.questions as unknown as Question[]),
        ...(crossBank.questions as unknown as Question[]),
      ];
      for (const q of fallbackQuestions) {
        loadedQuestions.push(normalizeQuestion(q));
      }
    }

    const topics: TopicItem[] = (topicInventory.topics as unknown as TopicItem[]) || [];

    await this.saveQuestions(loadedQuestions);
    await this.saveTopics(topics);

    const db = await this.getDB();
    if (db) {
      await db.put('metadata', {
        key: 'seeded_version',
        value: '2.0.0',
        count: loadedQuestions.length,
        date: new Date().toISOString(),
      });
    }

    return loadedQuestions.length;
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      const db = await this.getDB();
      if (db) {
        const count = await db.count('questions');
        // Auto-upgrade if empty or if previously seeded with only mock questions (< 7000)
        if (count < 7000) {
          if (count > 0) {
            console.info(`Upgrading question bank from ${count} questions to full CMCE 7,783 questions...`);
            await this.clearQuestions();
          }
          await this.seedInitialData();
        }
      } else {
        if (this.inMemoryQuestions.size < 7000) {
          if (this.inMemoryQuestions.size > 0) {
            await this.clearQuestions();
          }
          await this.seedInitialData();
        }
      }
    } catch {
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
      if (filter.subject === 'cosa') {
        questions = questions.filter(
          (q) => q.subject === 'cosa' || q.subject === 'linux' || q.subject === 'windows' || q.subject === 'cross_platform'
        );
      } else if (filter.subject === 'fundamental-computer-networks' || filter.subject === 'fcn') {
        questions = questions.filter((q) => q.subject === 'fundamental-computer-networks' || q.subject === 'fcn');
      } else if (filter.subject === 'programming-concepts' || filter.subject === 'pc') {
        questions = questions.filter((q) => q.subject === 'programming-concepts' || q.subject === 'pc');
      } else if (filter.subject === 'it-infrastructure-devops' || filter.subject === 'itid' || filter.subject === 'iimd') {
        questions = questions.filter((q) => q.subject === 'it-infrastructure-devops' || q.subject === 'itid' || q.subject === 'iimd');
      } else {
        questions = questions.filter((q) => q.subject === filter.subject);
      }
    }

    // Filter by topic list
    if (filter.topics && filter.topics.length > 0) {
      const topicSet = new Set(filter.topics);
      questions = questions.filter(
        (q) => topicSet.has(q.topic) || topicSet.has(q.topic_id) || (q.topicId && topicSet.has(q.topicId)) || (q.topicName && topicSet.has(q.topicName))
      );
    }

    // Filter by subtopic list
    if (filter.subtopics && filter.subtopics.length > 0) {
      const subtopicSet = new Set(filter.subtopics);
      questions = questions.filter(
        (q) =>
          subtopicSet.has(q.subtopic) ||
          subtopicSet.has(q.subtopic_id) ||
          (q.subtopicId && subtopicSet.has(q.subtopicId)) ||
          (q.subtopicName && subtopicSet.has(q.subtopicName))
      );
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
        const CHUNK_SIZE = 1000;
        for (let i = 0; i < questions.length; i += CHUNK_SIZE) {
          const chunk = questions.slice(i, i + CHUNK_SIZE);
          const tx = db.transaction('questions', 'readwrite');
          for (const rawQ of chunk) {
            const q = normalizeQuestion(rawQ);
            await tx.store.put(q);
            this.inMemoryQuestions.set(q.question_id, q);
            savedCount++;
          }
          await tx.done;
        }
        return savedCount;
      }
    } catch (e) {
      console.warn('IDB saveQuestions error, saving to in-memory', e);
    }

    for (const rawQ of questions) {
      const q = normalizeQuestion(rawQ);
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
