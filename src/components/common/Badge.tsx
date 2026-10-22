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
  const base = 'inline-flex items-center font-mono font-medium rounded-md transition-colors';

  const variants = {
    default: 'bg-nexus-elevated text-nexus-text-secondary border border-nexus-border/80',
    primary: 'bg-nexus-accent/10 text-nexus-accent border border-nexus-accent/20',
    cyan: 'bg-nexus-cyan/10 text-nexus-cyan border border-nexus-cyan/20',
    success: 'bg-nexus-success/10 text-nexus-success border border-nexus-success/20',
    warning: 'bg-nexus-warning/10 text-nexus-warning border border-nexus-warning/20',
    error: 'bg-nexus-error/10 text-nexus-error border border-nexus-error/20',
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
