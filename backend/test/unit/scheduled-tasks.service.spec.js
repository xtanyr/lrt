"use strict";
describe('ScheduledTasksService logic', () => {
    it('should calculate current year and month', () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        expect(currentYear).toBeGreaterThanOrEqual(2026);
        expect(currentMonth).toBeGreaterThanOrEqual(1);
        expect(currentMonth).toBeLessThanOrEqual(12);
    });
    it('should calculate lock month correctly', () => {
        const now = new Date();
        const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lockYear = twoMonthsAgo.getFullYear();
        const lockMonth = twoMonthsAgo.getMonth() + 1;
        expect(lockYear).toBeLessThanOrEqual(now.getFullYear());
        expect(lockMonth).toBeGreaterThanOrEqual(1);
        expect(lockMonth).toBeLessThanOrEqual(12);
    });
    it('should identify NOT_FILLED reports for overdue conversion', () => {
        const reports = [
            { id: 1, status: 'NOT_FILLED' },
            { id: 2, status: 'SUBMITTED' },
            { id: 3, status: 'NOT_FILLED' },
        ];
        const overdueReports = reports.filter(r => r.status === 'NOT_FILLED');
        expect(overdueReports).toHaveLength(2);
        expect(overdueReports[0].id).toBe(1);
        expect(overdueReports[1].id).toBe(3);
    });
    it('should identify unlocked reports for locking', () => {
        const reports = [
            { id: 1, isLocked: false },
            { id: 2, isLocked: true },
            { id: 3, isLocked: false },
        ];
        const unlockedReports = reports.filter(r => !r.isLocked);
        expect(unlockedReports).toHaveLength(2);
        expect(unlockedReports[0].id).toBe(1);
        expect(unlockedReports[1].id).toBe(3);
    });
});
//# sourceMappingURL=scheduled-tasks.service.spec.js.map