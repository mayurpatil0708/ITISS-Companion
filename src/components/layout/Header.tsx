import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Search,
  Moon,
  Sun,
  Bell,
  Menu,
  ChevronRight,
  BookOpenCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { useTheme } from '@/context/ThemeContext';
import { useExamStage } from '@/context/ExamStageContext';
import { APP_CONFIG } from '@/config/app.config';
import { getModuleBySlug } from '@/data/module-registry';

interface HeaderProps {
  onToggleSidebar: () => void;
  isMobileSidebarOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { setCommandPaletteOpen, notifications, dismissNotification, preferences } = useApp();
  const { theme, toggleTheme } = useTheme();
  const { currentStage } = useExamStage();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  // Build smart breadcrumbs
  const buildBreadcrumbs = () => {
    const crumbs: { label: string; path: string }[] = [
      { label: APP_CONFIG.shortName, path: '/' },
    ];

    const pathSegments = location.pathname.split('/').filter(Boolean);

    if (pathSegments.length === 0) {
      return crumbs;
    }

    // First segment is usually the stage
    if (pathSegments[0] === 'cmce' || pathSegments[0] === 'ccee') {
      crumbs.push({
        label: pathSegments[0].toUpperCase(),
        path: `/${pathSegments[0]}`,
      });

      // Second segment could be a module slug
      if (pathSegments[1]) {
        const mod = getModuleBySlug(pathSegments[1]);
        if (mod) {
          crumbs.push({
            label: mod.shortName,
            path: `/${pathSegments[0]}/${pathSegments[1]}`,
          });

          // Third segment is a tool (practice, topics, etc.)
          if (pathSegments[2]) {
            const toolLabel = pathSegments[2].charAt(0).toUpperCase() + pathSegments[2].slice(1).replace(/-/g, ' ');
            crumbs.push({
              label: toolLabel,
              path: `/${pathSegments.slice(0, 3).join('/')}`,
            });
          }
        } else {
          // Not a module, it's a tool at the stage level
          const toolLabel = pathSegments[1].charAt(0).toUpperCase() + pathSegments[1].slice(1).replace(/-/g, ' ');
          crumbs.push({
            label: toolLabel,
            path: `/${pathSegments.slice(0, 2).join('/')}`,
          });
        }
      }
    } else if (pathSegments[0] === 'settings') {
      crumbs.push({ label: 'Settings', path: '/settings' });
    } else {
      // Generic fallback
      pathSegments.forEach((seg, idx) => {
        const url = `/${pathSegments.slice(0, idx + 1).join('/')}`;
        const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' ');
        crumbs.push({ label, path: url });
      });
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  return (
    <header className="h-14 border-b border-nexus-border bg-nexus-surface/90 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-nexus-text-secondary">
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={crumb.path + idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-nexus-text-muted" />}
                {isLast ? (
                  <span className="font-medium text-nexus-text">{crumb.label}</span>
                ) : (
                  <Link to={crumb.path} className="hover:text-nexus-text transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Search trigger, theme, notifications, profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 text-xs rounded bg-nexus-elevated border border-nexus-border text-nexus-text-secondary hover:text-nexus-text hover:border-nexus-accent/40 transition-all cursor-pointer"
          aria-label="Search and command palette"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search questions, topics...</span>
          <span className="md:hidden">Search</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-nexus-surface border border-nexus-border rounded text-nexus-text-muted">
            Ctrl+K
          </kbd>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated border border-transparent hover:border-nexus-border transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded text-nexus-text-secondary hover:text-nexus-text hover:bg-nexus-elevated border border-transparent hover:border-nexus-border transition-colors relative"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-nexus-accent animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-nexus-surface border border-nexus-border rounded-lg shadow-elevated z-50 overflow-hidden animate-fadeIn">
              <div className="px-4 py-2.5 border-b border-nexus-border flex items-center justify-between bg-nexus-elevated/40">
                <span className="text-xs font-semibold text-nexus-text">Notifications</span>
                <span className="text-[11px] font-mono text-nexus-text-muted">{notifications.length} active</span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-nexus-border/30">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-nexus-text-muted">
                    No recent notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 flex items-start gap-2.5 hover:bg-nexus-elevated/40 transition-colors">
                      {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-nexus-success flex-shrink-0 mt-0.5" />}
                      {n.type === 'warning' && <AlertCircle className="w-4 h-4 text-nexus-warning flex-shrink-0 mt-0.5" />}
                      {n.type === 'error' && <AlertCircle className="w-4 h-4 text-nexus-error flex-shrink-0 mt-0.5" />}
                      {n.type === 'info' && <Info className="w-4 h-4 text-nexus-cyan flex-shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-nexus-text">{n.title}</p>
                        {n.message && <p className="text-[11px] text-nexus-text-secondary mt-0.5">{n.message}</p>}
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-nexus-text-muted hover:text-nexus-text p-0.5"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Tag */}
        <div className="flex items-center gap-2 pl-2 border-l border-nexus-border">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 border border-nexus-accent/40 flex items-center justify-center text-nexus-accent">
            <BookOpenCheck className="w-4 h-4" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-medium text-nexus-text leading-tight">{preferences.userName}</div>
            <div className="text-[10px] font-mono text-nexus-text-muted leading-tight">
              {currentStage ? `${currentStage.toUpperCase()} Prep` : APP_CONFIG.shortName}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
