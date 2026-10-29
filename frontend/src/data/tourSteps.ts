import { FlameIcon, LayoutDashboardIcon, MapIcon, SlidersHorizontalIcon, SparklesIcon, type LucideIcon } from 'lucide-react';

export interface TourStep {
  title: string;
  body: string;
  tip?: string;
  route?: string;
  icon: LucideIcon;
}

export const TOUR_STEPS: TourStep[] = [
{
  title: 'CrimeVista turns incident records into geographic intelligence',
  body: 'Counts, trends, hotspots and area profiles are calculated from the active dataset. Interpret results within that dataset’s geographic coverage, date range and update cadence.',
  route: '/dashboard',
  icon: LayoutDashboardIcon
},
{
  title: 'Start with the Dashboard',
  body: 'The headline number, the map, and the ranked hotspots answer “how much, where, and what changed”. Click any KPI, bar or hotspot to drill in.',
  tip: 'Clicking a crime type or severity on a chart applies it as a filter everywhere.',
  route: '/dashboard',
  icon: LayoutDashboardIcon
},
{
  title: 'Investigate on the Crime Map',
  body: 'Switch between heatmap, clusters and individual incidents. Flip to 3D to see hotspot intensity as columns over the city.',
  route: '/map',
  icon: MapIcon
},
{
  title: 'Prioritise with Hotspots',
  body: 'Areas are ranked by incident count. Risk level is relative to the busiest area: Very high ≥ 75%, High ≥ 50%, Elevated ≥ 30%.',
  route: '/hotspots',
  icon: FlameIcon
},
{
  title: 'Filters follow you everywhere',
  body: 'Date range, crime type, area, severity and time of day are shared across every page, the AI assistant and report previews.',
  tip: 'Press ⌘K / Ctrl K to jump to any page or area.',
  icon: SlidersHorizontalIcon
},
{
  title: 'Ask CrimeVista AI',
  body: 'The assistant knows which page you are on, your active filters and the area you selected. Use it to interpret a view or plan next steps.',
  icon: SparklesIcon
}];