export type Tone = 'neutral' | 'primary' | 'teal' | 'amber' | 'orange' | 'danger' | 'emerald';

export function riskTone(risk: string | null | undefined): Tone {
  switch (risk) {
    case 'Very high':
      return 'danger';
    case 'High':
      return 'orange';
    case 'Elevated':
      return 'amber';
    case 'Moderate':
      return 'teal';
    default:
      return 'neutral';
  }
}

export function severityTone(severity: string | null | undefined): Tone {
  switch (severity) {
    case 'Critical':
      return 'danger';
    case 'High':
      return 'orange';
    case 'Medium':
      return 'amber';
    default:
      return 'neutral';
  }
}

export const TONE_TEXT: Record<Tone, string> = {
  neutral: 'text-muted',
  primary: 'text-primary',
  teal: 'text-teal',
  amber: 'text-amber',
  orange: 'text-orange',
  danger: 'text-danger',
  emerald: 'text-emerald'
};

export const TONE_DOT: Record<Tone, string> = {
  neutral: 'bg-subtle',
  primary: 'bg-primary',
  teal: 'bg-teal',
  amber: 'bg-amber',
  orange: 'bg-orange',
  danger: 'bg-danger',
  emerald: 'bg-emerald'
};