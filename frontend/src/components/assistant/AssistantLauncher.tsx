import { AnimatePresence, motion } from 'framer-motion';
import { SparklesIcon } from 'lucide-react';
import { useAssistant } from '../../contexts/AssistantContext';

export function AssistantLauncher() {
  const { isOpen, open } = useAssistant();
  return (
    <AnimatePresence>
      {!isOpen &&
      <motion.button
        type="button"
        onClick={() => open()}
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        whileTap={{ scale: 0.97 }}
        className="cv-focus fixed bottom-[72px] right-4 z-[60] flex h-11 items-center gap-2 rounded-full border border-primary/30 bg-surface pl-3 pr-4 text-sm font-medium text-fg shadow-lift transition-colors duration-150 hover:border-primary/50 md:bottom-6 md:right-6"
        aria-label="Open CrimeVista AI assistant">

          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-on-primary">
            <SparklesIcon className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden sm:inline">CrimeVista AI</span>
        </motion.button>
      }
    </AnimatePresence>);

}