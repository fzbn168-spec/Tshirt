const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const OUT_PATH = process.env.OUT_CSV || path.join(__dirname, 'company_whitelist.csv');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

async function login() {
  if (ADMIN_TOKEN) return ADMIN_TOKEN;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD');
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token;
}

async function getCompanies(token) {
  const res = await fetch(`${BASE_URL}/platform/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Get companies failed: ${res.status}`);
  return await res.json();
}

function csvEscape(value) {
  if (value == null) return '';
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

async function run() {
  try {
    const token = await login();
    const companies = await getCompanies(token);
    const header = ['companyId', 'companyName', 'contactEmail', 'salesRepEmail', 'targetStatus'];
    const lines = [header.join(',')];
    for (const c of companies) {
      const row = [
        csvEscape(c.id || ''),
        csvEscape(c.name || ''),
        csvEscape(c.contactEmail || ''),
        '',
        'APPROVED',
      ];
      lines.push(row.join(','));
    }
    fs.writeFileSync(OUT_PATH, lines.join('\n'), 'utf-8');
    console.log(`Exported ${companies.length} companies -> ${OUT_PATH}`);
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

run();
