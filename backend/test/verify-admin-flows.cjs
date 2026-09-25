const assert = require('node:assert/strict');

const base = process.env.LRT_BASE_URL || 'http://localhost:8080/api';

async function call(path, token, method = 'GET', body) {
  const response = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${path}: ${response.status} ${JSON.stringify(json)}`);
  return json?.data === undefined ? json : json.data;
}

function allShops(cities) {
  return cities.flatMap((city) => (city.coffeeShops || []).map((shop) => ({ ...shop, cityId: city.id })));
}

(async () => {
  const login = await call('/auth/login', null, 'POST', {
    email: process.env.LRT_ADMIN_EMAIL || 'admin@skuratovcoffee.ru',
    password: process.env.LRT_ADMIN_PASSWORD || 'password123',
  });
  const token = login.accessToken;
  assert.ok(token, 'Admin token was not returned');

  const cities = await call('/cities?includeInactiveShops=true', token);
  const shop = allShops(cities)[0];
  assert.ok(shop, 'No coffee shop is available for the structure check');
  const originalShopState = shop.isActive;
  try {
    await call(`/coffee-shops/${shop.id}`, token, 'PATCH', { isActive: !originalShopState });
    const changedCities = await call('/cities?includeInactiveShops=true', token);
    const changedShop = allShops(changedCities).find((item) => item.id === shop.id);
    assert.ok(changedShop, 'Deactivated coffee shop disappeared from the administrative directory');
    assert.equal(changedShop.isActive, !originalShopState);
  } finally {
    await call(`/coffee-shops/${shop.id}`, token, 'PATCH', { isActive: originalShopState });
  }

  const metrics = await call('/metrics', token);
  const metric = metrics.find((item) => item.isActive && item.source);
  assert.ok(metric, 'No active metric with a source is available for the edit check');
  const originalSource = metric.source;
  const testSource = `${originalSource} · проверка`;
  try {
    const updated = await call(`/metrics/${metric.id}`, token, 'PATCH', { source: testSource });
    assert.equal(updated.source, testSource);
  } finally {
    await call(`/metrics/${metric.id}`, token, 'PATCH', { source: originalSource });
  }

  const reports = await call('/reports/my', token);
  const report = reports.find((item) => !item.isLocked && item.coffeeShop?.isActive);
  const questions = await call('/admin/analysis-questions', token);
  assert.ok(report && questions.length, 'No editable report or analysis question is available for the report audit check');
  const question = questions[0];
  const originalAnalysis = report.analyses?.find((item) => item.questionKey === question.questionKey)?.content || '';
  const testAnalysis = `${originalAnalysis}${originalAnalysis ? '\n' : ''}[проверка аудита]`;
  try {
    await call(`/reports/${report.id}/analysis/${encodeURIComponent(question.questionKey)}`, token, 'PATCH', { content: testAnalysis });
  } finally {
    await call(`/reports/${report.id}/analysis/${encodeURIComponent(question.questionKey)}`, token, 'PATCH', { content: originalAnalysis });
  }

  const configLogs = await call('/admin/config-logs', token);
  assert.ok(configLogs.filter((entry) => entry.fieldChanged === `structure:coffee-shop:${shop.id}:update`).length >= 2, 'Coffee shop changes were not written to config audit');
  assert.ok(configLogs.filter((entry) => entry.fieldChanged === `metric:${metric.id}:update`).length >= 2, 'Metric changes were not written to config audit');

  const reportLogs = await call(`/reports/${report.id}/edit-logs`, token);
  assert.ok(reportLogs.filter((entry) => entry.fieldChanged === `analysis:${question.questionKey}`).length >= 2, 'Report analysis changes were not written to report audit');

  console.log(`Admin flows passed: shop #${shop.id} remained visible, metric #${metric.id} was restored, config audit has ${configLogs.length} entries, report audit has ${reportLogs.length} entries.`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
