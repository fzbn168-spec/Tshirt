const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const CSV_PATH = process.env.WHITELIST_CSV || path.join(__dirname, 'company_whitelist.csv');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || '';

async function login() {
  if (ADMIN_TOKEN) return ADMIN_TOKEN;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Missing ADMIN_EMAIL or ADMIN_PASSWORD');
  }
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(',').map((s) => s.trim());
  return lines.slice(1).map((line) => {
    const cols = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        cols.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    const obj = {};
    header.forEach((h, idx) => (obj[h] = (cols[idx] || '').trim()));
    return obj;
  });
}

async function getCompanies(token) {
  const res = await fetch(`${BASE_URL}/platform/companies`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Get companies failed: ${res.status}`);
  return await res.json();
}

async function getSalesReps(token) {
  const res = await fetch(`${BASE_URL}/platform/sales-reps`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Get reps failed: ${res.status}`);
  return await res.json();
}

async function patchStatus(token, id, status) {
  const res = await fetch(`${BASE_URL}/platform/companies/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Patch status failed ${id}: ${res.status}`);
  return await res.json();
}

async function assignRep(token, id, salesRepId) {
  const res = await fetch(`${BASE_URL}/platform/companies/${id}/sales-rep`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ salesRepId }),
  });
  if (!res.ok) throw new Error(`Assign rep failed ${id}: ${res.status}`);
  return await res.json();
}

async function run() {
  try {
    const token = await login();
    const csv = fs.readFileSync(CSV_PATH, 'utf-8');
    const rows = parseCSV(csv);
    const companies = await getCompanies(token);
    const reps = await getSalesReps(token);

    for (const row of rows) {
      const status = row.targetStatus || 'APPROVED';
      let company = null;
      if (row.companyId) {
        company = companies.find((c) => c.id === row.companyId);
      }
      if (!company && row.contactEmail) {
        company = companies.find((c) => (c.contactEmail || '').toLowerCase() === row.contactEmail.toLowerCase());
      }
      if (!company && row.companyName) {
        company = companies.find((c) => (c.name || '').toLowerCase() === row.companyName.toLowerCase());
      }
      if (!company) {
        console.error(`Skip: company not found for row: ${JSON.stringify(row)}`);
        continue;
      }

      if (company.status !== status) {
        await patchStatus(token, company.id, status);
        console.log(`Status updated: ${company.name} -> ${status}`);
      } else {
        console.log(`Status unchanged: ${company.name} (${status})`);
      }

      if (row.salesRepEmail) {
        const rep = reps.find((r) => (r.email || '').toLowerCase() === row.salesRepEmail.toLowerCase());
        if (rep && rep.id && company.salesRepId !== rep.id) {
          await assignRep(token, company.id, rep.id);
          console.log(`Assigned rep: ${company.name} -> ${rep.email}`);
        } else if (!rep) {
          console.warn(`Rep not found: ${row.salesRepEmail}`);
        } else {
          console.log(`Rep unchanged: ${company.name} -> ${rep.email}`);
        }
      }
    }
    console.log('Done');
  } catch (e) {
    console.error('Error:', e);
    process.exit(1);
  }
}

run();
