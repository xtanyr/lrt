const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const inputs = process.argv.slice(2);
if (inputs.length === 0) throw new Error('Pass one or more XLSX files or directories');
const baseUrl = process.env.LRT_BASE_URL || 'http://localhost:8080';
const sources = inputs.flatMap((input) => {
  const resolved = path.resolve(input);
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) return [resolved];
  return fs.readdirSync(resolved)
    .filter((name) => name.toLowerCase().endsWith('.xlsx'))
    .map((name) => path.join(resolved, name));
});
async function login() {
  const response = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@skuratovcoffee.ru', password: 'password123' }) });
  const json = await response.json();
  assert.equal(response.status, 200);
  return json.data.accessToken;
}
(async () => {
  const token = await login();
  for (const source of sources) {
    const form = new FormData();
    form.append('file', new Blob([fs.readFileSync(source)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), path.basename(source));
    const response = await fetch(`${baseUrl}/api/admin/imports/preview`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
    const json = await response.json();
    assert.equal(response.status, 201, `${path.basename(source)}: ${JSON.stringify(json)}`);
    const preview = json.data?.data ?? json.data ?? json;
    assert.ok(Array.isArray(preview.periods) && preview.periods.length > 0);
    assert.ok(preview.warnings.some((message) => message.includes('историческую схему')));
    const invalid = preview.periods.filter((period) =>
      !period.year
      || period.revenue === null
      || period.sourceRating === null
      || period.issues.some((issue) => issue.severity === 'error')
      || period.rows.some((row) => row.issue || !row.metricId));
    console.log(JSON.stringify({
      file: path.basename(source),
      periods: preview.periods.length,
      ready: preview.periods.length - invalid.length,
      invalid: invalid.map((period) => ({
        month: period.month,
        year: period.year,
        issues: period.issues,
        rowIssues: period.rows.filter((row) => row.issue || !row.metricId).map((row) => ({ sourceRow: row.sourceRow, issue: row.issue, metricCode: row.metricCode })),
      })),
      warnings: preview.warnings,
    }, null, 2));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
