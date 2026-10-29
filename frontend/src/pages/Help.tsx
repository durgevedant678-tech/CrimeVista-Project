import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRightIcon, ChevronDownIcon, CompassIcon, SearchIcon, SparklesIcon } from 'lucide-react';
import { HELP_TOPICS, type HelpTopic } from '../data/helpTopics';
import { HelpVisualPanel } from '../components/help/HelpVisualPanel';
import { Button } from '../components/ui/Button';
import { useAssistant } from '../contexts/AssistantContext';
import { startTour } from '../utils/tour';
import { cn } from '../utils/cn';

const CATEGORIES: HelpTopic['category'][] = ['Getting started', 'Analysis', 'Intelligence', 'Definitions'];

export function Help() {
  const assistant = useAssistant();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>('what-is');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return HELP_TOPICS;
    return HELP_TOPICS.filter((topic) => [topic.title, topic.summary, ...topic.body].join(' ').toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="pb-12">
      <section className="border-b border-line bg-surface/60">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Help Center</h1>
          <p className="mt-1.5 text-sm text-muted">See the pattern. Understand the risk. Everything you need to read CrimeVista with confidence.</p>
          <div className="mt-5 flex h-11 items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 shadow-panel focus-within:border-primary/50">
            <SearchIcon className="h-4 w-4 text-subtle" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search help — e.g. risk level, heatmap, upload columns"
              aria-label="Search help"
              className="h-full flex-1 bg-transparent text-sm text-fg placeholder:text-subtle focus:outline-none" />

          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="primary" onClick={startTour} leadingIcon={<CompassIcon className="h-3.5 w-3.5" />}>
              Take the 60-second tour
            </Button>
            <Button size="sm" onClick={() => assistant.open('How do I use CrimeVista?')} leadingIcon={<SparklesIcon className="h-3.5 w-3.5" />}>
              Ask CrimeVista AI
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-8 px-4 pt-8 sm:px-6">
        {results.length === 0 &&
        <div className="py-10 text-center">
            <p className="text-sm font-medium text-fg">No help articles match “{query}”</p>
            <button type="button" onClick={() => assistant.open(query)} className="cv-focus mt-2 rounded text-sm font-medium text-primary">
              Ask CrimeVista AI instead →
            </button>
          </div>
        }
        {CATEGORIES.map((category) => {
          const topics = results.filter((topic) => topic.category === category);
          if (!topics.length) return null;
          return (
            <section key={category} aria-labelledby={`help-${category}`}>
              <h2 id={`help-${category}`} className="cv-label mb-2 px-1">
                {category}
              </h2>
              <div className="cv-panel divide-y divide-line overflow-hidden">
                {topics.map((topic) => {
                  const expanded = open === topic.id || Boolean(query.trim());
                  return (
                    <div key={topic.id} id={topic.id}>
                      <button
                        type="button"
                        onClick={() => setOpen(open === topic.id ? null : topic.id)}
                        aria-expanded={expanded}
                        aria-controls={`${topic.id}-panel`}
                        className="cv-focus flex w-full items-center gap-4 px-5 py-4 text-left transition-colors duration-150 hover:bg-raised/50">

                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-fg">{topic.title}</span>
                          <span className="cv-caption mt-0.5 block">{topic.summary}</span>
                        </span>
                        <ChevronDownIcon className={cn('h-4 w-4 shrink-0 text-subtle transition-transform duration-200', expanded && 'rotate-180')} aria-hidden />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded &&
                        <motion.div
                          id={`${topic.id}-panel`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
                          className="overflow-hidden">

                            <div className="space-y-4 px-5 pb-5">
                              {topic.body.map((paragraph) =>
                            <p key={paragraph} className="max-w-2xl text-sm leading-relaxed text-muted">
                                  {paragraph}
                                </p>
                            )}
                              {topic.visual &&
                            <div className="rounded-xl border border-line bg-raised/50 p-4">
                                  <HelpVisualPanel visual={topic.visual} />
                                </div>
                            }
                              {topic.route &&
                            <Link to={topic.route.to} className="cv-focus inline-flex items-center gap-1 rounded text-sm font-medium text-primary">
                                  {topic.route.label} <ArrowRightIcon className="h-3.5 w-3.5" aria-hidden />
                                </Link>
                            }
                            </div>
                          </motion.div>
                        }
                      </AnimatePresence>
                    </div>);

                })}
              </div>
            </section>);

        })}
      </div>
    </div>);

}