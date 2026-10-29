import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface AssistantContextValue {
  isOpen: boolean;
  open: (prompt?: string) => void;
  close: () => void;
  pendingPrompt: string | null;
  consumePrompt: () => string | null;
  selectedArea: string | null;
  setSelectedArea: (area: string | null) => void;
  selectedIncident: string | null;
  setSelectedIncident: (id: string | null) => void;
}

const AssistantContext = createContext<AssistantContextValue | null>(null);

export function AssistantProvider({ children }: {children: React.ReactNode;}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  const open = useCallback((prompt?: string) => {
    if (prompt) setPendingPrompt(prompt);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);
  const consumePrompt = useCallback(() => {
    const prompt = pendingPrompt;
    setPendingPrompt(null);
    return prompt;
  }, [pendingPrompt]);

  const value = useMemo(
    () => ({ isOpen, open, close, pendingPrompt, consumePrompt, selectedArea, setSelectedArea, selectedIncident, setSelectedIncident }),
    [isOpen, open, close, pendingPrompt, consumePrompt, selectedArea, selectedIncident]
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantContextValue {
  const context = useContext(AssistantContext);
  if (!context) throw new Error('useAssistant must be used inside AssistantProvider');
  return context;
}