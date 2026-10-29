import type { Theme } from '../contexts/ThemeContext';

export interface ChartPalette {
  primary: string;
  teal: string;
  amber: string;
  orange: string;
  danger: string;
  emerald: string;
  grid: string;
  axis: string;
  fg: string;
  muted: string;
  surface: string;
  track: string;
  series: string[];
}

export const CHART_PALETTES: Record<Theme, ChartPalette> = {
  dark: {
    primary: '#54A6FF',
    teal: '#34D3BE',
    amber: '#F5AA32',
    orange: '#F28046',
    danger: '#EC565A',
    emerald: '#34D399',
    grid: '#1C2E47',
    axis: '#7C90AC',
    fg: '#E6EDF7',
    muted: '#98A8C0',
    surface: '#0E1B2E',
    track: '#16263D',
    series: ['#54A6FF', '#34D3BE', '#F5AA32', '#A5ADFF', '#8C9DB8']
  },
  light: {
    primary: '#1D5FD6',
    teal: '#0D8078',
    amber: '#AA6008',
    orange: '#C8541E',
    danger: '#BE262E',
    emerald: '#047857',
    grid: '#E4E9F0',
    axis: '#6B7A90',
    fg: '#0B1628',
    muted: '#47566C',
    surface: '#FFFFFF',
    track: '#EEF2F7',
    series: ['#1D5FD6', '#0D8078', '#C27410', '#5B5FD6', '#6B7A90']
  }
};

export function severityColor(palette: ChartPalette, severity: string): string {
  switch (severity) {
    case 'Critical':
      return palette.danger;
    case 'High':
      return palette.orange;
    case 'Medium':
      return palette.amber;
    default:
      return palette.axis;
  }
}

export function riskColor(palette: ChartPalette, risk: string): string {
  switch (risk) {
    case 'Very high':
      return palette.danger;
    case 'High':
      return palette.orange;
    case 'Elevated':
      return palette.amber;
    default:
      return palette.teal;
  }
}