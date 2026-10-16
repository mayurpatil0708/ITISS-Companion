import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { questionRepository } from '@/services/storage/indexeddb.repository';
import { AttemptRecord, BookmarkRecord, UserPreferences } from '@/types';

export interface ToastNotification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
}

interface AppContextType {
  isInitialized: boolean;
  totalQuestionsCount: number;
  bookmarks: Set<string>;
  bookmarkRecords: BookmarkRecord[];
  toggleBookmark: (questionId: string) => Promise<boolean>;
  isBookmarked: (questionId: string) => boolean;
  preferences: UserPreferences;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  lastInProgressAttempt: AttemptRecord | null;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  notifications: ToastNotification[];
  addNotification: (notification: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  refreshAppData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkRecords, setBookmarkRecords] = useState<BookmarkRecord[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(() => questionRepository.getPreferences());
  const [lastInProgressAttempt, setLastInProgressAttempt] = useState<AttemptRecord | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const addNotification = useCallback((notif: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newNotif: ToastNotification = { ...notif, id, timestamp: Date.now() };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 9)]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const refreshAppData = useCallback(async () => {
    try {
      const allQ = await questionRepository.getAllQuestions();
      setTotalQuestionsCount(allQ.length);

      const bms = await questionRepository.getBookmarks();
      setBookmarkRecords(bms);
      setBookmarks(new Set(bms.map((b) => b.questionId)));

      const attempts = await questionRepository.getAllAttempts();
      const inProgress = attempts.find((a) => !a.isCompleted) || null;
      setLastInProgressAttempt(inProgress);

      setPreferences(questionRepository.getPreferences());
    } catch (e) {
      console.error('Failed to refresh app data', e);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      await questionRepository.init();
      if (isMounted) {
        await refreshAppData();
        setIsInitialized(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [refreshAppData]);

  // Global hotkey: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleBookmark = async (questionId: string) => {
    const isNowBookmarked = await questionRepository.toggleBookmark(questionId);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (isNowBookmarked) {
        next.add(questionId);
      } else {
        next.delete(questionId);
      }
      return next;
    });
    // refresh records
    const bms = await questionRepository.getBookmarks();
    setBookmarkRecords(bms);

    addNotification({
      type: isNowBookmarked ? 'success' : 'info',
      title: isNowBookmarked ? 'Question Bookmarked' : 'Bookmark Removed',
      message: `${questionId} ${isNowBookmarked ? 'saved to review list' : 'removed from review list'}`,
    });

    return isNowBookmarked;
  };

  const isBookmarked = (questionId: string) => bookmarks.has(questionId);

  const updatePreferences = (prefs: Partial<UserPreferences>) => {
    questionRepository.savePreferences(prefs);
    setPreferences((prev) => ({ ...prev, ...prefs }));
  };

  return (
    <AppContext.Provider
      value={{
        isInitialized,
        totalQuestionsCount,
        bookmarks,
        bookmarkRecords,
        toggleBookmark,
        isBookmarked,
        preferences,
        updatePreferences,
        lastInProgressAttempt,
        commandPaletteOpen,
        setCommandPaletteOpen,
        notifications,
        addNotification,
        dismissNotification,
        refreshAppData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
