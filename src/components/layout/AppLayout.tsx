import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { CommandPalette } from '@/components/common/CommandPalette';
import { useApp } from '@/context/AppContext';

export const AppLayout: React.FC = () => {
  const { preferences, updatePreferences } = useApp();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isCollapsed = preferences.sidebarCollapsed;

  const handleToggleCollapse = () => {
    updatePreferences({ sidebarCollapsed: !isCollapsed });
  };

  return (
    <div className="min-h-screen bg-nexus-bg text-nexus-text flex flex-col selection:bg-nexus-accent/30 selection:text-white">
      {/* Sidebar (Desktop + Mobile Drawer) */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main content wrapper shifted by desktop sidebar width */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          isCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        <Header
          onToggleSidebar={() => setIsMobileSidebarOpen(true)}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn focus-visible:outline-none">
          <Outlet />
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandPalette />
    </div>
  );
};
