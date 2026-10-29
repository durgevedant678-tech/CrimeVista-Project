import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpIcon, FilterIcon, MapPinIcon, RotateCwIcon, SparklesIcon, Trash2Icon, XIcon, LayoutIcon } from 'lucide-react';
import { Sheet } from '../ui/Sheet';
import { useAssistant } from '../../contexts/AssistantContext';
import { useFilters } from '../../contexts/FilterContext';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { chatApi } from '../../api/services';
import { toQueryParams } from '../../api/adapters';
import { friendlyError } from '../../api/errors';
import { findNavItem } from '../../data/navigation';
import { ASSISTANT_PROMPTS } from '../../data/assistantPrompts';
import { cn } from '../../utils/cn';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  provider?: string;
  actions?: string[];
}

export function AssistantDrawer() {
  const assistant = useAssistant();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const { filters, activeCount } = useFilters();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{text: string;description: string;} | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nav = findNavItem(pathname);
  const pageKey = nav?.item.assistantKey ?? 'general';
  const pageLabel = nav?.item.label ?? 'CrimeVista';
  const selectedArea = assistant.selectedArea ?? params.get('area');
  const prompts = ASSISTANT_PROMPTS[pageKey] ?? ASSISTANT_PROMPTS.default;

  const send = useCallback(
    async (text: string) => {
      const message = text.trim();
      if (!message || pending) return;
      setError(null);
      setDraft('');
      setMessages((list) => [...list, { id: uid(), role: 'user', text: message }]);
      setPending(true);
      try {
        const response = await chatApi.ask({
          message,
          page: pageKey,
          filters: toQueryParams(filters),
          selectedArea,
          selectedIncident: assistant.selectedIncident
        });
        setMessages((list) => [
        ...list,
        { id: uid(), role: 'assistant', text: response.answer, provider: response.provider, actions: response.suggestedActions }]
        );
      } catch (err) {
        const friendly = friendlyError(err);
        setError({ text: message, description: friendly.status === 0 ? 'Check your connection and try again.' : friendly.description });
      } finally {
        setPending(false);
      }
    },
    [pending, pageKey, filters, selectedArea, assistant.selectedIncident]
  );

  useEffect(() => {
    if (assistant.isOpen && assistant.pendingPrompt) {
      const prompt = assistant.consumePrompt();
      if (prompt) void send(prompt);
    }
  }, [assistant.isOpen, assistant.pendingPrompt, assistant, send]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending, error]);

  const lastAssistant = [...messages].reverse().find((message) => message.role === 'assistant');

  return (
    <Sheet
      open={assistant.isOpen}
      onClose={assistant.close}
      title="CrimeVista AI"
      side={isDesktop ? 'right' : 'bottom'}
      hideHeader
      className={isDesktop ? 'max-w-[420px]' : 'h-[88vh]'}>

      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary">
            <SparklesIcon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-fg">CrimeVista AI</h2>
            <p className="cv-caption">Answers use your current page, filters and selection</p>
          </div>
          {messages.length > 0 &&
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            aria-label="Clear conversation"
            className="cv-focus rounded-md p-1.5 text-subtle transition-colors duration-150 hover:bg-raised hover:text-fg">

              <Trash2Icon className="h-4 w-4" aria-hidden />
            </button>
          }
          <button
            type="button"
            onClick={assistant.close}
            aria-label="Close assistant"
            className="cv-focus rounded-md p-1.5 text-subtle transition-colors duration-150 hover:bg-raised hover:text-fg">

            <XIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 border-b border-line bg-raised/60 px-5 py-2.5" aria-label="Assistant context">
          <ContextChip icon={<LayoutIcon className="h-3 w-3" />} label={pageLabel} />
          <ContextChip icon={<FilterIcon className="h-3 w-3" />} label={activeCount ? `${activeCount} filter${activeCount > 1 ? 's' : ''} active` : 'No filters'} />
          {selectedArea && <ContextChip icon={<MapPinIcon className="h-3 w-3" />} label={selectedArea} highlight />}
          {assistant.selectedIncident && <ContextChip label={`Incident ${assistant.selectedIncident}`} highlight />}
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.length === 0 &&
          <div>
              <p className="text-sm text-muted">
                Ask how to read what you’re looking at on <span className="font-medium text-fg">{pageLabel}</span>, or how to investigate a pattern.
              </p>
              <p className="cv-label mt-5">Suggested</p>
              <div className="mt-2 flex flex-col gap-1.5">
                {prompts.map((prompt) =>
              <button
                key={prompt}
                type="button"
                onClick={() => send(prompt)}
                className="cv-focus rounded-lg border border-line bg-surface px-3 py-2.5 text-left text-sm text-fg transition-colors duration-150 hover:border-primary/40 hover:bg-primary/5">

                    {prompt}
                  </button>
              )}
              </div>
            </div>
          }

          {messages.map((message) =>
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>

              {message.role === 'user' ?
            <p className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-sm text-on-primary">{message.text}</p> :

            <div className="max-w-[92%]">
                  <p className="text-sm leading-relaxed text-fg">{message.text}</p>
                  <p className="cv-meta mt-1.5">
                    {message.provider === 'openai' ? 'AI model response' : 'Guided response · AI model not configured on server'}
                  </p>
                </div>
            }
            </motion.div>
          )}

          <AnimatePresence>
            {pending &&
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 py-1" aria-label="CrimeVista AI is typing">
                {[0, 1, 2].map((dot) =>
              <motion.span
                key={dot}
                className="h-1.5 w-1.5 rounded-full bg-subtle"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }} />

              )}
              </motion.div>
            }
          </AnimatePresence>

          {error &&
          <div role="alert" className="rounded-lg border border-amber/25 bg-amber/10 px-3.5 py-3">
              <p className="text-sm font-medium text-fg">The assistant couldn’t respond</p>
              <p className="cv-caption mt-0.5">{error.description}</p>
              <button
              type="button"
              onClick={() => {
                setMessages((list) => list.slice(0, -1));
                void send(error.text);
              }}
              className="cv-focus mt-2 inline-flex items-center gap-1.5 rounded-md text-xs font-medium text-primary">

                <RotateCwIcon className="h-3.5 w-3.5" aria-hidden /> Retry
              </button>
            </div>
          }

          {!pending && lastAssistant?.actions && lastAssistant.actions.length > 0 && messages[messages.length - 1] === lastAssistant &&
          <div className="flex flex-wrap gap-1.5">
              {lastAssistant.actions.map((action) =>
            <button
              key={action}
              type="button"
              onClick={() => send(action)}
              className="cv-focus rounded-full border border-line px-2.5 py-1 text-xs text-muted transition-colors duration-150 hover:border-primary/40 hover:text-fg">

                  {action}
                </button>
            )}
            </div>
          }
        </div>

        <form
          className="border-t border-line p-3"
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}>

          <div className="flex items-end gap-2 rounded-xl border border-line bg-raised px-3 py-2 transition-[border-color] duration-150 focus-within:border-primary/50">
            <label htmlFor="assistant-input" className="sr-only">
              Message CrimeVista AI
            </label>
            <textarea
              id="assistant-input"
              data-autofocus
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              placeholder="Ask about this view…"
              className="max-h-32 min-h-[24px] flex-1 resize-none bg-transparent py-1 text-sm text-fg placeholder:text-subtle focus:outline-none" />

            <button
              type="submit"
              disabled={!draft.trim() || pending}
              aria-label="Send message"
              className="cv-focus flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary transition-opacity duration-150 disabled:opacity-40">

              <ArrowUpIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </form>
      </div>
    </Sheet>);

}

function ContextChip({ icon, label, highlight }: {icon?: React.ReactNode;label: string;highlight?: boolean;}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-medium',
        highlight ? 'border-primary/25 bg-primary/10 text-primary' : 'border-line bg-surface text-muted'
      )}>

      {icon}
      {label}
    </span>);

}