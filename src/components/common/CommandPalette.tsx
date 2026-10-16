import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Terminal,
  Server,
  Layers,
  FolderTree,
  RotateCcw,
  BarChart3,
  Database,
  Moon,
  Sun,
  PlayCircle,
  FileText,
  Bookmark,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { Question } from '@/types';
import { questionRepository } from '@/services/storage/indexeddb.repository';

interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Questions' | 'Preferences';
  title: string;
  description?: string;
  icon: React.ReactNode;
  onSelect: () => void;
  shortcut?: string;
}

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, lastInProgressAttempt } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [questionResults, setQuestionResults] = useState<Question[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Debounced search for questions
  useEffect(() => {
    if (!query.trim()) {
      setQuestionResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const matches = await questionRepository.getQuestions({
          searchQuery: query,
          limit: 8,
        });
        setQuestionResults(matches);
      } catch (e) {
        console.error('Search error', e);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  // Static action items
  const baseActions: CommandItem[] = [
    ...(lastInProgressAttempt
      ? [
          {
            id: 'resume_attempt',
            category: 'Actions' as const,
            title: `Resume Attempt: ${lastInProgressAttempt.title}`,
            description: `${lastInProgressAttempt.items.filter((i) => i.selectedOptionId).length} of ${lastInProgressAttempt.totalQuestions} questions answered`,
            icon: <PlayCircle className="w-4 h-4 text-nexus-cyan" />,
            onSelect: () => {
              navigate(`/quiz/${lastInProgressAttempt.id}`);
              setCommandPaletteOpen(false);
            },
            shortcut: 'Enter',
          },
        ]
      : []),
    {
      id: 'start_practice',
      category: 'Actions',
      title: 'Practice Configuration',
      description: 'Configure custom practice session with filters & topics',
      icon: <Sparkles className="w-4 h-4 text-nexus-accent" />,
      onSelect: () => {
        navigate('/practice');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'practice_linux',
      category: 'Actions',
      title: 'Practice: Linux & Operating Systems Bank',
      description: 'Start targeted practice on Linux process, I/O, storage & networking',
      icon: <Terminal className="w-4 h-4 text-indigo-400" />,
      onSelect: () => {
        navigate('/practice/linux');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'practice_windows',
      category: 'Actions',
      title: 'Practice: Windows Server Bank',
      description: 'Practice Active Directory, Group Policy, PowerShell & Hyper-V',
      icon: <Server className="w-4 h-4 text-cyan-400" />,
      onSelect: () => {
        navigate('/practice/windows');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'practice_cross',
      category: 'Actions',
      title: 'Practice: Cross-platform Bank',
      description: 'AD realm joining, SSSD, Kerberos, NFS/SMB interop',
      icon: <Layers className="w-4 h-4 text-emerald-400" />,
      onSelect: () => {
        navigate('/practice/cross-platform');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'mock_exam',
      category: 'Actions',
      title: 'Mock Examination',
      description: 'Full timed examination mode with simulated exam scoring',
      icon: <FileText className="w-4 h-4 text-amber-400" />,
      onSelect: () => {
        navigate('/exam');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav_topics',
      category: 'Navigation',
      title: 'Open Topic Explorer',
      description: 'Browse complete CDAC syllabus hierarchy and subtopics',
      icon: <FolderTree className="w-4 h-4 text-nexus-text-secondary" />,
      onSelect: () => {
        navigate('/topics');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav_review',
      category: 'Navigation',
      title: 'Review Mistakes & Bookmarks',
      description: 'Revisit missed questions and bookmarked technical items',
      icon: <RotateCcw className="w-4 h-4 text-nexus-text-secondary" />,
      onSelect: () => {
        navigate('/review');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav_analytics',
      category: 'Navigation',
      title: 'Performance Analytics',
      description: 'Inspect accuracy, weak-area rankings, and study streak',
      icon: <BarChart3 className="w-4 h-4 text-nexus-text-secondary" />,
      onSelect: () => {
        navigate('/analytics');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'nav_qb',
      category: 'Navigation',
      title: 'Question Bank Manager',
      description: 'Import JSON files, validate schemas, view raw records & export',
      icon: <Database className="w-4 h-4 text-nexus-text-secondary" />,
      onSelect: () => {
        navigate('/question-bank');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'toggle_theme',
      category: 'Preferences',
      title: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`,
      description: `Currently using ${theme} mode`,
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />,
      onSelect: () => {
        toggleTheme();
        setCommandPaletteOpen(false);
      },
    },
  ];

  // Filter actions based on search query
  const filteredActions = query.trim()
    ? baseActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          (a.description && a.description.toLowerCase().includes(query.toLowerCase()))
      )
    : baseActions;

  // Question search items
  const questionActionItems: CommandItem[] = questionResults.map((q) => ({
    id: q.question_id,
    category: 'Questions',
    title: `${q.question_id}: ${q.question_text.slice(0, 75)}...`,
    description: `${q.subject.toUpperCase()} • ${q.topic} • ${q.difficulty}`,
    icon: <Bookmark className="w-4 h-4 text-nexus-accent" />,
    onSelect: () => {
      // Jump to question bank view with search
      navigate(`/question-bank?id=${q.question_id}`);
      setCommandPaletteOpen(false);
    },
  }));

  const allItems = [...filteredActions, ...questionActionItems];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (allItems.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + (allItems.length || 1)) % (allItems.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].onSelect();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-nexus-surface border border-nexus-border rounded-lg shadow-elevated overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-nexus-border bg-nexus-elevated/40">
          <Search className="w-5 h-5 text-nexus-text-secondary mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            className="w-full bg-transparent border-none text-nexus-text text-sm placeholder:text-nexus-text-muted focus:outline-none"
            placeholder="Type a command or search questions, topics, commands (e.g. systemd, AD, fsmo)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono text-nexus-text-secondary bg-nexus-elevated border border-nexus-border rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 divide-y divide-nexus-border/30">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-nexus-text-secondary">
              {isSearching ? 'Searching question bank...' : `No matching actions or questions for "${query}"`}
            </div>
          ) : (
            allItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => item.onSelect()}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded cursor-pointer transition-colors ${
                    isSelected ? 'bg-nexus-accent/15 text-nexus-text border-l-2 border-nexus-accent' : 'hover:bg-nexus-elevated text-nexus-text-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="flex-shrink-0">{item.icon}</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-nexus-text truncate">{item.title}</div>
                      {item.description && (
                        <div className="text-xs text-nexus-text-muted truncate">{item.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-nexus-elevated text-nexus-text-muted border border-nexus-border/50">
                      {item.category}
                    </span>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-nexus-surface border border-nexus-border rounded text-nexus-text-secondary">
                        {item.shortcut}
                      </kbd>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 border-t border-nexus-border bg-nexus-elevated/30 flex items-center justify-between text-[11px] text-nexus-text-muted font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <div>NEXUS Command Engine</div>
        </div>
      </div>
    </div>
  );
};
