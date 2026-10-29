import React from 'react';
import { ClockIcon, MapPinIcon, ShieldAlertIcon, TagIcon, TrendingDownIcon, TrendingUpIcon, ActivityIcon } from 'lucide-react';
import type { Insight } from '../../types/crime';

const ICONS: Record<string, React.ElementType> = {
  increase: TrendingUpIcon,
  decrease: TrendingDownIcon,
  location: MapPinIcon,
  category: TagIcon,
  time: ClockIcon,
  severity: ShieldAlertIcon
};

export function InsightList({ insights }: {insights: Insight[];}) {
  return (
    <ul className="space-y-3">
      {insights.map((insight) => {
        const Icon = ICONS[insight.category] ?? ActivityIcon;
        return (
          <li key={insight.text} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-raised text-muted">
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            <p className="text-sm leading-relaxed text-fg">{insight.text}</p>
          </li>);

      })}
    </ul>);

}