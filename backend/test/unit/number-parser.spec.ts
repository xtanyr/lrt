import { cleanNumericString } from '../../src/imports/import.parser';

describe('Production import number parser', () => {
  it.each([['4,19', 4.19], ['81 300,25 ₽', 81300.25], ['4 402 865', 4402865], ['0', 0], ['-12,5', -12.5]])('normalizes %s without losing precision', (raw, value) => {
    expect(cleanNumericString(raw)).toEqual({ value });
  });
  it.each(['12abc', '1.2.3', '12%%', '1,2.3', 'Infinity', '1e5', '1\n2'])('rejects malformed %s', raw => {
    const result = cleanNumericString(raw);
    expect(result.value).toBeNull();
    expect(result.problem).toBeTruthy();
  });
  it('preserves percent points, with an explicit import warning', () => {
    expect(cleanNumericString('95%')).toEqual({ value: 95, problem: expect.any(String) });
  });
  it('distinguishes absent from zero', () => {
    expect(cleanNumericString(' ')).toEqual({ value: null });
    expect(cleanNumericString('0')).toEqual({ value: 0 });
  });
});
