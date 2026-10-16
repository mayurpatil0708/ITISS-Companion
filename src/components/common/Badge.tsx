import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'cyan' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const base = 'inline-flex items-center font-mono font-medium rounded transition-colors';

  const variants = {
    default: 'bg-nexus-elevated text-nexus-text-secondary border border-nexus-border',
    primary: 'bg-nexus-accent/15 text-nexus-accent border border-nexus-accent/30',
    cyan: 'bg-nexus-cyan/15 text-nexus-cyan border border-nexus-cyan/30',
    success: 'bg-nexus-success/15 text-nexus-success border border-nexus-success/30',
    warning: 'bg-nexus-warning/15 text-nexus-warning border border-nexus-warning/30',
    error: 'bg-nexus-error/15 text-nexus-error border border-nexus-error/30',
    outline: 'border border-nexus-border text-nexus-text-secondary',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], sizes[size], className))}>
      {children}
    </span>
  );
};
