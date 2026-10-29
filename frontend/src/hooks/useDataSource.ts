import { useSyncExternalStore } from 'react';
import { getDataSource, subscribeDataSource } from '../api/client';
import type { DataSource } from '../types/operations';

export function useDataSource(): DataSource {
  return useSyncExternalStore(subscribeDataSource, getDataSource, getDataSource);
}