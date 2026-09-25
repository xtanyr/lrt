import { reportPeriodState } from '../../src/common/report-period';

describe('Moscow report calendar', () => {
  it('keeps August editable until October 1 Moscow time', () => {
    expect(reportPeriodState(2026, 8, new Date('2026-09-30T20:59:59Z'))).toEqual({ overdue: true, locked: false });
    expect(reportPeriodState(2026, 8, new Date('2026-09-30T21:00:00Z'))).toEqual({ overdue: true, locked: true });
  });
  it('marks overdue at noon of the following month', () => {
    expect(reportPeriodState(2026, 8, new Date('2026-09-10T08:59:59Z')).overdue).toBe(false);
    expect(reportPeriodState(2026, 8, new Date('2026-09-10T09:00:00Z')).overdue).toBe(true);
  });
  it('handles December rollover', () => {
    expect(reportPeriodState(2026, 12, new Date('2027-01-31T21:00:00Z')).locked).toBe(true);
  });
  it('rejects invalid month', () => { expect(() => reportPeriodState(2026, 13)).toThrow(); });
});
