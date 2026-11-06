// Verification test suite: Duplicate report prevention on (reportid, reportdate)
const http = require('http');
const assert = require('assert');
const fs = require('fs');

const BASE = 'http://localhost:3000';

const req = (path, method = 'GET', data = null, headers = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const reqHeaders = { ...headers };
    let body = null;
    if (data) {
      body = JSON.stringify(data);
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(body);
    }
    const r = http.request(url, { method, headers: reqHeaders }, res => {
      let chunks = '';
      res.on('data', c => chunks += c);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(chunks); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json,
          text: chunks
        });
      });
    });
    r.on('error', reject);
    if (body) r.write(body);
    r.end();
  });
};

async function runTests() {
  console.log('--- STARTING DUPLICATE REPORT PREVENTION TESTS ---');
  fs.writeFileSync('data/reports.json', '{}');

  // 1. Login as admin
  console.log('1. Logging in as admin...');
  const loginRes = await req('/api/login', 'POST', { username: 'admin', password: 'admin123' });
  assert.strictEqual(loginRes.status, 200);
  const adminCookie = loginRes.headers['set-cookie'][0].split(';')[0];

  // 2. Create first report: REP-001 on 2026-11-06
  console.log('2. Creating first report: REP-001 on 2026-11-06...');
  const rep1 = await req('/api/report', 'POST', {
    id: 'REP-001',
    name: 'Counter A',
    date: '2026-11-06',
    rows: [{ ticket: 'Item 1', rate: 10, qty: 5, win: 0 }]
  }, { Cookie: adminCookie });
  assert.strictEqual(rep1.status, 200);
  assert.strictEqual(rep1.data.key, 'REP-001|2026-11-06');
  console.log('   First report created successfully.');

  // 3. Attempt to create a NEW report with existing ID (REP-001) and existing Date (2026-11-06)
  console.log('3. Attempting to create duplicate report with existing ID and Date...');
  const duplicateRes = await req('/api/report', 'POST', {
    id: 'REP-001',
    name: 'Counter A Duplicate Attempt',
    date: '2026-11-06',
    rows: [{ ticket: 'Item 2', rate: 20, qty: 10, win: 0 }]
  }, { Cookie: adminCookie });

  assert.strictEqual(duplicateRes.status, 400, 'Duplicate report must be rejected with 400');
  assert.ok(duplicateRes.data.error.includes('already exists'), 'Error must inform that report already exists');
  console.log('   Confirmed: Duplicate report strictly blocked by server (' + duplicateRes.data.error + ')');

  // 4. Save report with different ID (REP-002) on SAME Date (2026-11-06)
  console.log('4. Creating report with DIFFERENT ID REP-002 on 2026-11-06 (must be allowed)...');
  const rep2 = await req('/api/report', 'POST', {
    id: 'REP-002',
    name: 'Counter B',
    date: '2026-11-06',
    rows: [{ ticket: 'Item 3', rate: 30, qty: 2, win: 0 }]
  }, { Cookie: adminCookie });
  assert.strictEqual(rep2.status, 200);
  console.log('   Confirmed: Different ID on same date allowed.');

  // 5. Updating existing report REP-001 on 2026-11-06 (updating self must be allowed)
  console.log('5. Updating existing report REP-001 on 2026-11-06 (updating self)...');
  const updateSelfRes = await req('/api/report', 'POST', {
    id: 'REP-001',
    name: 'Counter A Updated',
    date: '2026-11-06',
    rows: [{ ticket: 'Item 1 Updated', rate: 10, qty: 8, win: 50 }],
    originalId: 'REP-001',
    originalDate: '2026-11-06'
  }, { Cookie: adminCookie });
  assert.strictEqual(updateSelfRes.status, 200);
  console.log('   Confirmed: Updating self is allowed.');

  // Clean up
  fs.writeFileSync('data/reports.json', '{}');
  console.log('   Cleaned reports.json to empty object {}.');

  console.log('--- ALL DUPLICATE PREVENTION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
