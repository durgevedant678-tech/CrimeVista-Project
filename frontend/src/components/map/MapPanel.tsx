import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Floating intelligence panel over a map: side card on desktop, bottom sheet on mobile. */
export function MapPanel({ open, children, panelKey }: {open: boolean;children: React.ReactNode;panelKey: string;}) {
  return (
    <AnimatePresence mode="wait">
      {open &&
      <motion.div
        key={panelKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="absolute inset-x-2 bottom-2 z-30 max-h-[70%] overflow-y-auto rounded-2xl border border-line bg-surface shadow-pop sm:inset-x-auto sm:bottom-auto sm:right-[60px] sm:top-3 sm:w-[320px] sm:max-h-[calc(100%-24px)]">

          {children}
        </motion.div>
      }
    </AnimatePresence>);

}