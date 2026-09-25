const { readUatSeedEnv } = require('../../prisma/uat-seed-env.cjs');

describe('readUatSeedEnv', () => {
  it('requires explicit UAT seed authorization', () => {
    expect(() => readUatSeedEnv({ UAT_PASSWORD: 'long-enough-password' })).toThrow(
      'ALLOW_UAT_SEED=true is required',
    );
  });

  it('rejects missing or weak passwords', () => {
    expect(() => readUatSeedEnv({ ALLOW_UAT_SEED: 'true' })).toThrow('UAT_PASSWORD must be at least 12 characters');
    expect(() => readUatSeedEnv({ ALLOW_UAT_SEED: 'true', UAT_PASSWORD: 'short' })).toThrow(
      'UAT_PASSWORD must be at least 12 characters',
    );
  });

  it('uses the current year by default and accepts a valid override', () => {
    expect(readUatSeedEnv({ ALLOW_UAT_SEED: 'true', UAT_PASSWORD: 'long-enough-password' }, 2026)).toEqual({
      password: 'long-enough-password',
      year: 2026,
    });
    expect(readUatSeedEnv({ ALLOW_UAT_SEED: 'true', UAT_PASSWORD: 'long-enough-password', UAT_YEAR: '2024' }, 2026).year).toBe(2024);
  });

  it('rejects invalid years', () => {
    expect(() => readUatSeedEnv({ ALLOW_UAT_SEED: 'true', UAT_PASSWORD: 'long-enough-password', UAT_YEAR: 'not-a-year' })).toThrow(
      'UAT_YEAR must be a valid year',
    );
  });
});
