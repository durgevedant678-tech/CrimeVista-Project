/** Port of backend chat_service._build_fallback_response (rule-based guided answers). */
interface FallbackContext {
  page: string;
  filters: Record<string, string>;
  selectedArea: string | null;
  selectedIncident: string | null;
}

const KNOWLEDGE: Record<string, string> = {
  overview:
  'This view shows the current citywide picture: total incidents, trend direction, and where pressure is building. If cases are rising in a small area, focus on the hotspot and compare it against the wider baseline.',
  map: 'The map shows where incidents are happening. Use clustering to reduce noise, click a marker to inspect the record, and check whether the pattern is concentrated in one area or spread across the city.',
  hotspots:
  'Hotspots highlight the areas with the strongest concentration of incidents or repeated risk. These are the places to review first for patrol planning, surveillance, or deeper investigation.',
  areas:
  'Area Explorer compares one area to the citywide pattern. It helps answer whether a neighbourhood spike is unusual, part of a larger trend, or tied to a specific crime type or time window.',
  upload:
  'Upload lets you bring in a fresh city dataset. Once the file is validated, the app updates the active records and your dashboard, map, trends, and hotspots reflect the new data.',
  reports:
  'Reports turn the current view into a shareable summary. They are useful for briefing a team, documenting a risk period, or explaining what changed in a set of areas.',
  severity:
  'Severity tells you how serious an incident is. Critical and high-severity cases deserve faster attention, while low-severity events still matter if they cluster in one location over time.',
  filters:
  'Filters help you narrow the data to a date range, crime type, area, severity, or time period. That makes the dashboard and map more actionable instead of overwhelming.',
  faq: 'CrimeVista helps people understand what is happening in a city, where risk is clustering, and which areas deserve attention. It is built for practical insight, not just system explanation.'
};

const matches = (message: string, ...keywords: string[]) => {
  const normalised = message.toLowerCase().split(/\s+/).join(' ');
  return keywords.some((keyword) => normalised.includes(keyword));
};

export function buildFallbackAnswer(message: string, context: FallbackContext) {
  const cleaned = message.trim() || 'How do I use CrimeVista?';
  const { page, filters, selectedArea, selectedIncident } = context;
  let answer = KNOWLEDGE[page] ?? KNOWLEDGE.faq;

  if (matches(cleaned, 'dashboard', 'overview', 'kpi', 'executive')) {
    answer =
    'The overview shows whether the citywide picture is stable, growing, or concentrated in a few hotspots. It is the best place to start when you want a quick read on how risk is changing.';
  } else if (matches(cleaned, 'map', 'incident', 'location', 'geo', 'where')) answer = KNOWLEDGE.map;else
  if (matches(cleaned, 'hotspot', 'risk', 'danger', 'priority', 'unsafe', 'which area')) answer = KNOWLEDGE.hotspots;else
  if (matches(cleaned, 'area', 'comparison', 'neighbourhood', 'neighborhood')) answer = KNOWLEDGE.areas;else
  if (matches(cleaned, 'upload', 'dataset', 'csv', 'import', 'new city', 'new data')) answer = KNOWLEDGE.upload;else
  if (matches(cleaned, 'report', 'export', 'pdf', 'xlsx', 'brief')) answer = KNOWLEDGE.reports;else
  if (matches(cleaned, 'severity', 'critical', 'high', 'low', 'serious')) answer = KNOWLEDGE.severity;else
  if (matches(cleaned, 'filter', 'date', 'crime type', 'time period', 'narrow')) answer = KNOWLEDGE.filters;else
  if (matches(cleaned, 'how', 'use', 'start', 'help', 'guide', 'what should i do')) {
    answer =
    'Start with the overview to understand the citywide pattern, then move to hotspots or the map to find the specific areas that stand out. Use filters to narrow the view and focus on the most relevant pattern.';
  }

  if (selectedArea) answer += ` Right now, the active context is the area '${selectedArea}'.`;
  if (selectedIncident) answer += ' The selected incident gives you a more detailed view of that case and its surrounding pattern.';
  if (Object.keys(filters).length) answer += ' The current filters are narrowing the dataset so this insight is based on a more specific view.';

  const actions: Record<string, string[]> = {
    dashboard: ['Review KPI changes', 'Check the hotspot list', 'Open area comparison'],
    map: ['Inspect a cluster', 'Open the area detail', 'Compare nearby incidents'],
    hotspots: ['Review top-risk zones', 'Compare area trends', 'Check severity split'],
    upload: ['Load a fresh dataset', 'Validate columns', 'Review import status'],
    reports: ['Build a summary report', 'Select key sections', 'Share findings']
  };

  return {
    answer,
    provider: 'fallback',
    context: { page, selectedArea, selectedIncident: Boolean(selectedIncident), activeFilters: Boolean(Object.keys(filters).length) },
    suggestedActions: actions[page] ?? ['Check the overview', 'Review hotspots', 'Use filters to narrow scope']
  };
}