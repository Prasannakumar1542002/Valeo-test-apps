// Zero-dependency Node server for Daily Report. Storage = plain JSON files in ./data
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const PORT = process.env.PORT || 3000;
const DATA = path.join(__dirname, 'data'), PUB = path.join(__dirname, 'public');
const USERS = path.join(DATA, 'users.json'), REPORTS = path.join(DATA, 'reports.json');
const sessions = new Map();
const hash = (p, s) => crypto.scryptSync(p, s, 32).toString('hex');

fs.mkdirSync(DATA, { recursive: true });
const readJSON = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const writeJSON = (f, o) => { const t = f + '.tmp'; fs.writeFileSync(t, JSON.stringify(o, null, 2)); fs.renameSync(t, f); };

const getUserRole = u => u.role || (u.username === 'admin' ? 'admin' : 'user');

// Ensure default admin user exists with admin role
if (!fs.existsSync(USERS)) {
  const salt = crypto.randomBytes(8).toString('hex');
  writeJSON(USERS, [{ username: 'admin', role: 'admin', salt, hash: hash('admin123', salt), createdAt: new Date().toISOString() }]);
  console.log('Created default user: admin / admin123 (role: admin)');
} else {
  // Ensure existing admin user has admin role
  const users = readJSON(USERS, []);
  let modified = false;
  users.forEach(u => {
    if (u.username === 'admin' && !u.role) {
      u.role = 'admin';
      modified = true;
    }
  });
  if (modified) writeJSON(USERS, users);
}

const json = (res, code, obj, h = {}) => {
  res.writeHead(code, { 'Content-Type': 'application/json', ...h });
  res.end(JSON.stringify(obj));
};

const body = req => new Promise(r => {
  let b = '';
  req.on('data', c => { b += c; if (b.length > 2e6) req.destroy(); });
  req.on('end', () => { try { r(JSON.parse(b || '{}')); } catch { r({}); } });
});

const sid = req => (/sid=([a-f0-9]+)/.exec(req.headers.cookie || '') || [])[1];
const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
  const p = url.pathname;

  // API endpoints
  if (p.startsWith('/api/')) {
    // Public: Login
    if (p === '/api/login' && req.method === 'POST') {
      const { username, password } = await body(req);
      const u = readJSON(USERS, []).find(x => x.username.toLowerCase() === String(username || '').trim().toLowerCase());
      if (!u || hash(String(password || ''), u.salt) !== u.hash) {
        return json(res, 401, { error: 'Invalid username or password' });
      }
      const role = getUserRole(u);
      const id = crypto.randomBytes(24).toString('hex');
      sessions.set(id, { username: u.username, role });
      return json(res, 200, { ok: true, username: u.username, role }, {
        'Set-Cookie': `sid=${id}; HttpOnly; Path=/; SameSite=Strict; Max-Age=86400`
      });
    }

    const session = sessions.get(sid(req));

    // Public: Logout
    if (p === '/api/logout') {
      const currentSid = sid(req);
      if (currentSid) sessions.delete(currentSid);
      return json(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; Path=/; Max-Age=0' });
    }

    if (!session) return json(res, 401, { error: 'Unauthorized' });

    // Current user info
    if (p === '/api/me') {
      return json(res, 200, { username: session.username, role: session.role });
    }

    // Reports: Get single report by composite key (id, date) or by date/id
    if (p === '/api/report' && req.method === 'GET') {
      const all = readJSON(REPORTS, {});
      const date = url.searchParams.get('date');
      const id = url.searchParams.get('id');

      if (id && date) {
        // Direct composite key lookup (id, date)
        const compositeKey = `${id.trim()}|${date.trim()}`;
        if (all[compositeKey]) return json(res, 200, all[compositeKey]);
        const match = Object.values(all).find(x =>
          String(x.id).trim().toLowerCase() === id.trim().toLowerCase() &&
          x.date === date.trim()
        );
        return json(res, 200, match || null);
      }

      if (date) {
        // Search by date: first for user, or any if admin
        const match = Object.values(all).find(x =>
          x.date === date && (x.user === session.username || session.role === 'admin')
        );
        return json(res, 200, match || null);
      }

      if (id) {
        // Search by id: first for user, or any if admin
        const match = Object.values(all).find(x =>
          String(x.id).trim().toLowerCase() === id.trim().toLowerCase() &&
          (x.user === session.username || session.role === 'admin')
        );
        return json(res, 200, match || null);
      }

      return json(res, 400, { error: 'Missing report id or date parameter' });
    }

    // Reports: Search and list reports with composite key identity
    if (p === '/api/reports' && req.method === 'GET') {
      const all = readJSON(REPORTS, {});
      const q = (url.searchParams.get('q') || '').trim().toLowerCase();
      let reports = Object.entries(all).map(([k, v]) => {
        const username = v.user || 'admin';
        const reportId = v.id || (k.includes('|') ? k.split('|')[0] : '');
        const reportDate = v.date || (k.includes('|') ? k.split('|')[1] : '');
        const rows = Array.isArray(v.rows) ? v.rows : [];
        const totalQty = rows.reduce((s, r) => s + (Number(r.qty) || 0), 0);
        const totalWin = rows.reduce((s, r) => s + (Number(r.win) || 0), 0);
        const totalAmount = rows.reduce((s, r) => s + ((Number(r.rate) || 0) * (Number(r.qty) || 0)), 0);
        return {
          key: `${reportId}|${reportDate}`,
          id: reportId,
          name: v.name || '',
          date: reportDate,
          savedAt: v.savedAt || '',
          user: username,
          rowCount: rows.length,
          totalQty,
          totalWin,
          totalBalance: totalAmount - totalWin,
          tickets: rows.map(r => r.ticket)
        };
      });

      // Filter by user if not admin
      if (session.role !== 'admin') {
        reports = reports.filter(r => r.user === session.username);
      }

      // Filter by query if provided
      if (q) {
        reports = reports.filter(r =>
          r.id.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.date.toLowerCase().includes(q) ||
          r.user.toLowerCase().includes(q) ||
          r.key.toLowerCase().includes(q) ||
          r.tickets.some(t => String(t).toLowerCase().includes(q))
        );
      }

      // Sort newest date first
      reports.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.savedAt || '').localeCompare(a.savedAt || ''));

      return json(res, 200, reports);
    }

    // Reports: Save report with composite key of (reportid, reportdate)
    if (p === '/api/report' && req.method === 'POST') {
      const b = await body(req);
      const reportId = String(b.id || '').trim();
      const reportName = String(b.name || '').trim();
      const reportDate = String(b.date || '').trim();
      const originalId = String(b.originalId || '').trim();
      const originalDate = String(b.originalDate || '').trim();

      if (!reportId) {
        return json(res, 400, { error: 'Report ID is mandatory' });
      }
      if (!reportName) {
        return json(res, 400, { error: 'Report Name is mandatory' });
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(reportDate)) {
        return json(res, 400, { error: 'Report Date is mandatory (YYYY-MM-DD)' });
      }
      if (!Array.isArray(b.rows)) {
        return json(res, 400, { error: 'Report rows must be an array' });
      }

      const num = v => Number.isFinite(+v) ? +v : 0;
      const all = readJSON(REPORTS, {});
      
      // Composite key: reportid|reportdate
      const compositeKey = `${reportId}|${reportDate}`;

      // Check if updating the exact same existing report or explicit overwrite confirmed
      const allowOverwrite = Boolean(b.overwrite);
      const isUpdatingSelf = allowOverwrite || (originalId && originalDate &&
        originalId.toLowerCase() === reportId.toLowerCase() &&
        originalDate === reportDate);

      // Disallow unintended duplicate creation
      if (!isUpdatingSelf && all[compositeKey]) {
        return json(res, 400, {
          error: `A report with ID '${reportId}' and Date '${reportDate}' already exists.`,
          duplicate: true
        });
      }

      // If updating an existing report to a new date or ID, remove the old composite key entry
      if (originalId && originalDate && (originalId !== reportId || originalDate !== reportDate)) {
        const oldCompositeKey = `${originalId}|${originalDate}`;
        if (all[oldCompositeKey]) {
          delete all[oldCompositeKey];
        }
      }
      
      all[compositeKey] = {
        id: reportId,
        date: reportDate,
        name: reportName,
        user: session.username,
        rows: b.rows.map(r => ({
          ticket: String(r.ticket || ''),
          rate: (r.rate === '' || r.rate === null || r.rate === undefined) ? '' : num(r.rate),
          qty: (r.qty === '' || r.qty === null || r.qty === undefined) ? '' : num(r.qty),
          win: (r.win === '' || r.win === null || r.win === undefined) ? '' : num(r.win)
        })),
        savedAt: new Date().toISOString()
      };
      writeJSON(REPORTS, all);
      return json(res, 200, { ok: true, key: compositeKey, id: reportId, date: reportDate, savedAt: all[compositeKey].savedAt });
    }

    // Reports: Delete report by composite key (reportid, reportdate)
    if (p === '/api/report' && req.method === 'DELETE') {
      const b = await body(req);
      const reportId = String(b.id || url.searchParams.get('id') || '').trim();
      const reportDate = String(b.date || url.searchParams.get('date') || '').trim();

      if (!reportId || !reportDate) {
        return json(res, 400, { error: 'Both Report ID and Report Date are required to delete a report' });
      }

      const all = readJSON(REPORTS, {});
      const compositeKey = `${reportId}|${reportDate}`;
      const existing = all[compositeKey] || Object.values(all).find(x =>
        String(x.id).trim().toLowerCase() === reportId.toLowerCase() &&
        x.date === reportDate
      );

      if (!existing) {
        return json(res, 404, { error: `Report '${reportId}' for date '${reportDate}' not found` });
      }

      // Check ownership or admin role
      if (session.role !== 'admin' && existing.user !== session.username) {
        return json(res, 403, { error: 'Forbidden: You do not have permission to delete this report' });
      }

      // Remove from storage
      const targetKey = Object.keys(all).find(k =>
        all[k] === existing ||
        k.toLowerCase() === compositeKey.toLowerCase()
      );
      if (targetKey) delete all[targetKey];
      writeJSON(REPORTS, all);

      return json(res, 200, {
        ok: true,
        message: `Report '${reportId}' for date '${reportDate}' deleted successfully`
      });
    }

    // Admin Only: List users
    if (p === '/api/users' && req.method === 'GET') {
      if (session.role !== 'admin') return json(res, 403, { error: 'Forbidden: Admins only' });
      const users = readJSON(USERS, []).map(u => ({
        username: u.username,
        role: getUserRole(u),
        createdAt: u.createdAt || null
      }));
      return json(res, 200, users);
    }

    // Admin Only: Register new user
    if ((p === '/api/register' || p === '/api/users') && req.method === 'POST') {
      if (session.role !== 'admin') return json(res, 403, { error: 'Forbidden: Admins only' });
      const { username, password, role } = await body(req);
      const cleanUser = String(username || '').trim();
      const cleanPass = String(password || '');
      const assignedRole = role === 'admin' ? 'admin' : 'user';

      if (!cleanUser || cleanUser.length < 3 || cleanUser.length > 30) {
        return json(res, 400, { error: 'Username must be between 3 and 30 characters' });
      }
      if (!/^[a-zA-Z0-9_\-\.]+$/.test(cleanUser)) {
        return json(res, 400, { error: 'Username can only contain letters, numbers, hyphens, and underscores' });
      }
      if (!cleanPass || cleanPass.length < 4) {
        return json(res, 400, { error: 'Password must be at least 4 characters long' });
      }

      const users = readJSON(USERS, []);
      if (users.some(u => u.username.toLowerCase() === cleanUser.toLowerCase())) {
        return json(res, 400, { error: 'Username already exists' });
      }

      const salt = crypto.randomBytes(8).toString('hex');
      const newUser = {
        username: cleanUser,
        role: assignedRole,
        salt,
        hash: hash(cleanPass, salt),
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      writeJSON(USERS, users);

      return json(res, 201, {
        ok: true,
        message: `User '${cleanUser}' created successfully`,
        user: { username: cleanUser, role: assignedRole }
      });
    }

    // Admin Only: Delete user
    if (p === '/api/users' && req.method === 'DELETE') {
      if (session.role !== 'admin') return json(res, 403, { error: 'Forbidden: Admins only' });
      const { username } = await body(req);
      const targetUser = String(username || '').trim();

      if (!targetUser) return json(res, 400, { error: 'Username is required' });
      if (targetUser.toLowerCase() === session.username.toLowerCase()) {
        return json(res, 400, { error: 'Cannot delete your own currently logged-in account' });
      }

      const users = readJSON(USERS, []);
      const index = users.findIndex(u => u.username.toLowerCase() === targetUser.toLowerCase());
      if (index === -1) return json(res, 404, { error: 'User not found' });

      // Check if trying to delete the only admin
      if (getUserRole(users[index]) === 'admin') {
        const adminCount = users.filter(u => getUserRole(u) === 'admin').length;
        if (adminCount <= 1) {
          return json(res, 400, { error: 'Cannot delete the only remaining admin account' });
        }
      }

      users.splice(index, 1);
      writeJSON(USERS, users);

      // Invalidate target user's active sessions
      for (const [key, sess] of sessions.entries()) {
        if (sess.username.toLowerCase() === targetUser.toLowerCase()) {
          sessions.delete(key);
        }
      }

      return json(res, 200, { ok: true, message: `User '${targetUser}' deleted` });
    }

    return json(res, 404, { error: 'API route not found' });
  }

  // Route protection for HTML pages
  const session = sessions.get(sid(req));

  if (p === '/register' || p === '/register.html') {
    if (!session) {
      res.writeHead(302, { Location: '/' });
      return res.end();
    }
    if (session.role !== 'admin') {
      res.writeHead(302, { Location: '/report' });
      return res.end();
    }
    const fp = path.join(PUB, 'register.html');
    if (fs.existsSync(fp)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(fp).pipe(res);
    }
  }

  if (p === '/report' || p === '/report.html') {
    if (!session) {
      res.writeHead(302, { Location: '/' });
      return res.end();
    }
    const fp = path.join(PUB, 'report.html');
    if (fs.existsSync(fp)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return fs.createReadStream(fp).pipe(res);
    }
  }

  // Static files serving
  let f = p === '/' ? '/index.html' : p;
  const fp = path.join(PUB, path.normalize(f));
  if (!fp.startsWith(PUB) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    return res.end('Not found');
  }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
  fs.createReadStream(fp).pipe(res);
}).listen(PORT, () => console.log(`Daily Report server running at http://localhost:${PORT}`));
