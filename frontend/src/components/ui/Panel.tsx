import React from 'react';
import { cn } from '../../utils/cn';
import { InfoTip } from './InfoTip';

interface PanelProps {
  title?: string;
  description?: string;
  info?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  as?: 'section' | 'div' | 'aside';
}

export function Panel({ title, description, info, actions, children, className, bodyClassName, as: Tag = 'section' }: PanelProps) {
  const headingId = title ? `panel-${title.replace(/\W+/g, '-').toLowerCase()}` : undefined;
  return (
    <Tag className={cn('cv-panel flex min-w-0 flex-col', className)} aria-labelledby={headingId}>
      {(title || actions) &&
      <header className="flex items-start justify-between gap-3 px-4 pb-1 pt-3.5 sm:px-5">
          <div className="min-w-0">
            {title &&
          <div className="flex items-center gap-1.5">
                <h2 id={headingId} className="cv-section-title truncate">
                  {title}
                </h2>
                {info && <InfoTip content={info} />}
              </div>
          }
            {description && <p className="cv-caption mt-0.5">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      }
      <div className={cn('min-w-0 flex-1 px-4 pb-4 pt-2 sm:px-5', bodyClassName)}>{children}</div>
    </Tag>);

}