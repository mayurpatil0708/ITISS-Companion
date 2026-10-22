import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'interactive' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  className,
  ...props
}) => {
  const base = 'rounded-xl border transition-all duration-150';

  const variants = {
    default: 'bg-nexus-surface border-nexus-border/80 shadow-subtle',
    elevated: 'bg-nexus-elevated border-nexus-border shadow-card',
    interactive: 'bg-nexus-surface border-nexus-border/80 hover:border-nexus-accent/40 hover:shadow-card cursor-pointer',
    outline: 'bg-transparent border-nexus-border',
  };

  const paddings = {
    none: 'p-0',
    sm: 'p-3.5',
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
