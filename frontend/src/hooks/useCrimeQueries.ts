import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { analyticsApi, authApi, crimeApi, dashboardApi, mapApi, reportsApi } from '../api/services';
import { useFilters } from '../contexts/FilterContext';
import type { CrimeFilters } from '../types/crime';

export function useFilterOptions() {
  return useQuery({ queryKey: ['filter-options'], queryFn: dashboardApi.getFilterOptions, staleTime: 5 * 60_000 });
}

export function useDashboard(override?: CrimeFilters) {
  const { filters } = useFilters();
  const active = override ?? filters;
  return useQuery({
    queryKey: ['dashboard', active],
    queryFn: () => dashboardApi.getOverview(active),
    placeholderData: keepPreviousData
  });
}

export function useTrends() {
  const { filters } = useFilters();
  return useQuery({ queryKey: ['trends', filters], queryFn: () => analyticsApi.getTrends(filters), placeholderData: keepPreviousData });
}

export function useHotspots(override?: CrimeFilters) {
  const { filters } = useFilters();
  const active = override ?? filters;
  return useQuery({
    queryKey: ['hotspots', active],
    queryFn: () => analyticsApi.getHotspots(active),
    placeholderData: keepPreviousData
  });
}

export function useAreaProfile(area: string | null) {
  const { filters } = useFilters();
  return useQuery({
    queryKey: ['area-profile', area, filters],
    queryFn: () => analyticsApi.getAreaProfile(area as string, filters),
    enabled: Boolean(area),
    placeholderData: keepPreviousData,
    retry: (count, error) => (error as {status?: number;}).status !== 404 && count < 2
  });
}

export function useCrimeMap() {
  const { filters } = useFilters();
  return useQuery({ queryKey: ['crime-map', filters], queryFn: () => mapApi.getCrimeMap(filters), placeholderData: keepPreviousData });
}

export function useCrimeRecords(page: number, pageSize: number, enabled = true) {
  const { filters } = useFilters();
  return useQuery({
    queryKey: ['crimes', filters, page, pageSize],
    queryFn: () => crimeApi.getRecords(filters, page, pageSize),
    enabled,
    placeholderData: keepPreviousData
  });
}

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: dashboardApi.getHealth, staleTime: 60_000 });
}

export function useAuthSession() {
  return useQuery({ queryKey: ['auth-session'], queryFn: authApi.getSession, staleTime: 60_000, retry: false });
}

export function useReportHistory() {
  return useQuery({ queryKey: ['reports'], queryFn: reportsApi.list, retry: false });
}