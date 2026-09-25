import { ScheduledTasksService } from '../../src/common/jobs/scheduled-tasks.service';
describe('Real scheduled report tasks', () => {
  afterEach(() => jest.useRealTimers());
  it('locks July, not August, on September 1', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-08-31T21:00:00Z'));
    const rows = [{ id: 1, year: 2026, month: 7, isLocked: false }, { id: 2, year: 2026, month: 8, isLocked: false }];
    const db = { monthlyReport: { findMany: jest.fn().mockResolvedValue(rows), update: jest.fn() } };
    await new ScheduledTasksService(db as any).handleLockReports();
    expect(db.monthlyReport.update).toHaveBeenCalledTimes(1);
    expect(db.monthlyReport.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { isLocked: true } });
  });
  it('marks August overdue, not September, at September 10 noon Moscow', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-10T09:00:00Z'));
    const db = { monthlyReport: { findMany: jest.fn().mockResolvedValue([{id: 1, year:2026, month:8}, {id:2,year:2026,month:9}]), update: jest.fn() } };
    await new ScheduledTasksService(db as any).handleOverdueReports();
    expect(db.monthlyReport.update).toHaveBeenCalledTimes(1);
    expect(db.monthlyReport.update).toHaveBeenCalledWith({where:{id:1},data:{status:'OVERDUE'}});
  });
});
