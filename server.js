// v9.1 - mergeIntervals for idle fix
const express = require('express');
const XLSX = require('xlsx');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');
const https = require('https');

// Simple in-memory IP info cache
const ipInfoCache = {};
function getIpInfo(ip) {
  if (ipInfoCache[ip]) return Promise.resolve(ipInfoCache[ip]);
  return new Promise(resolve => {
    https.get(`https://ipinfo.io/${ip}/json`, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          const info = { city: j.city||'', region: j.region||'', country: j.country||'', org: (j.org||'').replace(/^AS\d+\s*/,'') };
          ipInfoCache[ip] = info;
          resolve(info);
        } catch { resolve({}); }
      });
    }).on('error', () => resolve({}));
  });
}

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(cors());

const COMPANY = "W-SAFE REINSURANCE";
const PORT = process.env.PORT || 5000;
const DATABASE_URL = process.env.DATABASE_URL;
const IDLE_MIN = 10;
const OFFLINE_MIN = 30;

// -- DB --------------------------------------------------------
const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    client.release();
  }
}

async function initDB() {
  const tables = `
    CREATE TABLE IF NOT EXISTS raw_log (
      id SERIAL PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL,
      event TEXT NOT NULL, username TEXT NOT NULL, computer TEXT NOT NULL,
      serial TEXT DEFAULT 'N/A', ip TEXT DEFAULT 'N/A',
      city TEXT DEFAULT 'N/A', region TEXT DEFAULT 'N/A',
      country TEXT DEFAULT 'IN', lat TEXT DEFAULT 'N/A',
      lon TEXT DEFAULT 'N/A', received_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS app_log (
      id SERIAL PRIMARY KEY, date TEXT NOT NULL, start_time TEXT NOT NULL,
      end_time TEXT NOT NULL, username TEXT NOT NULL, computer TEXT NOT NULL,
      app TEXT NOT NULL, window_title TEXT DEFAULT '',
      duration_sec INTEGER DEFAULT 0, state TEXT DEFAULT 'active',
      received_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vpn_log (
      id SERIAL PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL,
      username TEXT NOT NULL, computer TEXT NOT NULL,
      vpn_on INTEGER DEFAULT 0, software TEXT DEFAULT '',
      adapter TEXT DEFAULT '', received_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS usb_log (
      id SERIAL PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL,
      username TEXT NOT NULL, computer TEXT NOT NULL,
      drive TEXT DEFAULT '', label TEXT DEFAULT '',
      size_gb REAL DEFAULT 0, action TEXT DEFAULT 'connected',
      received_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS disk_log (
      id SERIAL PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL,
      username TEXT NOT NULL, computer TEXT NOT NULL,
      drive TEXT DEFAULT 'C:', total_gb REAL DEFAULT 0,
      used_gb REAL DEFAULT 0, free_gb REAL DEFAULT 0,
      pct_used REAL DEFAULT 0, received_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS browser_log (
      id SERIAL PRIMARY KEY, date TEXT NOT NULL, time TEXT NOT NULL,
      username TEXT NOT NULL, computer TEXT NOT NULL,
      domain TEXT NOT NULL, secs INTEGER DEFAULT 0, received_at TEXT NOT NULL
    );
  `;
  const indexes = [
    "CREATE INDEX IF NOT EXISTS idx_raw_date ON raw_log(date, username)",
    "CREATE INDEX IF NOT EXISTS idx_raw_user ON raw_log(username, computer)",
    "CREATE INDEX IF NOT EXISTS idx_app_date ON app_log(date, username)",
    "CREATE INDEX IF NOT EXISTS idx_app_user ON app_log(username, computer)",
    "CREATE INDEX IF NOT EXISTS idx_browser_user ON browser_log(username, computer, date)",
    "CREATE INDEX IF NOT EXISTS idx_vpn_user ON vpn_log(username, computer, date)",
  ];
  const client = await pool.connect();
  try {
    for (const stmt of tables.split(';').map(s => s.trim()).filter(Boolean)) {
      await client.query(stmt);
    }
    for (const idx of indexes) {
      await client.query(idx);
    }
    await client.query('COMMIT');
    console.log('[DB] PostgreSQL ready');
  } finally {
    client.release();
  }
}

// -- HELPERS ---------------------------------------------------
function nowIST() {
  const now = new Date();
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000);
}
function todayIST() { return nowIST().toISOString().slice(0, 10); }
function timeIST() { return nowIST().toISOString().slice(11, 19); }
function fmtSecs(s) {
  if (!s || s <= 0) return '0h 00m 00s';
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}h ${String(m).padStart(2,'0')}m ${String(sec).padStart(2,'0')}s`;
}
function fmtDec(s) {
  if (!s || s <= 0) return '0.00';
  return (s / 3600).toFixed(2);
}
function parseDuration(d) {
  if (!d) return 0;
  if (typeof d === 'number') return d;
  const m = String(d).match(/^(\d+):(\d+):(\d+)/);
  return m ? parseInt(m[1])*3600 + parseInt(m[2])*60 + parseInt(m[3]) : parseInt(d) || 0;
}

// -- API ROUTES ------------------------------------------------
app.post('/api/event', async (req, res) => {
  try {
    const d = req.body;
    if (!d || !d.username || !d.event) return res.json({ status: 'error', msg: 'missing fields' });
    const now = timeIST();
    const today = todayIST();
    const receivedAt = nowIST().toISOString().slice(0, 19).replace('T', ' ');
    await query(`INSERT INTO raw_log (date,time,event,username,computer,serial,ip,city,region,country,lat,lon,received_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [d.date||today, d.time||now, d.event, d.username, d.computer||'N/A',
       d.serial||'N/A', d.ip||'N/A', d.city||'N/A', d.region||'N/A',
       d.country||'IN', d.lat||'N/A', d.lon||'N/A', receivedAt]);
    res.json({ status: 'ok' });
  } catch(e) { res.status(500).json({ status: 'error', msg: e.message }); }
});

app.post('/api/app_event', async (req, res) => {
  try {
    const d = req.body;
    if (!d || !d.username) return res.json({ status: 'error', msg: 'missing fields' });
    const now = timeIST();
    const today = todayIST();
    const receivedAt = nowIST().toISOString().slice(0, 19).replace('T', ' ');
    const durS = parseDuration(d.duration || d.duration_sec || 0);
    await query(`INSERT INTO app_log (date,start_time,end_time,username,computer,app,window_title,duration_sec,state,received_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [d.date||today, d.start_time||d.time||now, d.end_time||now,
       d.username, d.computer||'N/A', d.app||'unknown',
       d.window_title||'', durS, d.state||'active', receivedAt]);
    res.json({ status: 'ok' });
  } catch(e) { res.status(500).json({ status: 'error', msg: e.message }); }
});

app.post('/api/batch_event', async (req, res) => {
  try {
    const d = req.body;
    const receivedAt = nowIST().toISOString().slice(0, 19).replace('T', ' ');
    const today = todayIST(); const now = timeIST();
    for (const ev of (d.events || [])) {
      await query(`INSERT INTO raw_log (date,time,event,username,computer,serial,ip,city,region,country,lat,lon,received_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
        [ev.date||today, ev.time||now, ev.event, ev.username||d.username, ev.computer||d.computer||'N/A',
         ev.serial||'N/A', ev.ip||'N/A', ev.city||'N/A', ev.region||'N/A',
         ev.country||'IN', ev.lat||'N/A', ev.lon||'N/A', receivedAt]);
    }
    for (const ae of (d.app_events || [])) {
      const durS = parseDuration(ae.duration || ae.duration_sec || 0);
      await query(`INSERT INTO app_log (date,start_time,end_time,username,computer,app,window_title,duration_sec,state,received_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [ae.date||today, ae.start_time||ae.time||now, ae.end_time||now,
         ae.username||d.username, ae.computer||d.computer||'N/A',
         ae.app||'unknown', ae.window_title||'', durS, ae.state||'active', receivedAt]);
    }
    res.json({ status: 'ok' });
  } catch(e) { res.status(500).json({ status: 'error', msg: e.message }); }
});

app.post('/api/heartbeat', async (req, res) => {
  try {
    const d = req.body;
    if (!d || !d.username) return res.json({ status: 'error', msg: 'missing username' });
    const now = timeIST(); const today = todayIST();
    const receivedAt = nowIST().toISOString().slice(0, 19).replace('T', ' ');
    await query(`INSERT INTO raw_log (date,time,event,username,computer,serial,ip,city,region,country,lat,lon,received_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [today, now, 'HEARTBEAT', d.username, d.computer||'N/A',
       d.serial||'N/A', d.ip||'N/A', d.city||'N/A', d.region||'N/A',
       d.country||'IN', 'N/A', 'N/A', receivedAt]);
    if (d.vpn) {
      const v = d.vpn;
      await query(`INSERT INTO vpn_log (date,time,username,computer,vpn_on,software,adapter,received_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [today, now, d.username, d.computer||'N/A',
         v.connected ? 1 : 0, (v.software||[]).join(', '), v.adapter||'', receivedAt]);
    }
    if (d.browser_sites) {
      for (const site of d.browser_sites) {
        if (!site.domain) continue;
        const existing = await query(`SELECT id, secs FROM browser_log WHERE date=$1 AND username=$2 AND computer=$3 AND domain=$4`,
          [today, d.username, d.computer||'N/A', site.domain]);
        if (existing.length > 0) {
          if ((site.secs||0) > existing[0].secs) {
            await query(`UPDATE browser_log SET secs=$1, time=$2, received_at=$3 WHERE id=$4`,
              [site.secs||0, now, receivedAt, existing[0].id]);
          }
        } else {
          await query(`INSERT INTO browser_log (date,time,username,computer,domain,secs,received_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [today, now, d.username, d.computer||'N/A', site.domain, site.secs||0, receivedAt]);
        }
      }
    }
    if (d.disks && Array.isArray(d.disks)) {
      for (const disk of d.disks) {
        await query(`INSERT INTO disk_log (date,time,username,computer,drive,total_gb,used_gb,free_gb,pct_used,received_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [today, now, d.username, d.computer||'N/A', disk.drive||'C:',
           disk.total_gb||0, disk.used_gb||0, disk.free_gb||0, disk.pct_used||0, receivedAt]);
      }
    }
    const known = await query(`SELECT 1 FROM raw_log WHERE username=$1 AND computer=$2 AND date=$3 AND event LIKE 'LOGIN%' LIMIT 1`,
      [d.username, d.computer||'N/A', today]);
    res.json({ status: 'ok', known: known.length > 0 });
  } catch(e) { res.status(500).json({ status: 'error', msg: e.message }); }
});

// Monthly report data builder
async function buildMonthlyReport(month) {
  // month = 'YYYY-MM', default = current month
  const m = month || todayIST().slice(0, 7);
  const emps = await query(`SELECT DISTINCT username, computer FROM app_log WHERE date LIKE $1 ORDER BY username`, [`${m}%`]);
  const report = [];
  for (const { username, computer } of emps) {
    const appRows = await query(`SELECT * FROM app_log WHERE username=$1 AND computer=$2 AND date LIKE $3`, [username, computer, `${m}%`]);
    const rawRows = await query(`SELECT * FROM raw_log WHERE username=$1 AND computer=$2 AND date LIKE $3 ORDER BY date,time`, [username, computer, `${m}%`]);
    const browserRows = await query(`SELECT domain, MAX(secs) as secs FROM browser_log WHERE username=$1 AND computer=$2 AND date LIKE $3 GROUP BY domain ORDER BY secs DESC`, [username, computer, `${m}%`]);

    let serial = 'N/A', ip = 'N/A', location = 'N/A';
    for (const r of rawRows) {
      if (r.serial && r.serial !== 'N/A') serial = r.serial;
      if (r.ip && r.ip.includes('.') && r.ip !== 'N/A') ip = r.ip;
      if (r.city && r.city !== 'N/A') location = `${r.city}, ${r.region||''}`.replace(/,\s*$/, '');
    }

    let activeS = 0;
    const appCtr = {}, workCtr = {}, commsCtr = {}, nonworkCtr = {};
    const socialCtr = {};
    const gmailAccounts = new Set();
    for (const ar of appRows) {
      if ((ar.state||'active').toLowerCase() !== 'active') continue;
      const dur = ar.duration_sec || 0;
      activeS += dur;
      appCtr[ar.app] = (appCtr[ar.app]||0) + dur;
      const cls = classify(ar.app, ar.window_title);
      if (cls === 'work') workCtr[ar.app] = (workCtr[ar.app]||0) + dur;
      else if (cls === 'comms') commsCtr[ar.app] = (commsCtr[ar.app]||0) + dur;
      else nonworkCtr[ar.app] = (nonworkCtr[ar.app]||0) + dur;
      // social from window titles
      const tl = (ar.window_title||'').toLowerCase();
      for (const kw of SOCIAL_KW) {
        if (tl.includes(kw) || (ar.app||'').toLowerCase().includes(kw)) {
          socialCtr[kw] = (socialCtr[kw]||0) + dur; break;
        }
      }
      // gmail accounts
      const isBrowser = ['chrome','firefox','msedge','edge'].some(b=>(ar.app||'').toLowerCase().includes(b));
      if (isBrowser) {
        const matches = (ar.window_title||'').match(EMAIL_RE) || [];
        matches.forEach(e => gmailAccounts.add(e));
      }
    }

    const total = activeS || 1;
    const workPct  = Math.round(Object.values(workCtr).reduce((a,b)=>a+b,0)/total*100);
    const commsPct = Math.round(Object.values(commsCtr).reduce((a,b)=>a+b,0)/total*100);
    const nonworkPct = Math.round(Object.values(nonworkCtr).reduce((a,b)=>a+b,0)/total*100);

    const topApps = Object.entries(appCtr).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([a,s])=>`${friendlyName(a)} (${fmtSecs(s)})`).join(', ');
    const workDetails = Object.entries(workCtr).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([a,s])=>`${friendlyName(a)}: ${fmtSecs(s)}`).join(', ');
    const commsDetails = Object.entries(commsCtr).sort((a,b)=>b[1]-a[1]).slice(0,5)
      .map(([a,s])=>`${friendlyName(a)}: ${fmtSecs(s)}`).join(', ');
    const socialAlerts = Object.entries(socialCtr)
      .map(([k,v])=>`${k}: ${fmtSecs(v)}`).join(', ') || 'None';
    const fileSites = browserRows.filter(s=>[...FILE_SHARING_DOMAINS].some(fd=>s.domain.includes(fd)))
      .map(s=>s.domain).join(', ') || 'None';
    const daysWorked = new Set(appRows.map(r=>r.date)).size;

    report.push({
      'Employee Name': username,
      'System Name': computer,
      'Serial Number': serial,
      'IP Address': ip,
      'Location': location,
      'Days Worked': daysWorked,
      'Total Active Time': fmtSecs(activeS),
      'Top Applications': topApps,
      'Work Details': workDetails,
      'Work %': workPct + '%',
      'Comms Details': commsDetails,
      'Comms %': commsPct + '%',
      'Non-Work %': nonworkPct + '%',
      'Social Media Alerts': socialAlerts,
      'File Sharing Sites': fileSites,
      'Email Accounts Used': [...gmailAccounts].join(', ') || 'N/A',
    });
  }
  return { report, month: m };
}

app.get('/api/report/excel', async (req, res) => {
  try {
    const { report, month } = await buildMonthlyReport(req.query.month);
    const ws = XLSX.utils.json_to_sheet(report);
    // Column widths
    ws['!cols'] = [20,20,16,16,20,10,16,40,40,10,40,10,10,30,30,30].map(w=>({wch:w}));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Report ${month}`);
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', `attachment; filename="EmpMon_Report_${month}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/report/pdf', async (req, res) => {
  try {
    const { report, month } = await buildMonthlyReport(req.query.month);
    const rows = report.map(r => `
      <tr>
        <td>${r['Employee Name']}</td><td>${r['System Name']}</td>
        <td>${r['Serial Number']}</td><td>${r['IP Address']}</td>
        <td>${r['Location']}</td><td>${r['Days Worked']}</td>
        <td>${r['Total Active Time']}</td>
        <td class="work">${r['Work %']}</td>
        <td>${r['Work Details']}</td>
        <td class="comms">${r['Comms %']}</td>
        <td>${r['Comms Details']}</td>
        <td class="red">${r['Non-Work %']}</td>
        <td class="red">${r['Social Media Alerts']}</td>
        <td class="orange">${r['File Sharing Sites']}</td>
        <td>${r['Email Accounts Used']}</td>
      </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>EmpMon Report ${month}</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:10px;margin:20px}
      h2{font-size:14px;margin-bottom:4px} .sub{font-size:11px;color:#555;margin-bottom:12px}
      table{border-collapse:collapse;width:100%}
      th{background:#1c2128;color:#fff;padding:6px 8px;text-align:left;font-size:10px;white-space:nowrap}
      td{padding:5px 8px;border-bottom:1px solid #e0e0e0;vertical-align:top;max-width:150px;word-break:break-word}
      tr:nth-child(even){background:#f9f9f9}
      .work{color:#2d9e4f;font-weight:700}.comms{color:#1a6fc4;font-weight:700}
      .red{color:#c0392b}.orange{color:#d35400}
      @media print{body{margin:0}@page{size:A3 landscape;margin:10mm}}
    </style></head><body>
    <h2>📊 ${COMPANY} — Monthly Activity Report</h2>
    <div class="sub">Period: ${month} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</div>
    <table>
      <thead><tr>
        <th>Employee</th><th>System</th><th>Serial</th><th>IP</th><th>Location</th>
        <th>Days</th><th>Active Time</th>
        <th>Work%</th><th>Work Details</th>
        <th>Comms%</th><th>Comms Details</th>
        <th>Non-Work%</th><th>Social Media</th><th>File Sharing</th><th>Email Accounts</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <script>window.onload=()=>window.print()</script>
    </body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/status', (req, res) => res.json({ status: 'ok', server: COMPANY, version: '9.0' }));

app.get('/api/summary', async (req, res) => {
  try {
    const data = await getAllEmployeesToday();
    res.json({ generated: nowIST().toISOString(), ...data });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/delete_employee', async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'username required' });
    await query('DELETE FROM raw_log WHERE username=$1', [username]);
    await query('DELETE FROM app_log WHERE username=$1', [username]);
    await query('DELETE FROM browser_log WHERE username=$1', [username]);
    await query('DELETE FROM vpn_log WHERE username=$1', [username]);
    await query('DELETE FROM disk_log WHERE username=$1', [username]);
    res.json({ status: 'ok', deleted: username });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/clear_all', async (req, res) => {
  try {
    await query('DELETE FROM raw_log');
    await query('DELETE FROM app_log');
    await query('DELETE FROM browser_log');
    res.json({ status: 'ok' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// -- DATA BUILDERS ---------------------------------------------
function mergeIntervals(rows, stateFilter = 'active') {
  const intervals = rows
    .filter(r => (r.state||'active').toLowerCase() === stateFilter && r.start_time)
    .map(r => {
      const s = r.start_time.slice(0,8);
      const dur = r.duration_sec || 0;
      const startSec = parseInt(s.slice(0,2))*3600 + parseInt(s.slice(3,5))*60 + parseInt(s.slice(6,8)||0);
      return [startSec, startSec + dur];
    })
    .sort((a,b) => a[0]-b[0]);
  let merged = 0, cur = null;
  for (const [s,e] of intervals) {
    if (!cur) { cur = [s,e]; continue; }
    if (s <= cur[1]) { cur[1] = Math.max(cur[1], e); }
    else { merged += cur[1]-cur[0]; cur = [s,e]; }
  }
  if (cur) merged += cur[1]-cur[0];
  return merged;
}
const SOCIAL_DOMAINS = new Set([
  'instagram.com','facebook.com','twitter.com','x.com','tiktok.com',
  'snapchat.com','youtube.com','reddit.com','netflix.com','hotstar.com',
  'spotify.com','discord.com','telegram.org','whatsapp.com','threads.net',
  'linkedin.com','pinterest.com','tumblr.com'
]);
const SOCIAL_KW = ['instagram','facebook','whatsapp','youtube','tiktok',
  'snapchat','twitter','reddit','netflix','spotify','discord','telegram'];
const FILE_SHARING_DOMAINS = new Set([
  'drive.google.com','dropbox.com','wetransfer.com','onedrive.live.com',
  'sharepoint.com','box.com','mega.nz','mediafire.com','4shared.com',
  'files.google.com','docs.google.com','sheets.google.com','slides.google.com'
]);
const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.]+/g;

async function getAllEmployeesToday() {
  const today = todayIST();
  // Include employees who have app_log today even if raw_log login event is missing (after data clear)
  const emps = await query(`
    SELECT DISTINCT username, computer FROM (
      SELECT username, computer FROM raw_log WHERE date=$1
      UNION
      SELECT username, computer FROM app_log WHERE date=$1
    ) t ORDER BY username
  `, [today]);
  const rows = [];
  let online = 0, idle = 0, offline = 0, totalActive = 0;

  for (const emp of emps) {
    const { username, computer } = emp;
    const todayRaw = await query(`SELECT * FROM raw_log WHERE username=$1 AND computer=$2 AND date=$3 ORDER BY time`, [username, computer, today]);
    const appRows = await query(`SELECT * FROM app_log WHERE username=$1 AND computer=$2 AND date=$3`, [username, computer, today]);
    const browserRows = await query(`SELECT domain, MAX(secs) as secs FROM browser_log WHERE username=$1 AND computer=$2 AND date=$3 GROUP BY domain ORDER BY secs DESC LIMIT 10`, [username, computer, today]);
    const vpnRow = await query(`SELECT * FROM vpn_log WHERE username=$1 AND computer=$2 ORDER BY date DESC, time DESC LIMIT 1`, [username, computer]);

    let firstLogin = '--', lastEvent = '--', lastShutdown = '--';
    let lastEventDt = null, serial = 'N/A', location = 'N/A', ip = 'N/A';

    for (const r of todayRaw) {
      const ev = r.event.toUpperCase();
      if (ev.includes('LOGIN') && !ev.includes('LOGOUT') && firstLogin === '--') firstLogin = r.time;
      lastEvent = r.time;
      if (ev.includes('LOGOUT') || ev.includes('SHUTDOWN')) lastShutdown = r.time;
      if (r.serial && r.serial !== 'N/A') serial = r.serial;
      if (r.city && r.city !== 'N/A') location = `${r.city}, ${r.region||''}`.replace(/,\s*$/, '');
      if (r.ip && r.ip.includes('.') && r.ip !== 'N/A') ip = r.ip;
      try { lastEventDt = new Date(`${today}T${r.time}`); } catch {}
    }
    // Fallback: infer login from first app event if no raw login event
    if (firstLogin === '--' && appRows.length > 0) {
      const sorted = [...appRows].sort((a,b)=>(a.start_time||'').localeCompare(b.start_time||''));
      if (sorted[0]?.start_time) firstLogin = sorted[0].start_time.slice(0,5);
    }

    // Also use latest app_log entry time for status when raw_log events are missing
    let lastAppDt = null;
    if (appRows.length > 0) {
      const sorted = [...appRows].sort((a,b)=>(b.end_time||b.start_time||'').localeCompare(a.end_time||a.start_time||''));
      const latestTime = sorted[0]?.end_time || sorted[0]?.start_time;
      if (latestTime) try { lastAppDt = new Date(`${today}T${latestTime}`); } catch {}
    }
    const effectiveDt = lastEventDt && lastAppDt
      ? (lastEventDt > lastAppDt ? lastEventDt : lastAppDt)
      : (lastEventDt || lastAppDt);

    let status = 'Offline';
    if (effectiveDt) {
      const minsAgo = (nowIST() - effectiveDt) / 60000;
      const lastEv = todayRaw.length ? todayRaw[todayRaw.length-1].event.toUpperCase() : '';
      if (['LOGOUT(SHUTDOWN)','LOGOUT(LOGOFF)','LOGOUT(LOCK)','LOGOUT(SCREEN-OFF)'].includes(lastEv)) {
        status = 'Offline';
      } else if (lastEv === 'LOGOUT(IDLE)') {
        status = 'Idle';
      } else if (minsAgo > OFFLINE_MIN) {
        status = 'Offline';
      } else if (minsAgo > IDLE_MIN) {
        status = 'Idle';
      } else {
        status = 'Online';
      }
    }

    if (status === 'Online') online++;
    else if (status === 'Idle') idle++;
    else offline++;

    let idleS = 0, workS = 0, commsS = 0, nonworkS = 0;
    const appCtr = {};
    let lockCount = 0, unlockCount = 0, firstLock = '--', lastUnlock = '--';
    for (const r of todayRaw) {
      const ev = r.event.toUpperCase();
      if (ev === 'LOCK') { lockCount++; if (firstLock === '--') firstLock = r.time.slice(0,5); }
      if (ev === 'UNLOCK') { unlockCount++; lastUnlock = r.time.slice(0,5); }
    }
    // Use mergeIntervals to avoid inflated times from duplicate agent instances
    const activeS = mergeIntervals(appRows, 'active');
    const idleS = mergeIntervals(appRows, 'idle');
    for (const ar of appRows) {
      const dur = ar.duration_sec || 0;
      const st = (ar.state || 'active').toLowerCase();
      if (st === 'active') {
        appCtr[ar.app] = (appCtr[ar.app]||0) + dur;
        const cat = classify(ar.app, ar.window_title);
        if (cat === 'work') workS += dur;
        else if (cat === 'comms') commsS += dur;
        else nonworkS += dur;
      }
    }
    totalActive += activeS;
    const _catTotal = workS + commsS + nonworkS;
    const workPct  = _catTotal ? Math.round(workS/_catTotal*100) : 0;
    const commsPct = _catTotal ? Math.round(commsS/_catTotal*100) : 0;
    const nonworkPct = _catTotal ? Math.round(nonworkS/_catTotal*100) : 0;
    const top5 = Object.entries(appCtr).sort((a,b) => b[1]-a[1]).slice(0,5)
      .map(([app, dur]) => ({ app: friendlyName(app), dur: fmtSecs(dur) }));

    const topSites = browserRows.map(r => ({ domain: r.domain, secs: r.secs }));
    const socialSites = topSites.filter(s => [...SOCIAL_DOMAINS].some(sd => s.domain.includes(sd)));
    const fileSharingSites = topSites.filter(s => [...FILE_SHARING_DOMAINS].some(fd => s.domain.includes(fd)));
    // Also check window titles
    if (!socialSites.length) {
      for (const ar of appRows) {
        const tl = (ar.window_title || '').toLowerCase();
        if (SOCIAL_KW.some(k => tl.includes(k))) { socialSites.push({ domain: 'detected-via-title' }); break; }
      }
    }

    const vpn = vpnRow[0];
    rows.push({
      username, computer, serial, status, firstLogin,
      lastShutdown, lastEvent, location, ip,
      activeToday: fmtSecs(activeS), idleToday: fmtSecs(idleS),
      activeSecs: activeS,
      top5, topSites, socialSites, fileSharingSites,
      vpnOn: vpn ? !!vpn.vpn_on : false,
      vpnSoftware: vpn ? vpn.software : '',
      workSecs: workS, commsSecs: commsS, nonworkSecs: nonworkS,
      workPct, commsPct, nonworkPct,
      workTime: fmtSecs(workS), commsTime: fmtSecs(commsS), nonworkTime: fmtSecs(nonworkS),
      lockCount, unlockCount, firstLock, lastUnlock,
    });
  }

  rows.sort((a,b) => {
    const order = { Online:0, Idle:1, Offline:2 };
    return (order[a.status]||3) - (order[b.status]||3) || a.username.localeCompare(b.username);
  });
  return { employees: rows, online, idle, offline, total: rows.length, totalActive: fmtSecs(totalActive) };
}

function friendlyName(app) {
  if (!app) return 'Unknown';
  const map = {
    'chrome':'Chrome','msedge':'Edge','firefox':'Firefox','opera':'Opera','brave':'Brave',
    'excel':'Excel','winword':'Word','powerpnt':'PowerPoint','onenote':'OneNote','access':'Access',
    'outlook':'Outlook','teams':'Teams','zoom':'Zoom','skype':'Skype','webex':'Webex',
    'sap':'SAP','code':'VS Code','notepad':'Notepad','explorer':'File Explorer',
    'acrobat':'Acrobat','photoshop':'Photoshop','vlc':'VLC','slack':'Slack',
  };
  const low = app.toLowerCase().replace('.exe','');
  for (const [k,v] of Object.entries(map)) if (low.includes(k)) return v;
  return app.replace('.exe','').split(/[\s_-]/).map(w => w[0]?.toUpperCase()+w.slice(1)).join(' ');
}

const WORK_KEYS = ['sap','excel','winword','powerpnt','outlook','onenote','acrobat','notepad',
  'code','teams','zoom','webex','skype','slack','explorer','access'];
const COMMS_KEYS = ['teams','outlook','zoom','skype','webex','slack','thunderbird','telegram','discord'];
// Social apps as standalone desktop apps (WhatsApp.exe, Instagram UWP, etc.)
const SOCIAL_APP_KEYS = ['instagram','facebook','whatsapp','tiktok','snapchat','twitter',
  'netflix','spotify','hotstar','reddit','youtube'];
const SOCIAL_KW_LIST = [...SOCIAL_APP_KEYS, 'discord','telegram'];

function classify(app, title) {
  const al = (app||'').toLowerCase();
  const tl = (title||'').toLowerCase();
  // Check social app name first (WhatsApp.exe, Instagram.exe, etc.)
  if (SOCIAL_APP_KEYS.some(k => al.includes(k))) return 'nonwork';
  // Also check window title for social keywords (handles ApplicationFrameHost.exe / UWP)
  if (SOCIAL_APP_KEYS.some(k => tl.includes(k))) return 'nonwork';
  for (const k of COMMS_KEYS) if (al.includes(k)) return 'comms';
  const isBrowser = ['chrome','firefox','msedge','edge','opera','brave'].some(b => al.includes(b));
  if (isBrowser) {
    if (['gmail','google meet','teams','zoom','outlook','webex','skype'].some(k => tl.includes(k))) return 'comms';
    if (SOCIAL_KW_LIST.some(k => tl.includes(k))) return 'nonwork';
    return 'work';
  }
  for (const k of WORK_KEYS) if (al.includes(k)) return 'work';
  return 'work';
}

async function getEmployeeDetail(username, computer, forDate) {
  const today = forDate || todayIST();
  const thisMonth = today.slice(0, 7);

  const todayRaw = await query(`SELECT * FROM raw_log WHERE username=$1 AND computer=$2 AND date=$3 ORDER BY time`, [username, computer, today]);
  // Deduplicate app_log: if multiple agents running, same app+start_time gets sent multiple times — take one row per app+start_time
  const appRows = await query(`SELECT DISTINCT ON (app, start_time, window_title) * FROM app_log WHERE username=$1 AND computer=$2 AND date=$3 ORDER BY app, start_time, window_title, id DESC`, [username, computer, today]);
  const diskRows = await query(`SELECT drive, MAX(total_gb) as total_gb, MAX(used_gb) as used_gb, MAX(free_gb) as free_gb, MAX(pct_used) as pct_used FROM disk_log WHERE username=$1 AND computer=$2 AND date=$3 GROUP BY drive ORDER BY drive`, [username, computer, today]);
  const browserLogSites = await query(`SELECT domain, MAX(secs) as secs FROM browser_log WHERE username=$1 AND computer=$2 AND date=$3 GROUP BY domain ORDER BY secs DESC LIMIT 15`, [username, computer, today]);

  // Also extract domains from browser window titles in app_log (fallback for open tabs)
  const titleDomains = {};
  for (const ar of (await query(`SELECT window_title, SUM(duration_sec) as dur FROM app_log WHERE username=$1 AND computer=$2 AND date=$3 AND (app ILIKE '%chrome%' OR app ILIKE '%edge%' OR app ILIKE '%firefox%' OR app ILIKE '%opera%' OR app ILIKE '%brave%') GROUP BY window_title`, [username, computer, today]))) {
    const title = ar.window_title || '';
    // Extract domain from title patterns like "Page Title - site.com - Browser" or "site.com - Browser"
    const domainMatch = title.match(/[-–]\s*([\w.-]+\.[a-z]{2,})\s*[-–]/i) ||
                        title.match(/([\w.-]+\.(com|org|net|io|co|in|gov|edu|sharepoint|onmicrosoft)[\w.]*)/i);
    if (domainMatch) {
      let domain = domainMatch[1].toLowerCase().replace(/^www\./, '');
      titleDomains[domain] = (titleDomains[domain]||0) + (ar.dur||0);
    }
  }
  // Merge browser_log + title-extracted domains
  const merged = {};
  for (const s of browserLogSites) merged[s.domain] = Math.max(merged[s.domain]||0, s.secs||1);
  for (const [d,s] of Object.entries(titleDomains)) if (!merged[d]) merged[d] = s;
  const browserSites = Object.entries(merged).sort((a,b)=>b[1]-a[1]).slice(0,15)
    .map(([domain,secs])=>({ domain, secs }));
  const monthRaw = await query(`SELECT * FROM raw_log WHERE username=$1 AND computer=$2 AND date LIKE $3 ORDER BY date,time`, [username, computer, `${thisMonth}%`]);
  const monthApp = await query(`SELECT * FROM app_log WHERE username=$1 AND computer=$2 AND date LIKE $3`, [username, computer, `${thisMonth}%`]);

  let firstLogin = '--', lastShutdown = '--', serial = 'N/A', location = 'N/A', ip = 'N/A';
  const lockTimes = [], unlockTimes = [], loginTimes = [], shutdownTimes = [];
  for (const r of todayRaw) {
    const ev = r.event.toUpperCase();
    const t = (r.time||'').slice(0,5);
    if (ev.includes('LOGIN') && !ev.includes('LOGOUT')) {
      if (firstLogin === '--') firstLogin = r.time;
      if (t) loginTimes.push(t);
    }
    if (ev.includes('SHUTDOWN') || (ev.includes('LOGOUT') && !ev.includes('LOCK') && !ev.includes('IDLE'))) {
      lastShutdown = r.time;
      if (t) shutdownTimes.push(t);
    }
    if (ev.includes('LOCK') && !ev.includes('UNLOCK') && t) lockTimes.push(t);
    if (ev.includes('UNLOCK') && t) unlockTimes.push(t);
    if (r.serial && r.serial !== 'N/A') serial = r.serial;
    if (r.city && r.city !== 'N/A') location = `${r.city}, ${r.region||''}`.replace(/,\s*$/, '');
    if (r.ip && r.ip.includes('.') && r.ip !== 'N/A') ip = r.ip;
  }
  // Fallback: infer login from first app event if raw login event missing
  if (firstLogin === '--' && appRows.length > 0) {
    const firstApp = appRows[0];
    const t = (firstApp.start_time||'').slice(0,5);
    if (t) { firstLogin = firstApp.start_time; loginTimes.push(t + ' (est)'); }
  }
  // Always check last app activity — if it's 30+ min after last recorded shutdown, add estimated final shutdown
  if (appRows.length > 0) {
    const sorted = [...appRows].sort((a,b) => (b.end_time||b.start_time||'').localeCompare(a.end_time||a.start_time||''));
    const lastEndTime = sorted[0]?.end_time || sorted[0]?.start_time;
    if (lastEndTime) {
      const lastAppMins = parseInt(lastEndTime.slice(0,2))*60 + parseInt(lastEndTime.slice(3,5));
      const lastShutMins = shutdownTimes.length > 0
        ? (() => { const s = shutdownTimes[shutdownTimes.length-1].replace(' (est)','').replace(' (prev day)',''); return parseInt(s.slice(0,2))*60 + parseInt(s.slice(3,5)); })()
        : -999;
      if (lastAppMins - lastShutMins > 30) {
        const t = lastEndTime.slice(0,5);
        if (t) { lastShutdown = lastEndTime; shutdownTimes.push(t + ' (est)'); }
      }
    }
  }

  const activeS = mergeIntervals(appRows, 'active');
  const idleS = mergeIntervals(appRows, 'idle');
  const appCtr = {}, socialCtr = {};
  // workTitles[title] = { secs, app }, same for commsTitles, nonworkTitles
  const workTitles = {}, commsTitles = {}, nonworkTitles = {};
  const workCtr = {}, commsCtr = {}, nonworkCtr = {};
  for (const ar of appRows) {
    const dur = ar.duration_sec || 0;
    const st = (ar.state || 'active').toLowerCase();
    const tl = (ar.window_title || '').toLowerCase();
    if (st === 'active') {
      appCtr[ar.app] = (appCtr[ar.app]||0) + dur;
      const cls = classify(ar.app, ar.window_title);
      const titleKey = (ar.window_title || ar.app || '').trim();
      if (cls === 'work') {
        workCtr[ar.app] = (workCtr[ar.app]||0) + dur;
        if (titleKey) { workTitles[titleKey] = (workTitles[titleKey]||{secs:0,app:ar.app}); workTitles[titleKey].secs += dur; }
      } else if (cls === 'comms') {
        commsCtr[ar.app] = (commsCtr[ar.app]||0) + dur;
        if (titleKey) { commsTitles[titleKey] = (commsTitles[titleKey]||{secs:0,app:ar.app}); commsTitles[titleKey].secs += dur; }
      } else {
        nonworkCtr[ar.app] = (nonworkCtr[ar.app]||0) + dur;
        if (titleKey) { nonworkTitles[titleKey] = (nonworkTitles[titleKey]||{secs:0,app:ar.app}); nonworkTitles[titleKey].secs += dur; }
      }
      for (const kw of SOCIAL_KW) {
        if (tl.includes(kw) || (ar.app||'').toLowerCase().includes(kw)) {
          socialCtr[kw] = (socialCtr[kw]||0) + dur; break;
        }
      }
    }
  }

  const topApps = Object.entries(appCtr).sort((a,b)=>b[1]-a[1]).slice(0,10)
    .map(([app,dur]) => ({ app: friendlyName(app), dur: fmtSecs(dur), secs: dur }));
  // Social from window titles / app names
  const socialFromTitles = Object.entries(socialCtr).map(([k,v]) => ({ site: k, dur: fmtSecs(v), secs: v }));
  // Social from browser history domains (catches WhatsApp Web, Instagram Web, etc.)
  const socialFromBrowser = browserSites
    .filter(s => [...SOCIAL_DOMAINS].some(sd => (s.domain||'').includes(sd)))
    .map(s => ({ site: s.domain, dur: fmtSecs(s.secs||1), secs: s.secs||1 }));
  // Merge both, deduplicate by site name
  const socialMerged = {};
  for (const x of [...socialFromTitles, ...socialFromBrowser]) {
    if (!socialMerged[x.site] || x.secs > socialMerged[x.site].secs) socialMerged[x.site] = x;
  }
  const socialAlerts = Object.values(socialMerged).sort((a,b) => b.secs - a.secs);

  // Gmail accounts from window titles
  const gmailAccounts = {};
  for (const ar of appRows) {
    const isBrowser = ['chrome','firefox','msedge','edge','opera','brave'].some(b=>(ar.app||'').toLowerCase().includes(b));
    if (!isBrowser) continue;
    const tl = ar.window_title || '';
    const matches = tl.match(EMAIL_RE) || [];
    for (const email of matches) {
      if (email.includes('gmail') || email.includes('google') || tl.toLowerCase().includes('gmail')) {
        gmailAccounts[email] = (gmailAccounts[email]||0) + (ar.duration_sec||0);
      } else {
        gmailAccounts[email] = (gmailAccounts[email]||0) + (ar.duration_sec||0);
      }
    }
  }
  const gmailList = Object.entries(gmailAccounts).sort((a,b)=>b[1]-a[1])
    .map(([email,s]) => ({ email, dur: fmtSecs(s), secs: s }));

  // File sharing sites from browser_log
  const fileSharingSites = browserSites.filter(s =>
    [...FILE_SHARING_DOMAINS].some(fd => (s.domain||'').includes(fd))
  ).map(s => ({ domain: s.domain, dur: fmtSecs(s.secs||1), secs: s.secs||1 }));

  // Most used browser tabs (top window titles from browser apps)
  const tabCtr = {};
  for (const ar of appRows) {
    const isBrowser = ['chrome','firefox','msedge','edge','opera','brave'].some(b=>(ar.app||'').toLowerCase().includes(b));
    if (!isBrowser || !ar.window_title) continue;
    const title = (ar.window_title||'').replace(/ - Google Chrome| - Microsoft Edge| - Mozilla Firefox/i,'').trim();
    if (title && title.toLowerCase() !== '(no title)') {
      tabCtr[title] = (tabCtr[title]||0) + (ar.duration_sec||0);
    }
  }
  const topTabs = Object.entries(tabCtr).sort((a,b)=>b[1]-a[1]).slice(0,10)
    .map(([title,s]) => ({ title, dur: fmtSecs(s), secs: s }));

  const totalActiveS = activeS || 1;
  // App-level summary (for percentages on dashboard)
  const workApps = Object.entries(workCtr).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([app,s]) => ({ app: friendlyName(app), dur: fmtSecs(s), secs: s, pct: Math.round(s/totalActiveS*100) }));
  const commsApps = Object.entries(commsCtr).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([app,s]) => ({ app: friendlyName(app), dur: fmtSecs(s), secs: s, pct: Math.round(s/totalActiveS*100) }));
  const nonworkApps = Object.entries(nonworkCtr).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .map(([app,s]) => ({ app: friendlyName(app), dur: fmtSecs(s), secs: s, pct: Math.round(s/totalActiveS*100) }));
  // Window-title level (ActivityWatch-style document/email list)
  const workTitleList = Object.entries(workTitles).sort((a,b)=>b[1].secs-a[1].secs).slice(0,15)
    .map(([title,v]) => ({ title, app: friendlyName(v.app), dur: fmtSecs(v.secs), secs: v.secs, pct: Math.round(v.secs/totalActiveS*100) }));
  const commsTitleList = Object.entries(commsTitles).sort((a,b)=>b[1].secs-a[1].secs).slice(0,15)
    .map(([title,v]) => ({ title, app: friendlyName(v.app), dur: fmtSecs(v.secs), secs: v.secs, pct: Math.round(v.secs/totalActiveS*100) }));
  const nonworkTitleList = Object.entries(nonworkTitles).sort((a,b)=>b[1].secs-a[1].secs).slice(0,10)
    .map(([title,v]) => ({ title, app: friendlyName(v.app), dur: fmtSecs(v.secs), secs: v.secs, pct: Math.round(v.secs/totalActiveS*100) }));

  // Monthly stats
  const daysWorked = new Set();
  for (const ar of monthApp) {
    if ((ar.state||'active').toLowerCase() === 'active') daysWorked.add(ar.date);
  }
  let monthActiveS = 0;
  for (const ds of daysWorked) {
    monthActiveS += mergeIntervals(monthApp.filter(r => r.date === ds));
  }

  // Calendar (last 30 days) + IP history with ISP lookup
  const cal = [];
  const ipHistory = {};
  const allIps = new Set();
  for (const r of monthRaw) {
    if (r.ip && r.ip !== 'N/A' && r.ip.includes('.')) {
      if (!ipHistory[r.date]) ipHistory[r.date] = new Set();
      ipHistory[r.date].add(r.ip);
      allIps.add(r.ip);
    }
  }
  // Fetch ISP info for all unique IPs in parallel
  const ipInfoMap = {};
  await Promise.all([...allIps].map(async ip => { ipInfoMap[ip] = await getIpInfo(ip); }));
  const MOBILE_ISP_KEYS = ['jio','vodafone','idea','vi mobile','airtel mobile','bsnl mobile','tata docomo','reliance mobile','uninor','telenor'];
  function detectConnectionType(org='') {
    const o = org.toLowerCase();
    if (MOBILE_ISP_KEYS.some(k => o.includes(k))) return 'mobile';
    return 'broadband';
  }
  for (let i = 29; i >= 0; i--) {
    const d = new Date(nowIST()); d.setDate(d.getDate() - i);
    const ds = d.toISOString().slice(0,10);
    const dayAppRows = monthApp.filter(r => r.date === ds);
    const dayActive = mergeIntervals(dayAppRows);
    let dayIdle = 0;
    for (const ar of dayAppRows) {
      if ((ar.state||'active').toLowerCase() !== 'active') dayIdle += ar.duration_sec||0;
    }
    const dayRaw = monthRaw.filter(r => r.date === ds);
    const login = dayRaw.find(r => r.event.toUpperCase().includes('LOGIN') && !r.event.toUpperCase().includes('LOGOUT'));
    const logout = dayRaw.filter(r => r.event.toUpperCase().includes('LOGOUT') && r.event.toUpperCase().includes('SHUTDOWN')).pop();
    const dayLocation = dayRaw.find(r => r.city && r.city !== 'N/A');
    cal.push({
      date: ds,
      day: d.toLocaleDateString('en-IN', { weekday:'short', day:'2-digit' }),
      active: fmtSecs(dayActive),
      idle: fmtSecs(dayIdle),
      dec: fmtDec(dayActive),
      login: login ? login.time.slice(0,5) : '--',
      logout: logout ? logout.time.slice(0,5) : '--',
      worked: dayActive > 0,
      ips: ipHistory[ds] ? [...ipHistory[ds]].map(ip => ({ ip, isp: ipInfoMap[ip]?.org||'', city: ipInfoMap[ip]?.city||'', country: ipInfoMap[ip]?.country||'', type: detectConnectionType(ipInfoMap[ip]?.org||'') })) : [],
      location: dayLocation ? `${dayLocation.city}, ${dayLocation.region||''}`.replace(/,\s*$/,'') : '',
    });
  }

  return {
    username, computer, serial, location, ip, viewDate: today,
    firstLogin, lastShutdown, loginTimes, shutdownTimes, lockTimes, unlockTimes,
    activeToday: fmtSecs(activeS), idleToday: fmtSecs(idleS),
    workPct: (() => { const w=Object.values(workCtr).reduce((a,b)=>a+b,0),c=Object.values(commsCtr).reduce((a,b)=>a+b,0),n=Object.values(nonworkCtr).reduce((a,b)=>a+b,0),t=w+c+n; return t>0?Math.round(w/t*100):0; })(),
    commsPct: (() => { const w=Object.values(workCtr).reduce((a,b)=>a+b,0),c=Object.values(commsCtr).reduce((a,b)=>a+b,0),n=Object.values(nonworkCtr).reduce((a,b)=>a+b,0),t=w+c+n; return t>0?Math.round(c/t*100):0; })(),
    nonworkPct: (() => { const w=Object.values(workCtr).reduce((a,b)=>a+b,0),c=Object.values(commsCtr).reduce((a,b)=>a+b,0),n=Object.values(nonworkCtr).reduce((a,b)=>a+b,0),t=w+c+n; return t>0?Math.round(n/t*100):0; })(),
    topApps, workApps, commsApps, nonworkApps,
    workTitleList, commsTitleList, nonworkTitleList,
    socialAlerts, fileSharingSites, gmailList, topTabs, browserSites, diskInfo: diskRows,
    daysWorked: daysWorked.size,
    monthActive: fmtSecs(monthActiveS),
    monthActiveDec: fmtDec(monthActiveS),
    cal,
    appTimeline: appRows.map(ar => ({
      time: ar.start_time, app: friendlyName(ar.app),
      dur: ar.duration_sec||0, state: ar.state||'active',
      title: ar.window_title||''
    })),
  };
}

// -- API DATA ENDPOINTS ----------------------------------------
app.post('/api/deduplicate', async (req, res) => {
  try {
    // Delete duplicate app_log rows — keep only lowest id per (username,computer,date,app,start_time,window_title)
    const r1 = await query(`
      DELETE FROM app_log WHERE id NOT IN (
        SELECT MIN(id) FROM app_log
        GROUP BY username, computer, date, app, start_time, window_title
      )
    `);
    // Delete duplicate raw_log rows — keep only lowest id per (username,computer,date,time,event)
    const r2 = await query(`
      DELETE FROM raw_log WHERE id NOT IN (
        SELECT MIN(id) FROM raw_log
        GROUP BY username, computer, date, time, event
      )
    `);
    res.json({ status: 'ok', app_deleted: r1.rowCount||0, raw_deleted: r2.rowCount||0 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/debug/latest', async (req, res) => {
  try {
    const today = todayIST();
    const raw = await query(`SELECT username, computer, date, time, event FROM raw_log ORDER BY date DESC, time DESC LIMIT 20`);
    const app = await query(`SELECT username, computer, date, start_time, app FROM app_log ORDER BY date DESC, start_time DESC LIMIT 20`);
    res.json({ today, raw: raw.rows||raw, app: app.rows||app });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard', async (req, res) => {
  try { res.json(await getAllEmployeesToday()); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/employee/:username/:computer', async (req, res) => {
  try { res.json(await getEmployeeDetail(req.params.username, req.params.computer, req.query.date || null)); }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/daily', async (req, res) => {
  try {
    const today = todayIST();
    const emps = await query(`SELECT DISTINCT username, computer FROM raw_log WHERE date=$1 ORDER BY username`, [today]);
    const result = [];
    for (const { username, computer } of emps) {
      const events = await query(`SELECT time, event FROM raw_log WHERE date=$1 AND username=$2 AND computer=$3 ORDER BY time`, [today, username, computer]);
      const appRows = await query(`SELECT start_time, duration_sec, state, app FROM app_log WHERE date=$1 AND username=$2 AND computer=$3 ORDER BY start_time`, [today, username, computer]);
      let loginT = null, logoutT = null;
      const locks = [], unlocks = [];
      for (const ev of events) {
        const eu = ev.event.toUpperCase();
        if (eu.includes('LOGIN') && !eu.includes('LOGOUT') && !loginT) loginT = ev.time.slice(0,5);
        if (eu.includes('LOGOUT') && (eu.includes('SHUTDOWN') || eu.includes('LOGOFF'))) logoutT = ev.time.slice(0,5);
        if (eu === 'LOCK') locks.push(ev.time.slice(0,5));
        if (eu === 'UNLOCK') unlocks.push(ev.time.slice(0,5));
      }
      const pct = t => { if (!t) return null; const [h,m] = t.split(':').map(Number); return +((h*60+m)/1440*100).toFixed(3); };
      let totalActive = 0, totalIdle = 0;
      const segments = appRows.map(ar => {
        const dur = ar.duration_sec||0;
        const st = (ar.state||'active').toLowerCase();
        const left = pct(ar.start_time);
        if (left === null) return null;
        const width = Math.min(+(dur/86400*100).toFixed(3), 100-left);
        if (width < 0.01) return null;
        if (st === 'active') totalActive += dur; else totalIdle += dur;
        return { left, width, cls: st === 'active' ? 'active' : 'idle', app: friendlyName(ar.app) };
      }).filter(Boolean);

      result.push({
        username, computer, loginT, logoutT,
        loginPct: pct(loginT), logoutPct: pct(logoutT),
        locks: locks.map(t => ({ t, pct: pct(t) })),
        unlocks: unlocks.map(t => ({ t, pct: pct(t) })),
        segments, totalActive: fmtSecs(totalActive), totalIdle: fmtSecs(totalIdle),
        totalSession: fmtSecs(loginT && logoutT ? Math.round((pct(logoutT)-pct(loginT))/100*86400) : totalActive+totalIdle),
      });
    }
    res.json({ today, employees: result });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const today = todayIST();
    const emps = await query(`SELECT DISTINCT username, computer FROM raw_log WHERE date=$1 ORDER BY username`, [today]);
    const alerts = [], clean = [];
    for (const { username, computer } of emps) {
      const sites = await query(`SELECT domain, MAX(secs) as secs FROM browser_log WHERE username=$1 AND computer=$2 AND date=$3 GROUP BY domain`, [username, computer, today]);
      const social = sites.filter(s => [...SOCIAL_DOMAINS].some(sd => s.domain.includes(sd)));
      if (social.length) alerts.push({ username, computer, sites: social.map(s => ({ domain: s.domain, dur: fmtSecs(s.secs||1), secs: s.secs||1 })) });
      else clean.push(username);
    }
    res.json({ today, alerts, clean });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/debug/idle/:username/:computer', async (req, res) => {
  try {
    const today = todayIST();
    const rows = await query(`SELECT state, start_time, duration_sec FROM app_log WHERE username=$1 AND computer=$2 AND date=$3 ORDER BY start_time`, [req.params.username, req.params.computer, today]);
    const idleRows = rows.filter(r => (r.state||'active').toLowerCase() === 'idle');
    const merged = mergeIntervals(rows, 'idle');
    res.json({ total_idle_rows: idleRows.length, merged_idle_secs: merged, idle_rows: idleRows.slice(0,50) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/version', (req, res) => res.json({ version: 'v9.1-idle-fix', ts: Date.now() }));

// -- SERVE REACT -----------------------------------------------
const clientBuild = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

// -- START -----------------------------------------------------
if (!DATABASE_URL) {
  console.error('[DB] Init failed: DATABASE_URL environment variable is not set!');
  process.exit(1);
}

initDB().then(() => {
  app.listen(PORT, () => console.log(`[Server] EmpMon V9 running on port ${PORT}`));
}).catch(e => { console.error('[DB] Init failed:', e.message || String(e)); process.exit(1); });
