import React from 'react';
import { Loader2Icon } from 'lucide-react';
import { cn } from '../../utils/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'icon' | 'icon-sm';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-strong shadow-panel',
  secondary: 'border border-line bg-surface text-fg hover:border-line-strong hover:bg-raised',
  ghost: 'text-muted hover:bg-raised hover:text-fg',
  danger: 'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/15'
};

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  icon: 'h-9 w-9',
  'icon-sm': 'h-8 w-8'
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
{ variant = 'secondary', size = 'md', loading, leadingIcon, className, children, disabled, ...rest },
ref)
{
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'cv-focus inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-lg font-medium',
        'transition-[background-color,border-color,color,transform] duration-150 ease-out active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}>

      {loading ? <Loader2Icon className="h-4 w-4 animate-spin" aria-hidden /> : leadingIcon}
      {children}
    </button>);

});