import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { CrimeFilters, MultiFilterKey } from '../types/crime';

export const EMPTY_FILTERS: CrimeFilters = {
  startDate: null,
  endDate: null,
  crimeType: [],
  area: [],
  severity: [],
  timePeriod: [],
  status: []
};

interface FilterContextValue {
  filters: CrimeFilters;
  setValues: (key: MultiFilterKey, values: string[]) => void;
  toggleValue: (key: MultiFilterKey, value: string) => void;
  setDateRange: (start: string | null, end: string | null) => void;
  applyFilters: (patch: Partial<CrimeFilters>) => void;
  resetFilters: () => void;
  activeCount: number;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: {children: React.ReactNode;}) {
  const [filters, setFilters] = useState<CrimeFilters>(EMPTY_FILTERS);

  const setValues = useCallback((key: MultiFilterKey, values: string[]) => {
    setFilters((current) => ({ ...current, [key]: values }));
  }, []);

  const toggleValue = useCallback((key: MultiFilterKey, value: string) => {
    setFilters((current) => {
      const list = current[key];
      return { ...current, [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
    });
  }, []);

  const setDateRange = useCallback((start: string | null, end: string | null) => {
    setFilters((current) => ({ ...current, startDate: start, endDate: end }));
  }, []);

  const applyFilters = useCallback((patch: Partial<CrimeFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  }, []);

  const resetFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const activeCount = useMemo(
    () =>
    (filters.startDate || filters.endDate ? 1 : 0) +
    filters.crimeType.length +
    filters.area.length +
    filters.severity.length +
    filters.timePeriod.length +
    filters.status.length,
    [filters]
  );

  const value = useMemo(
    () => ({ filters, setValues, toggleValue, setDateRange, applyFilters, resetFilters, activeCount }),
    [filters, setValues, toggleValue, setDateRange, applyFilters, resetFilters, activeCount]
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilters must be used inside FilterProvider');
  return context;
}