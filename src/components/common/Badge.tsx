import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'cyan' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
}) => {
  const base = 'inline-flex items-center font-medium rounded-full transition-colors leading-none';

  const variants = {
    default: 'bg-nexus-elevated/70 text-nexus-text-secondary border border-nexus-border',
    primary: 'bg-nexus-accent/15 text-nexus-accent border border-nexus-accent/25 font-semibold',
    secondary: 'bg-nexus-accent-secondary/15 text-nexus-accent-secondary border border-nexus-accent-secondary/25',
    cyan: 'bg-nexus-accent/15 text-nexus-accent border border-nexus-accent/25',
    success: 'bg-nexus-success/15 text-nexus-success border border-nexus-success/25',
    warning: 'bg-nexus-warning/15 text-nexus-warning border border-nexus-warning/25',
    error: 'bg-nexus-error/15 text-nexus-error border border-nexus-error/25',
    outline: 'border border-nexus-border text-nexus-text-secondary bg-transparent',
  };

  const sizes = {
    sm: 'text-[11px] px-2.5 py-1 gap-1',
    md: 'text-xs px-3 py-1.5 gap-1.5',
  };

  return (
    <span className={twMerge(clsx(base, variants[variant], sizes[size], className))}>
      {children}
    </span>
  );
};
