const assert = require('node:assert/strict');
const base = 'http://localhost:4001/api';
async function call(path, token, method = 'GET', body) {
  const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const json = await response.json();
  return { status: response.status, data: json?.data === undefined ? json : json.data };
}
(async () => {
  const login = await call('/auth/login', null, 'POST', { email: 'admin@skuratovcoffee.ru', password: 'password123' });
  assert.equal(login.status, 200);
  const token = login.data.accessToken;
  const users = await call('/admin/users', token);
  assert.equal(users.status, 200);
  const leader = users.data.find((user) => user.role === 'LEADER');
  assert.ok(leader);
  const updated = await call(`/users/${leader.id}`, token, 'PATCH', { role: 'LEADER', coffeeShopIds: leader.coffeeShopAssignments.map((item) => item.coffeeShop.id), approvedAt: '2020-01-01' });
  assert.equal(updated.status, 200, JSON.stringify(updated.data));
  assert.equal(updated.data.approvedAt.slice(0, 10), '2020-01-01');
  const colors = await call('/admin/rating-color-config', token, 'PATCH', { greenThreshold: 80, redThreshold: 60 });
  assert.equal(colors.status, 200);
  const logs = await call('/admin/config-logs', token);
  assert.equal(logs.status, 200);
  assert.ok(logs.data.some((entry) => entry.fieldChanged === `user:${leader.id}`));
  console.log('Admin acceptance passed: safe user assignment update, rating color validation, and audit log.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
