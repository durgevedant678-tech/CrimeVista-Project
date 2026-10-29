import { CheckIcon } from 'lucide-react';
import type { WizardStep } from '../../hooks/useUpload';
import { cn } from '../../utils/cn';

const STEPS: Array<{id: WizardStep;label: string;}> = [
{ id: 'select', label: 'Choose file' },
{ id: 'validate', label: 'Validate' },
{ id: 'preview', label: 'Preview' },
{ id: 'import', label: 'Import' },
{ id: 'complete', label: 'Complete' }];


export function UploadStepper({ step, failed }: {step: WizardStep;failed?: boolean;}) {
  const index = STEPS.findIndex((item) => item.id === step);
  return (
    <ol className="flex items-center gap-2" aria-label="Upload progress">
      {STEPS.map((item, i) => {
        const done = i < index || step === 'complete' && !failed;
        const current = i === index;
        return (
          <li key={item.id} className="flex min-w-0 flex-1 items-center gap-2" aria-current={current ? 'step' : undefined}>
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-2xs font-semibold transition-colors duration-200',
                done && 'border-primary bg-primary text-on-primary',
                current && !done && (failed ? 'border-danger bg-danger/10 text-danger' : 'border-primary text-primary'),
                !done && !current && 'border-line-strong text-subtle'
              )}>

              {done ? <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span className={cn('hidden truncate text-xs font-medium sm:block', current ? 'text-fg' : 'text-subtle')}>{item.label}</span>
            {i < STEPS.length - 1 && <span className={cn('h-px min-w-3 flex-1', i < index ? 'bg-primary' : 'bg-line')} aria-hidden />}
          </li>);

      })}
    </ol>);

}