export interface ScoreSnapshot {
  rating: number;
  results: { metricId: number; metricName: string; absoluteValue: number | null; computedPercent: number | null; zone: string | null; pointsAwarded: number | null }[];
}
export interface ScoredReport { score?: ScoreSnapshot | null }
export function computeReportScore(report: ScoredReport, _metrics?: unknown): number | null {
  return report.score && Number.isFinite(report.score.rating) ? report.score.rating : null;
}
export function metricZone(report: ScoredReport | null | undefined, metricId: number): string {
  const zone = report?.score?.results?.find(r => r.metricId === metricId)?.zone;
  return zone === 'TARGET' ? 'green' : zone === 'BELOW_TARGET' ? 'yellow' : zone === 'CRITICAL' ? 'red' : 'gray';
}
