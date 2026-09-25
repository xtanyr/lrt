import { triggerMatch } from '../../src/ipv-triggers/trigger-rules';
const reports = (ratings: number[]) => ratings.map((rating, i) => ({year:2026,month:i+1,status:'SUBMITTED',ratingSnapshot:{rating,results:[{metricId:1,zone:'CRITICAL'}]}}));
describe('IPV consecutive-month rules', () => {
 it('requires three consecutive low ratings with no growth for T1', () => {
  expect(triggerMatch(reports([59,55,50]),{code:'T1',monthsCount:3,thresholdRating:60},2026,3)).not.toBeNull();
  expect(triggerMatch(reports([50,55,50]),{code:'T1',monthsCount:3,thresholdRating:60},2026,3)).toBeNull();
  expect(triggerMatch(reports([59,55,50]),{code:'T1',monthsCount:3,thresholdRating:60},2026,4)).toBeNull();
 });
 it('includes zero and does not exempt growth for T2', () => {
  expect(triggerMatch(reports([0,20,30]),{code:'T2',monthsCount:3,thresholdRating:80},2026,3)).not.toBeNull();
 });
 it('requires the same critical metric for T3', () => {
  const rows=reports([90,90,90]);
  expect(triggerMatch(rows,{code:'T3',monthsCount:3,thresholdRating:0},2026,3)).toEqual({metricId:1});
  rows[1].ratingSnapshot.results[0].metricId=2;
  expect(triggerMatch(rows,{code:'T3',monthsCount:3,thresholdRating:0},2026,3)).toBeNull();
 });
 it('does not bridge missing months or count drafts', () => {
  const rows=reports([20,20,20]);rows[1].status='NOT_FILLED';
  expect(triggerMatch(rows,{code:'T1',monthsCount:3,thresholdRating:60},2026,3)).toBeNull();
 });
});
