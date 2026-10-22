import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'cyan' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none active:scale-[0.98] cursor-pointer';

  const variants = {
    primary:
      'bg-nexus-accent hover:bg-nexus-accent-hover text-white dark:text-[#101316] font-semibold shadow-sm focus-visible:ring-nexus-accent',
    cyan:
      'bg-nexus-accent hover:bg-nexus-accent-hover text-white dark:text-[#101316] font-semibold shadow-sm focus-visible:ring-nexus-accent',
    secondary:
      'bg-nexus-surface hover:bg-nexus-elevated text-nexus-text border border-nexus-border shadow-subtle focus-visible:ring-nexus-accent',
    outline:
      'border border-nexus-border hover:bg-nexus-elevated text-nexus-text focus-visible:ring-nexus-accent',
    ghost:
      'hover:bg-nexus-elevated/80 text-nexus-text-secondary hover:text-nexus-text focus-visible:ring-nexus-accent',
    glass:
      'bg-nexus-glass backdrop-blur-md border border-nexus-border text-nexus-text hover:bg-nexus-elevated shadow-subtle focus-visible:ring-nexus-accent',
    danger:
      'bg-nexus-error/15 hover:bg-nexus-error/25 text-nexus-error border border-nexus-error/30 focus-visible:ring-nexus-error',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 gap-1.5 rounded-full',
    md: 'text-sm px-4 py-2 gap-2 rounded-full',
    lg: 'text-base px-6 py-2.5 gap-2.5 rounded-full font-semibold',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : icon && iconPosition === 'left' ? (
        icon
      ) : null}
      {children}
      {!isLoading && icon && iconPosition === 'right' ? icon : null}
    </button>
  );
};
