export const ASSISTANT_PROMPTS: Record<string, string[]> = {
  dashboard: ['Explain this dashboard', 'How do I find high-risk areas?', 'What do the severity levels mean?'],
  map: ['How do I read the heatmap?', 'What does clustering show on the map?', 'How do I inspect an incident?'],
  hotspots: ['What is a hotspot?', 'Which areas should I review first?', 'How should I read risk levels?'],
  trends: ['How do I interpret this trend?', 'How do filters change the trend?', 'What does severity mean over time?'],
  areas: ['How do I compare this area to the city?', 'Is this area a hotspot?', 'What should I look at first for an area?'],
  reports: ['Which report should I generate for a briefing?', 'What goes into a report?', 'How do filters affect a report?'],
  upload: ['What columns does my dataset need?', 'What happens when I upload new data?', 'How is a dataset validated?'],
  default: ['How do I use CrimeVista?', 'How do I find high-risk areas?', 'How do filters work?']
};