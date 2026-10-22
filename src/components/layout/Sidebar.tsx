import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  Terminal,
  Server,
  Layers,
  FolderTree,
  GraduationCap,
  RotateCcw,
  BarChart3,
  Database,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpenCheck,
  BookOpen,
  Shield,
  Monitor,
  Network,
  Code2,
  Cloud,
  ClipboardCheck,
  ShieldCheck,
  Search,
  Key,
  ShieldAlert,
  Lock,
  Home,
  ArrowLeftRight,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';
import { useApp } from '@/context/AppContext';
import { useExamStage } from '@/context/ExamStageContext';
import { useTheme } from '@/context/ThemeContext';
import { getModulesByStage, ModuleDefinition, ExamStage } from '@/data/module-registry';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Monitor,
  Network,
  Code2,
  Cloud,
  ClipboardCheck,
  ShieldCheck,
  Search,
  Key,
  ShieldAlert,
  Terminal,
  Server,
  Layers,
};

interface NavigationItem {
  label: string;
  path: string;
  icon: React.FC<any>;
  section: 'workspace' | 'exams' | 'modules' | 'study' | 'progress' | 'preferences';
  badge?: string;
  isModule?: boolean;
  isAvailable?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalQuestionsCount } = useApp();
  const { currentStage, setStage, clearStage } = useExamStage();
  const { theme } = useTheme();

  const modules = currentStage ? getModulesByStage(currentStage) : [];

  const handleStageSwitch = () => {
    const newStage: ExamStage = currentStage === 'cmce' ? 'ccee' : 'cmce';
    setStage(newStage);
    navigate(`/${newStage}`);
    onCloseMobile();
  };

  const handleGoHome = () => {
    clearStage();
    navigate('/');
    onCloseMobile();
  };

  // Build Spotify-inspired categorized navigation
  const buildNavigation = (): NavigationItem[] => {
    const stagePrefix = currentStage ? `/${currentStage}` : '/cmce';

    const nav: NavigationItem[] = [
      // 1. Your Workspace
      { label: 'Home', path: '/', icon: Home, section: 'workspace' },
      { label: 'Continue Learning', path: '/overview', icon: LayoutDashboard, section: 'workspace' },

      // 2. Examinations
      { label: 'CMCE Track', path: '/cmce', icon: BookOpen, section: 'exams' },
      { label: 'CCEE Track', path: '/ccee', icon: Shield, section: 'exams' },
    ];

    // 3. Active Stage Modules
    if (currentStage && modules.length > 0) {
      for (const mod of modules) {
        const ModIcon = ICON_MAP[mod.icon] || Monitor;
        nav.push({
          label: mod.shortName,
          path: `${stagePrefix}/${mod.slug}`,
          icon: ModIcon,
          section: 'modules',
          isModule: true,
          isAvailable: mod.contentStatus !== 'coming_soon',
        });
      }
    }

    // 4. Study & Practice Engine
    nav.push(
      { label: 'MCQ Practice', path: `${stagePrefix}/practice`, icon: Sparkles, section: 'study' },
      { label: 'Topic Explorer', path: `${stagePrefix}/topics`, icon: FolderTree, section: 'study' },
      { label: 'Mock Exam', path: `${stagePrefix}/exam`, icon: GraduationCap, section: 'study' }
    );

    // 5. Progress & Library
    nav.push(
      { label: 'Review Mistakes', path: `${stagePrefix}/review`, icon: RotateCcw, section: 'progress' },
      {
        label: 'Question Bank',
        path: `${stagePrefix}/question-bank`,
        icon: Database,
        section: 'progress',
        badge: totalQuestionsCount > 0 ? String(totalQuestionsCount) : undefined,
      },
      { label: 'Analytics', path: `${stagePrefix}/analytics`, icon: BarChart3, section: 'progress' }
    );

    // 6. Preferences
    nav.push({ label: 'Settings', path: '/settings', icon: Settings, section: 'preferences' });

    return nav;
  };

  const navigationItems = buildNavigation();

  // Group items by section
  const workspaceItems = navigationItems.filter((n) => n.section === 'workspace');
  const examItems = navigationItems.filter((n) => n.section === 'exams');
  const moduleItems = navigationItems.filter((n) => n.section === 'modules');
  const studyItems = navigationItems.filter((n) => n.section === 'study');
  const progressItems = navigationItems.filter((n) => n.section === 'progress');
  const preferenceItems = navigationItems.filter((n) => n.section === 'preferences');

  const renderNavItem = (item: NavigationItem) => {
    const Icon = item.icon;
    const isActive =
      item.path === '/'
        ? location.pathname === '/'
        : location.pathname === item.path ||
          (item.path !== '/overview' &&
            item.path !== '/cmce' &&
            item.path !== '/ccee' &&
            location.pathname.startsWith(item.path + '/'));

    const isLocked = item.isModule && !item.isAvailable;

    const activeStyles =
      theme === 'dark'
        ? isActive
          ? 'bg-nexus-elevated text-white font-semibold border-l-2 border-nexus-cyan pl-2.5'
          : 'text-nexus-text-secondary hover:text-white hover:bg-nexus-elevated/40'
        : isActive
        ? 'bg-nexus-surface text-nexus-text font-semibold shadow-subtle border border-nexus-border'
        : 'text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated/60';

    return (
      <NavLink
        key={item.path}
        to={isLocked ? '#' : item.path}
        onClick={(e) => {
          if (isLocked) {
            e.preventDefault();
            return;
          }
          onCloseMobile();
        }}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
          isLocked
            ? 'text-nexus-text-muted cursor-not-allowed opacity-40'
            : activeStyles
        }`}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon
          className={`w-4 h-4 flex-shrink-0 transition-colors ${
            isLocked
              ? 'text-nexus-text-muted'
              : isActive
              ? theme === 'dark'
                ? 'text-nexus-cyan'
                : 'text-nexus-accent'
              : 'text-nexus-text-muted group-hover:text-nexus-text'
          }`}
        />
        {!isCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="truncate">{item.label}</span>
            <div className="flex items-center gap-1">
              {isLocked && <Lock className="w-3 h-3 text-nexus-text-muted" />}
              {item.badge && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-nexus-elevated text-nexus-cyan border border-nexus-border">
                  {item.badge}
                </span>
              )}
            </div>
          </div>
        )}
      </NavLink>
    );
  };

  const renderSectionHeader = (title: string) => {
    if (isCollapsed) return <div className="pt-2 border-t border-nexus-border/40 my-1" />;
    return (
      <div className="px-3 pt-3.5 pb-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-nexus-text-muted">
          {title}
        </span>
      </div>
    );
  };

  const content = (
    <div className="flex flex-col h-full bg-nexus-sidebar border-r border-nexus-border select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-nexus-border">
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-nexus-accent flex items-center justify-center text-white shadow-subtle group-hover:opacity-90 transition-opacity flex-shrink-0">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 text-left">
              <span className="font-bold text-sm tracking-wide text-nexus-text block leading-none">
                {APP_CONFIG.shortName}
              </span>
              <span className="text-[10px] font-mono text-nexus-accent font-medium block truncate mt-0.5">
                COMPANION
              </span>
            </div>
          )}
        </button>
        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-md text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Stage Switcher Pill (if an exam stage is active) */}
      {currentStage && !isCollapsed && (
        <div className="px-3 py-2.5 border-b border-nexus-border/60">
          <button
            onClick={handleStageSwitch}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-nexus-elevated/50 border border-nexus-border/80 hover:border-nexus-accent/30 transition-all text-left group"
          >
            <div className="flex items-center gap-2 min-w-0">
              {currentStage === 'cmce' ? (
                <BookOpen className="w-4 h-4 text-nexus-accent flex-shrink-0" />
              ) : (
                <Shield className="w-4 h-4 text-nexus-cyan flex-shrink-0" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-nexus-text">{currentStage.toUpperCase()}</div>
                <div className="text-[10px] text-nexus-text-muted truncate">
                  {currentStage === 'cmce' ? '4 modules available' : '5 modules coming soon'}
                </div>
              </div>
            </div>
            <ArrowLeftRight className="w-3.5 h-3.5 text-nexus-text-muted group-hover:text-nexus-accent transition-colors flex-shrink-0" />
          </button>
        </div>
      )}

      {/* Navigation Links — Spotify-inspired grouping */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {/* 1. Your Workspace */}
        {renderSectionHeader('Your Workspace')}
        {workspaceItems.map(renderNavItem)}

        {/* 2. Examinations */}
        {renderSectionHeader('Examinations')}
        {examItems.map(renderNavItem)}

        {/* 3. Stage Modules (when active stage) */}
        {moduleItems.length > 0 && (
          <>
            {renderSectionHeader(`${currentStage?.toUpperCase()} Modules`)}
            {moduleItems.map(renderNavItem)}
          </>
        )}

        {/* 4. Study & Practice */}
        {renderSectionHeader('Study')}
        {studyItems.map(renderNavItem)}

        {/* 5. Progress & Library */}
        {renderSectionHeader('Progress')}
        {progressItems.map(renderNavItem)}

        {/* 6. Preferences */}
        {renderSectionHeader('Preferences')}
        {preferenceItems.map(renderNavItem)}
      </nav>

      {/* Bottom Status */}
      {!isCollapsed && (
        <div className="p-3 m-2 rounded bg-nexus-elevated/40 border border-nexus-border/60">
          <div className="text-[11px] text-nexus-text-muted leading-normal">
            {APP_CONFIG.tagline}
          </div>
          {totalQuestionsCount > 0 && (
            <div className="text-[10px] font-mono text-nexus-text-secondary mt-2 flex items-center justify-between">
              <span>Verified Bank:</span>
              <span className="text-nexus-cyan font-bold">{totalQuestionsCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed left-0 top-0 bottom-0 z-40 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform duration-200 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>
    </>
  );
};
