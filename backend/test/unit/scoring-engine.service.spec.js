"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const library_1 = require("@prisma/client/runtime/library");
function calculateMetricPoints(metric, absoluteValue, revenue) {
    const thresholdStrong = new library_1.Decimal(metric.thresholdStrong);
    const thresholdMedium = new library_1.Decimal(metric.thresholdMedium);
    const pointsStrong = new library_1.Decimal(metric.pointsStrong);
    const pointsMedium = new library_1.Decimal(metric.pointsMedium);
    const pointsCritical = new library_1.Decimal(metric.pointsCritical ?? 0);
    let value = absoluteValue;
    const isBetter = metric.direction === 'HIGHER_IS_BETTER';
    let zone;
    let points;
    if (isBetter) {
        if (value.gte(thresholdStrong)) {
            zone = 'TARGET';
            points = pointsStrong;
        }
        else if (value.gte(thresholdMedium)) {
            zone = 'BELOW_TARGET';
            points = pointsMedium;
        }
        else {
            zone = 'CRITICAL';
            points = pointsCritical;
        }
    }
    else {
        if (value.lte(thresholdStrong)) {
            zone = 'TARGET';
            points = pointsStrong;
        }
        else if (value.lte(thresholdMedium)) {
            zone = 'BELOW_TARGET';
            points = pointsMedium;
        }
        else {
            zone = 'CRITICAL';
            points = pointsCritical;
        }
    }
    return { zone, points };
}
describe('calculateMetricPoints', () => {
    it('should calculate target zone for higher_is_better metric', () => {
        const metric = {
            direction: 'HIGHER_IS_BETTER',
            thresholdStrong: 95,
            thresholdMedium: 80,
            pointsStrong: 11.5,
            pointsMedium: 5.75,
            pointsCritical: 0,
        };
        const value = new library_1.Decimal(96);
        const result = calculateMetricPoints(metric, value, null);
        expect(result.zone).toBe('TARGET');
        expect(result.points.toNumber()).toBeCloseTo(11.5, 1);
    });
    it('should calculate below_target zone for higher_is_better metric', () => {
        const metric = {
            direction: 'HIGHER_IS_BETTER',
            thresholdStrong: 95,
            thresholdMedium: 80,
            pointsStrong: 11.5,
            pointsMedium: 5.75,
            pointsCritical: 0,
        };
        const value = new library_1.Decimal(85);
        const result = calculateMetricPoints(metric, value, null);
        expect(result.zone).toBe('BELOW_TARGET');
        expect(result.points.toNumber()).toBeCloseTo(5.75, 1);
    });
    it('should calculate critical zone for higher_is_better metric', () => {
        const metric = {
            direction: 'HIGHER_IS_BETTER',
            thresholdStrong: 95,
            thresholdMedium: 80,
            pointsStrong: 11.5,
            pointsMedium: 5.75,
            pointsCritical: 0,
        };
        const value = new library_1.Decimal(70);
        const result = calculateMetricPoints(metric, value, null);
        expect(result.zone).toBe('CRITICAL');
        expect(result.points.toNumber()).toBe(0);
    });
    it('should calculate target zone for lower_is_better metric', () => {
        const metric = {
            direction: 'LOWER_IS_BETTER',
            thresholdStrong: 2,
            thresholdMedium: 3,
            pointsStrong: 11.5,
            pointsMedium: 5.75,
            pointsCritical: 0,
        };
        const value = new library_1.Decimal(1.5);
        const result = calculateMetricPoints(metric, value, null);
        expect(result.zone).toBe('TARGET');
        expect(result.points.toNumber()).toBeCloseTo(11.5, 1);
    });
    it('should calculate critical zone for lower_is_better metric', () => {
        const metric = {
            direction: 'LOWER_IS_BETTER',
            thresholdStrong: 2,
            thresholdMedium: 3,
            pointsStrong: 11.5,
            pointsMedium: 5.75,
            pointsCritical: 0,
        };
        const value = new library_1.Decimal(4);
        const result = calculateMetricPoints(metric, value, null);
        expect(result.zone).toBe('CRITICAL');
        expect(result.points.toNumber()).toBe(0);
    });
});
//# sourceMappingURL=scoring-engine.service.spec.js.map