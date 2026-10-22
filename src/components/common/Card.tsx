import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const base = 'rounded-2xl border transition-all duration-200 ease-smooth';

  const variants = {
    default: 'bg-nexus-surface border-nexus-border shadow-card glass-sheen',
    elevated: 'bg-nexus-elevated border-nexus-border shadow-elevated glass-sheen',
    interactive:
      'bg-nexus-surface border-nexus-border hover:border-nexus-border-strong hover:bg-nexus-elevated hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer active:scale-[0.99] glass-sheen',
    outline: 'bg-transparent border-nexus-border',
    glass: 'bg-nexus-glass backdrop-blur-md border-nexus-border shadow-glass glass-sheen',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3.5 sm:p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={twMerge(clsx(base, variants[variant], paddings[padding], className))}
      {...props}
    >
      {children}
    </div>
  );
};
