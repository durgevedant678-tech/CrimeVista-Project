import {
  BookOpenIcon,
  FileTextIcon,
  FlameIcon,
  LayoutDashboardIcon,
  LineChartIcon,
  MapIcon,
  MapPinnedIcon,
  SettingsIcon,
  UploadCloudIcon,
  type LucideIcon } from
'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  description: string;
  assistantKey: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
{
  title: 'Overview',
  items: [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon, description: 'Citywide intelligence overview', assistantKey: 'dashboard' }]

},
{
  title: 'Analysis',
  items: [
  { to: '/map', label: 'Crime Map', icon: MapIcon, description: 'Geospatial incident workspace', assistantKey: 'map' },
  { to: '/hotspots', label: 'Hotspots', icon: FlameIcon, description: 'Ranked concentration areas', assistantKey: 'hotspots' },
  { to: '/trends', label: 'Trends', icon: LineChartIcon, description: 'Change over time', assistantKey: 'trends' },
  { to: '/areas', label: 'Areas', icon: MapPinnedIcon, description: 'Investigate a single area', assistantKey: 'areas' }]

},
{
  title: 'Intelligence',
  items: [{ to: '/reports', label: 'Reports', icon: FileTextIcon, description: 'Generate briefing documents', assistantKey: 'reports' }]
},
{
  title: 'System',
  items: [
  { to: '/upload', label: 'Upload Data', icon: UploadCloudIcon, description: 'Replace the active dataset', assistantKey: 'upload' },
  { to: '/help', label: 'Help', icon: BookOpenIcon, description: 'Guides and definitions', assistantKey: 'help' },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, description: 'Appearance, connection, access', assistantKey: 'settings' }]

}];


export const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((section) => section.items);

export const MOBILE_PRIMARY = ['/dashboard', '/map', '/hotspots', '/trends'];

export function findNavItem(pathname: string): {item: NavItem;section: string;} | null {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((entry) => pathname.startsWith(entry.to));
    if (item) return { item, section: section.title };
  }
  return null;
}