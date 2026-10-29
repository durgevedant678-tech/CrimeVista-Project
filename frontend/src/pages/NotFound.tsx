import { Link } from 'react-router-dom';
import { CompassIcon } from 'lucide-react';

export function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-20 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-subtle">
        <CompassIcon className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-fg">This page doesn’t exist</h1>
      <p className="cv-caption mt-1">The link may be outdated. Head back to the overview.</p>
      <Link to="/dashboard" className="cv-focus mt-5 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-on-primary">
        Go to Dashboard
      </Link>
    </div>);

}