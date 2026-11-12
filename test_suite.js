// Verification test suite: DELETE /api/report endpoint and functionality
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
  console.log('--- STARTING REPORT DELETION TESTS ---');
  fs.writeFileSync('data/reports.json', '{}');

  // 1. Login as admin
  console.log('1. Logging in as admin...');
  const loginRes = await req('/api/login', 'POST', { username: 'admin', password: 'admin123' });
  assert.strictEqual(loginRes.status, 200);
  const adminCookie = loginRes.headers['set-cookie'][0].split(';')[0];

  // 2. Create a report to delete
  console.log('2. Creating report REP-DEL-1 on 2026-11-06...');
  const rep = await req('/api/report', 'POST', {
    id: 'REP-DEL-1',
    name: 'Counter To Delete',
    date: '2026-11-06',
    rows: [{ ticket: 'Item Del', rate: 10, qty: 5, win: 0 }]
  }, { Cookie: adminCookie });
  assert.strictEqual(rep.status, 200);
  assert.strictEqual(rep.data.key, 'REP-DEL-1|2026-11-06');

  // 3. Verify it exists
  console.log('3. Verifying report exists before deletion...');
  const getBefore = await req('/api/report?id=REP-DEL-1&date=2026-11-06', 'GET', null, { Cookie: adminCookie });
  assert.strictEqual(getBefore.status, 200);
  assert.strictEqual(getBefore.data.id, 'REP-DEL-1');

  // 4. Delete the report via DELETE /api/report
  console.log('4. Calling DELETE /api/report...');
  const delRes = await req('/api/report', 'DELETE', {
    id: 'REP-DEL-1',
    date: '2026-11-06'
  }, { Cookie: adminCookie });
  assert.strictEqual(delRes.status, 200);
  assert.strictEqual(delRes.data.ok, true);
  console.log('   DELETE /api/report returned success.');

  // 5. Verify it is gone
  console.log('5. Verifying report no longer exists after deletion...');
  const getAfter = await req('/api/report?id=REP-DEL-1&date=2026-11-06', 'GET', null, { Cookie: adminCookie });
  assert.strictEqual(getAfter.data, null);

  const rawFile = JSON.parse(fs.readFileSync('data/reports.json', 'utf8'));
  assert.strictEqual(rawFile['REP-DEL-1|2026-11-06'], undefined);
  console.log('   Confirmed: Report cleanly deleted from reports.json.');

  // 6. Delete on non-existent report should return 404
  console.log('6. Verifying DELETE on non-existent report returns 404...');
  const delNonExistent = await req('/api/report', 'DELETE', {
    id: 'REP-DEL-1',
    date: '2026-11-06'
  }, { Cookie: adminCookie });
  assert.strictEqual(delNonExistent.status, 404);
  console.log('   Confirmed: 404 returned for non-existent report.');

  // 7. Verify empty row creation and retrieval (empty string rather than 0)
  console.log('7. Verifying saving and retrieving report with empty rows...');
  const emptyRowRep = await req('/api/report', 'POST', {
    id: 'REP-EMPTY-1',
    name: 'Empty Row Verification',
    date: '2026-11-06',
    rows: [
      { ticket: '', rate: '', qty: '', win: '' },
      { ticket: 'ItemPartial', rate: 25, qty: 4, win: '' }
    ]
  }, { Cookie: adminCookie });
  assert.strictEqual(emptyRowRep.status, 200);

  const getEmpty = await req('/api/report?id=REP-EMPTY-1&date=2026-11-06', 'GET', null, { Cookie: adminCookie });
  assert.strictEqual(getEmpty.status, 200);
  assert.strictEqual(getEmpty.data.rows[0].rate, '');
  assert.strictEqual(getEmpty.data.rows[0].qty, '');
  assert.strictEqual(getEmpty.data.rows[0].win, '');
  assert.strictEqual(getEmpty.data.rows[1].rate, 25);
  assert.strictEqual(getEmpty.data.rows[1].qty, 4);
  assert.strictEqual(getEmpty.data.rows[1].win, '');
  console.log('   Confirmed: Empty row fields preserved as empty string instead of 0.');

  // Clean up
  fs.writeFileSync('data/reports.json', '{}');
  console.log('   Cleaned reports.json to empty object {}.');

  console.log('--- ALL REPORT TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch(err => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
