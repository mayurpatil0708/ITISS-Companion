import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  ShieldAlert,
  HardDrive,
} from 'lucide-react';
import { APP_CONFIG } from '@/config/app.config';
import { useApp } from '@/context/AppContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation();
  const { totalQuestionsCount } = useApp();

  const navigationItems = [
    { label: 'Overview', path: '/', icon: LayoutDashboard },
    { label: 'Practice Setup', path: '/practice', icon: Sparkles, exact: true },
    { label: 'Linux & OS Bank', path: '/practice/linux', icon: Terminal },
    { label: 'Windows Server', path: '/practice/windows', icon: Server },
    { label: 'Cross-platform', path: '/practice/cross-platform', icon: Layers },
    { label: 'Topic Explorer', path: '/topics', icon: FolderTree },
    { label: 'Mock Exam', path: '/exam', icon: GraduationCap },
    { label: 'Review Mistakes', path: '/review', icon: RotateCcw },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 },
    { label: 'Question Bank', path: '/question-bank', icon: Database, badge: totalQuestionsCount > 0 ? String(totalQuestionsCount) : undefined },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const content = (
    <div className="flex flex-col h-full bg-nexus-sidebar border-r border-nexus-border select-none">
      {/* Brand Header */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-nexus-border">
        <NavLink
          to="/"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 overflow-hidden group focus-visible:outline-none"
        >
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-subtle group-hover:scale-105 transition-transform flex-shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-wider text-nexus-text block leading-none">
                NEXUS
              </span>
              <span className="text-[10px] font-mono text-nexus-cyan block truncate mt-0.5">
                CMCE ACADEMY
              </span>
            </div>
          )}
        </NavLink>
        {/* Desktop Collapse Toggle */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated transition-colors"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact
            ? location.pathname === item.path
            : location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={`flex items-center gap-3 px-3 py-2 rounded text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-nexus-accent/15 text-nexus-text border-l-2 border-nexus-accent font-semibold shadow-xs'
                  : 'text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 transition-colors ${
                  isActive ? 'text-nexus-accent' : 'text-nexus-text-muted group-hover:text-nexus-text'
                }`}
              />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between min-w-0">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-nexus-elevated text-nexus-cyan border border-nexus-border">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* System Status Banner at bottom */}
      {!isCollapsed && (
        <div className="p-3 m-2 rounded bg-nexus-elevated/40 border border-nexus-border/60">
          <div className="flex items-center gap-2 text-xs font-medium text-nexus-text">
            <ShieldAlert className="w-3.5 h-3.5 text-nexus-cyan" />
            <span>CDAC CMCE Bank</span>
          </div>
          <div className="text-[11px] text-nexus-text-muted mt-1 leading-normal">
            {APP_CONFIG.tagline}
          </div>
          <div className="text-[10px] font-mono text-nexus-text-secondary mt-2 flex items-center justify-between">
            <span>Verified Questions:</span>
            <span className="text-nexus-cyan font-bold">{totalQuestionsCount}</span>
          </div>
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
