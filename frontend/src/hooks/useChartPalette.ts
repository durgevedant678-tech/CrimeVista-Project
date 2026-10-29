import { useTheme } from '../contexts/ThemeContext';
import { CHART_PALETTES, type ChartPalette } from '../utils/chartTheme';

export function useChartPalette(): ChartPalette {
  const { theme } = useTheme();
  return CHART_PALETTES[theme];
}