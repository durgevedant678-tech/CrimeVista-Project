import { AlertTriangleIcon, RotateCwIcon, WifiOffIcon } from 'lucide-react';
import { friendlyError } from '../../api/errors';
import { Button } from './Button';
import { cn } from '../../utils/cn';

interface ErrorStateProps {
  error: unknown;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export function ErrorState({ error, onRetry, compact, className }: ErrorStateProps) {
  const { title, description, status } = friendlyError(error);
  const Icon = status === 0 ? WifiOffIcon : AlertTriangleIcon;
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-6' : 'px-6 py-12', className)}>
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-amber/25 bg-amber/10 text-amber">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-fg">{title}</p>
      <p className="cv-caption mt-1 max-w-sm">{description}</p>
      {onRetry &&
      <Button size="sm" variant="secondary" className="mt-4" onClick={onRetry} leadingIcon={<RotateCwIcon className="h-3.5 w-3.5" aria-hidden />}>
          Retry
        </Button>
      }
    </div>);

}