export interface TriggerReport {
  year: number; month: number; status: string;
  ratingSnapshot: any;
}
export function triggerMatch(reports: TriggerReport[], config: {code: string; monthsCount: number; thresholdRating: unknown}, endYear: number, endMonth: number): {metricId: number | null} | null {
  const end = endYear * 12 + endMonth - 1;
  const window: TriggerReport[] = [];
  for (let i = config.monthsCount - 1; i >= 0; i--) {
    const period = end - i;
    const report = reports.find(r => r.year * 12 + r.month - 1 === period && r.status === 'SUBMITTED');
    if (!report?.ratingSnapshot || !Number.isFinite(report.ratingSnapshot.rating)) return null;
    window.push(report);
  }
  if (!window.length) return null;
  if (config.code === 'T3') {
    const critical = (window[0].ratingSnapshot.results || []).filter((r: any) => r.zone === 'CRITICAL');
    const common = critical.find((r: any) => window.every(w => w.ratingSnapshot.results?.some((v: any) => v.metricId === r.metricId && v.zone === 'CRITICAL')));
    return common ? {metricId: common.metricId} : null;
  }
  const ratings = window.map(r => r.ratingSnapshot.rating as number);
  if (!ratings.every(r => r < Number(config.thresholdRating))) return null;
  if (config.code === 'T1' && ratings.some((r, i) => i > 0 && r > ratings[i - 1])) return null;
  return {metricId: null};
}
export function monthsOld(date: Date | null, minimum: number, now: Date): boolean {
  if (!date) return minimum === 0;
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - minimum);
  return date <= cutoff;
}
