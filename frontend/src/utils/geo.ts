import type { Hotspot, MapIncident } from '../types/crime';

type Point = [number, number];

const SEVERITY_WEIGHT: Record<string, number> = { Critical: 1, High: 0.75, Medium: 0.45, Low: 0.25 };

export function incidentsToGeoJSON(incidents: MapIncident[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: incidents.map((incident) => ({
      type: 'Feature',
      id: incident.id,
      geometry: { type: 'Point', coordinates: [incident.longitude, incident.latitude] },
      properties: {
        id: incident.id,
        crimeType: incident.crimeType,
        severity: incident.severity,
        area: incident.area,
        date: incident.date,
        weight: SEVERITY_WEIGHT[incident.severity] ?? 0.3
      }
    }))
  };
}

export function hotspotsToGeoJSON(hotspots: Hotspot[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: hotspots.
    filter((hotspot) => hotspot.latitude !== null && hotspot.longitude !== null).
    map((hotspot) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [hotspot.longitude as number, hotspot.latitude as number] },
      properties: {
        area: hotspot.area,
        rank: hotspot.rank,
        count: hotspot.incidentCount,
        risk: hotspot.riskLevel,
        label: `${hotspot.rank}. ${hotspot.area}`
      }
    }))
  };
}

/** Square footprints used as 3D columns; height encodes incident count. */
export function hotspotColumns(hotspots: Hotspot[]): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const max = Math.max(1, ...hotspots.map((hotspot) => hotspot.incidentCount));
  return {
    type: 'FeatureCollection',
    features: hotspots.
    filter((hotspot) => hotspot.latitude !== null && hotspot.longitude !== null).
    map((hotspot) => {
      const lng = hotspot.longitude as number;
      const lat = hotspot.latitude as number;
      const half = 0.0032;
      return {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[[lng - half, lat - half], [lng + half, lat - half], [lng + half, lat + half], [lng - half, lat + half], [lng - half, lat - half]]]
        },
        properties: { area: hotspot.area, risk: hotspot.riskLevel, height: 300 + hotspot.incidentCount / max * 2600 }
      };
    })
  };
}

function cross(o: Point, a: Point, b: Point) {
  return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
}

/** Monotone-chain convex hull. */
export function convexHull(points: Point[]): Point[] {
  if (points.length < 3) return points;
  const sorted = [...points].sort((a, b) => a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]);
  const lower: Point[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  }
  const upper: Point[] = [];
  for (let i = sorted.length - 1; i >= 0; i -= 1) {
    const point = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

/**
 * Observed incident extent per hotspot area: convex hull of the plotted incidents
 * for that area. Derived from data — not an administrative boundary.
 */
export function hotspotExtents(hotspots: Hotspot[], incidents: MapIncident[]): GeoJSON.FeatureCollection<GeoJSON.Polygon> {
  const byArea = new Map<string, Point[]>();
  for (const incident of incidents) {
    const list = byArea.get(incident.area) ?? [];
    list.push([incident.longitude, incident.latitude]);
    byArea.set(incident.area, list);
  }
  const features: GeoJSON.Feature<GeoJSON.Polygon>[] = [];
  for (const hotspot of hotspots) {
    const points = byArea.get(hotspot.area);
    if (!points || points.length < 3) continue;
    const hull = convexHull(points);
    if (hull.length < 3) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[...hull, hull[0]]] },
      properties: { area: hotspot.area, risk: hotspot.riskLevel }
    });
  }
  return { type: 'FeatureCollection', features };
}