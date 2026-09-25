function readUatSeedEnv(env = process.env, currentYear = new Date().getFullYear()) {
  if (env.ALLOW_UAT_SEED !== 'true') {
    throw new Error('ALLOW_UAT_SEED=true is required to run UAT seeds');
  }

  const password = env.UAT_PASSWORD;
  if (typeof password !== 'string' || password.length < 12) {
    throw new Error('UAT_PASSWORD must be at least 12 characters');
  }

  const year = env.UAT_YEAR === undefined || env.UAT_YEAR === ''
    ? currentYear
    : Number(env.UAT_YEAR);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new Error('UAT_YEAR must be a valid year between 2000 and 2100');
  }

  return { password, year };
}

module.exports = { readUatSeedEnv };
