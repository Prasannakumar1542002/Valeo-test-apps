# Daily Report

Run: `node server.js` (Node 16+, no npm install needed) → http://localhost:3000

Default admin login: `admin` / `admin123`

### Features
- **Daily Report Management:** Create, view, edit, and save daily sales and balance records.
- **Search Capabilities:**
  - Real-time row filtering by ticket name.
  - Search and quickly load saved reports by Date, ID, or Name.
- **Admin-Only User Registration:**
  - Accessible via `/register` (restricted to admin users).
  - Register new standard users or admin accounts.
  - Manage and view existing user accounts.
- **Responsive UI:** Clean, modern, overflow-free interface with full mobile and desktop support.

Data is stored in `./data/users.json` and `./data/reports.json`.
