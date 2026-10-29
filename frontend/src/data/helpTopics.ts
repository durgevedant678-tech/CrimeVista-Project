export type HelpVisual = 'severity' | 'risk' | 'layers' | 'flow' | 'upload' | null;

export interface HelpTopic {
  id: string;
  category: 'Getting started' | 'Analysis' | 'Intelligence' | 'Definitions';
  title: string;
  summary: string;
  body: string[];
  route?: {to: string;label: string;};
  visual: HelpVisual;
}

export const HELP_TOPICS: HelpTopic[] = [
{
  id: 'what-is',
  category: 'Getting started',
  title: 'What is CrimeVista?',
  summary: 'An analytics workspace that turns incident records into geographic intelligence.',
  body: [
  'CrimeVista reads a table of recorded incidents — date, area, crime type, severity, and location — and shows how much is happening, where it concentrates, and how it changes over time.',
  'Every number on screen is calculated from the active dataset. Interpret results within that dataset’s geographic coverage, date range and update cadence; CrimeVista does not turn them into crime forecasts.'],

  route: { to: '/dashboard', label: 'Open the dashboard' },
  visual: 'flow'
},
{
  id: 'data-source',
  category: 'Getting started',
  title: 'Where does the data come from?',
  summary: 'The configured fallback dataset or a dataset uploaded by an administrator.',
  body: [
  'If the API is unavailable, the browser loads the fallback CSV configured for this project. The current example contains roughly 16,000 Nagpur records dated January 2022 – June 2025. It is provided to explore CrimeVista and is not a live feed or an official police record.',
  'Administrators can replace the active dataset with an authorized CSV from Upload Data. All pages then reflect the new records. Use data that is appropriate for the city or region you want to analyze.'],

  visual: null
},
{
  id: 'filters',
  category: 'Getting started',
  title: 'How do filters work?',
  summary: 'One shared set of filters drives every page, report preview and the assistant.',
  body: [
  'Use the filter bar to narrow by date range, crime type, area, severity, time of day and status. Filters persist as you move between pages.',
  'Many charts are clickable: clicking a crime type, severity level or time period adds it as a filter. Clicking a month on a trend chart focuses everything on that month.'],

  visual: null
},
{
  id: 'dashboard',
  category: 'Analysis',
  title: 'Reading the Dashboard',
  summary: 'Headline volume, the map, ranked hotspots, then supporting detail.',
  body: [
  'The large figure is the number of incidents matching your filters, with a monthly sparkline. Beside it: high-severity count, month-over-month change, most affected area and most common crime type. Each one is clickable.',
  'Below, the map and hotspot list answer “where”. Further down, the trend, severity, crime type and time-of-day panels explain “what” and “when”, followed by the latest incident records.'],

  route: { to: '/dashboard', label: 'Go to Dashboard' },
  visual: null
},
{
  id: 'map',
  category: 'Analysis',
  title: 'Using the Crime Map',
  summary: 'Heatmap, clusters, individual incidents, hotspot extents, and 3D.',
  body: [
  'Open the Layers menu to combine views. The heatmap weights each incident by severity (Critical counts more than Low). Clusters group nearby incidents and expand when clicked. Incidents shows every plotted record coloured by severity.',
  'Switch to 3D to see hotspot intensity as columns. Search for an area or incident ID to fly there. The map endpoint returns up to 3,000 located incidents; narrow filters to inspect a specific set.'],

  route: { to: '/map', label: 'Open Crime Map' },
  visual: 'layers'
},
{
  id: 'hotspots',
  category: 'Analysis',
  title: 'Understanding Hotspots',
  summary: 'Areas ranked by incident count, with a relative risk level.',
  body: [
  'The top 15 areas by incident count are ranked under your current filters. Selecting one flies the map to it and opens its intelligence panel: share of incidents, high-severity count, dominant crime type and its position relative to the busiest area.',
  'The dashed outline around a hotspot is the observed extent of its plotted incidents — derived from the data, not an administrative boundary.'],

  route: { to: '/hotspots', label: 'Open Hotspots' },
  visual: 'risk'
},
{
  id: 'trends',
  category: 'Analysis',
  title: 'Interpreting Trends',
  summary: 'Change over time, category comparison, seasonality and time of day.',
  body: [
  'The comparison strip contrasts the latest 90 days with the 90 days before. The activity chart shows monthly totals with an average line. Category comparison breaks the top series down by crime type, severity or area.',
  'Seasonality averages each calendar month across the years in the data. Key observations are computed directly from these series.'],

  route: { to: '/trends', label: 'Open Trends' },
  visual: null
},
{
  id: 'areas',
  category: 'Analysis',
  title: 'Exploring an area',
  summary: 'Profile a single area and compare it with other areas in the dataset.',
  body: [
  'Pick an area to see its incident volume, share of records, high-severity incidents, top crime type, month-over-month change, monthly trend and time-of-day pattern.',
  '“Compared with other areas” places it among the top areas under your filters. “Focus all views” applies the area as a filter everywhere.'],

  route: { to: '/areas', label: 'Open Area Explorer' },
  visual: null
},
{
  id: 'reports',
  category: 'Intelligence',
  title: 'Generating reports',
  summary: 'Choose a report type, set scope, preview, then generate.',
  body: [
  'Reports start from your current filters. The document preview updates live with the same figures the generated file will contain.',
  'PDF gives a formatted briefing (records capped at 300). Excel puts each section on its own sheet with every record. CSV contains the matching records only. Generating and downloading reports requires administrator sign-in on the server.'],

  route: { to: '/reports', label: 'Open Reports' },
  visual: null
},
{
  id: 'upload',
  category: 'Intelligence',
  title: 'Uploading a dataset',
  summary: 'Validate and preview a CSV, then replace the active dataset.',
  body: [
  'Required columns: crime_id, date, area, crime_type, severity. Recommended: time, latitude, longitude, status, police_station, description. Maximum 25 MB.',
  'The wizard checks your file in the browser and shows a preview before anything is sent. Importing replaces every record; rows with unreadable dates or missing required values are rejected and reported.'],

  route: { to: '/upload', label: 'Open Upload' },
  visual: 'upload'
},
{
  id: 'ai',
  category: 'Intelligence',
  title: 'Using CrimeVista AI',
  summary: 'A context-aware assistant for interpreting what you see.',
  body: [
  'Open it from the button at the bottom right, the header, or the sidebar. It receives the page you are on, your active filters and any selected area or incident.',
  'When the server has an AI model configured, answers come from it. Otherwise the server returns guided answers from CrimeVista’s built-in knowledge, labelled as such under each reply.'],

  visual: null
},
{
  id: 'severity',
  category: 'Definitions',
  title: 'Severity levels',
  summary: 'How serious an individual incident is, as recorded in the data.',
  body: [
  'Each record carries one of four levels: Critical, High, Medium or Low. “High-severity” throughout CrimeVista means High or Critical combined.',
  'Severity is only shown in red for Critical. Analytical views use neutral colours so that serious cases stand out.'],

  visual: 'severity'
},
{
  id: 'risk',
  category: 'Definitions',
  title: 'Risk levels',
  summary: 'A relative ranking of areas — not a probability or forecast.',
  body: [
  'An area’s risk level compares its incident count with the busiest area under the same filters: Very high at 75% or more, High at 50%, Elevated at 30%, otherwise Moderate.',
  'Because it is relative, changing filters can change an area’s level. Area size is not in the dataset, so density per km² is not calculated.'],

  visual: 'risk'
}];