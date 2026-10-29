import {
  ArrowRightIcon,
  ArrowUpRightIcon,
  BarChart3Icon,
  FileTextIcon,
  FlameIcon,
  Globe2Icon,
  Layers3Icon,
  MapPinnedIcon,
  ShieldCheckIcon,
  UsersRoundIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../components/layout/BrandMark';
import { InteractiveCrimeGlobe } from '../components/landing/InteractiveCrimeGlobe';

const CAPABILITIES = [
  { icon: Globe2Icon, title: 'Geospatial Context', detail: 'Explore locations and patterns' },
  { icon: Layers3Icon, title: 'Flexible Data', detail: 'Work with your selected dataset' },
  { icon: ShieldCheckIcon, title: 'Connected Analysis', detail: 'Bring incident categories together' },
  { icon: UsersRoundIcon, title: 'Clearer Decisions', detail: 'Turn complexity into perspective' },
];

const FEATURES = [
  {
    icon: MapPinnedIcon,
    title: 'Interactive Crime Map',
    description: 'Explore locations with heatmaps, clusters, and layered map views.',
    to: '/map',
    color: 'cyan',
    visual: 'map',
  },
  {
    icon: BarChart3Icon,
    title: 'Advanced Analytics',
    description: 'Understand trends and compare recorded incident patterns.',
    to: '/trends',
    color: 'purple',
    visual: 'bars',
  },
  {
    icon: FlameIcon,
    title: 'Hotspot Intelligence',
    description: 'Identify concentrations and explore area-level context.',
    to: '/hotspots',
    color: 'red',
    visual: 'target',
  },
  {
    icon: FileTextIcon,
    title: 'Focused Reports',
    description: 'Create clear briefings for analysis and planning.',
    to: '/reports',
    color: 'teal',
    visual: 'report',
  },
];

const GLOBE_CALLOUTS = [
  { icon: BarChart3Icon, title: 'Pattern Analysis', detail: 'Compare trends over time', position: 'callout-trend' },
  { icon: Globe2Icon, title: 'Regional Overview', detail: 'Explore geographic context', position: 'callout-region' },
  { icon: ShieldCheckIcon, title: 'Area Comparison', detail: 'Investigate local patterns', position: 'callout-area' },
  { icon: FlameIcon, title: 'Incident Mapping', detail: 'Visualize selected records', position: 'callout-map' },
];

function GlobeCallout({ icon: Icon, title, detail, position }: (typeof GLOBE_CALLOUTS)[number]) {
  return (
    <div className={`showcase-callout ${position}`}>
      <span className="showcase-callout-icon"><Icon aria-hidden="true" /></span>
      <span className="showcase-callout-copy">
        <strong>{title}</strong>
        <small>{detail}</small>
      </span>
      {position === 'callout-trend' && (
        <svg className="showcase-sparkline" viewBox="0 0 140 28" fill="none" aria-hidden="true">
          <path d="M2 22 17 17 29 20 42 9 55 15 67 13 82 19 96 8 111 14 124 4 138 8" />
        </svg>
      )}
    </div>
  );
}

function CardWave({ color }: { color: string }) {
  return (
    <svg className="showcase-card-wave" viewBox="0 0 400 72" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: 7 }, (_, index) => {
        const y = 51 - index * 4;
        return <path key={index} d={`M0 ${y} C 70 ${y - 24}, 130 ${y + 22}, 205 ${y - 5} S 330 ${y + 6}, 400 ${y - 14}`} stroke={color} strokeOpacity={0.12 + index * 0.045} />;
      })}
    </svg>
  );
}

function FeatureVisual({ type, color }: { type: string; color: string }) {
  if (type === 'bars') {
    return (
      <div className="showcase-visual showcase-bars" style={{ color }} aria-hidden="true">
        {[13, 20, 15, 27, 32, 23, 29].map((height, index) => <i key={index} style={{ height }} />)}
      </div>
    );
  }
  if (type === 'target') {
    return <div className="showcase-visual showcase-target" style={{ color }} aria-hidden="true"><i /><i /><i /></div>;
  }
  if (type === 'report') {
    return <div className="showcase-visual showcase-report" style={{ color }} aria-hidden="true"><i /><i /><i /><i /></div>;
  }
  return <div className="showcase-visual showcase-map" style={{ color }} aria-hidden="true"><i /><i /><i /></div>;
}

export function Landing() {
  return (
    <div className="showcase-page">
      <main>
        <section className="showcase-hero">
          <div className="showcase-background" aria-hidden="true">
            <div className="showcase-glow showcase-glow-blue" />
            <div className="showcase-glow showcase-glow-violet" />
            <div className="showcase-grid" />
            <svg className="showcase-wave-lines" viewBox="0 0 800 280" preserveAspectRatio="none">
              {Array.from({ length: 16 }, (_, index) => (
                <path key={index} d={`M0 ${130 + index * 7} C 170 ${40 + index * 6}, 350 ${250 - index * 4}, 800 ${105 + index * 8}`} />
              ))}
            </svg>
          </div>

          <div className="showcase-topline">
            <Link to="/" className="showcase-brand" aria-label="CrimeVista home">
              <BrandMark className="h-9 w-9" />
              <span><strong>CrimeVista</strong><small>URBAN CRIME INTELLIGENCE</small></span>
            </Link>
            <Link to="/dashboard" className="showcase-start-link">Open Workspace <ArrowUpRightIcon aria-hidden="true" /></Link>
          </div>

          <div className="showcase-globe-stage">
            <div className="showcase-globe-aura" aria-hidden="true" />
            <InteractiveCrimeGlobe />
            <div className="showcase-globe-edge" aria-hidden="true" />
          </div>

          <div className="showcase-hero-copy">
            <div className="showcase-eyebrow">
              <span className="showcase-live-dot" />
              <span>DATA</span><i /> <span>ANALYTICS</span><i /> <span>SAFER COMMUNITIES</span><i /> <span>GLOBAL PERSPECTIVE</span>
            </div>
            <h1>Turning Crime Data<br />Into a Safer, Smarter<br /><span>World.</span></h1>
            <p>
              Explore incident patterns through interactive maps and clear, data-driven analysis. Understand where activity concentrates, how it changes, and what deserves a closer look.
            </p>
            <div className="showcase-actions">
              <Link to="/map" className="showcase-primary-action">Explore Interactive Map <ArrowRightIcon aria-hidden="true" /></Link>
              <Link to="/dashboard" className="showcase-secondary-action"><span aria-hidden="true">▶</span> Explore Workspace</Link>
            </div>
            <div className="showcase-trust-note"><ShieldCheckIcon aria-hidden="true" /> Explore the selected dataset · Insights with geographic context</div>
          </div>

          <div className="showcase-callouts" aria-label="CrimeVista capabilities">
            {GLOBE_CALLOUTS.map((callout) => <GlobeCallout key={callout.position} {...callout} />)}
          </div>

          <div className="showcase-globe-label"><span /> INTERACTIVE 3D GLOBE <i /> ILLUSTRATIVE VIEW <i /> DRAG TO EXPLORE</div>
        </section>

        <section className="showcase-capabilities" aria-label="Platform capabilities">
          <div className="showcase-capabilities-inner">
            {CAPABILITIES.map(({ icon: Icon, title, detail }) => (
              <div className="showcase-capability" key={title}>
                <Icon aria-hidden="true" />
                <span><strong>{title}</strong><small>{detail}</small></span>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="showcase-features" aria-label="Explore CrimeVista">
          <div className="showcase-feature-grid">
            {FEATURES.map(({ icon: Icon, title, description, to, color, visual }) => (
              <Link to={to} key={title} className={`showcase-feature-card feature-${color}`}>
                <span className="showcase-feature-icon"><Icon aria-hidden="true" /></span>
                <span className="showcase-feature-copy"><strong>{title}</strong><small>{description}</small></span>
                <span className="showcase-feature-arrow"><ArrowUpRightIcon aria-hidden="true" /></span>
                <FeatureVisual type={visual} color={color === 'cyan' ? '#00d9ff' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ff5a5f' : '#21d4a5'} />
                <CardWave color={color === 'cyan' ? '#00d9ff' : color === 'purple' ? '#a855f7' : color === 'red' ? '#ff5a5f' : '#21d4a5'} />
              </Link>
            ))}
          </div>
        </section>
      </main>
      <footer className="showcase-footer">
        <span><BrandMark className="h-6 w-6" /> CrimeVista · Urban Crime Intelligence</span>
        <span>Map geometry © Natural Earth · Rendered with MapLibre</span>
        <Link to="/help">Help center <ArrowUpRightIcon aria-hidden="true" /></Link>
      </footer>
    </div>
  );
}
