const fs = require('fs');
const https = require('https');

const contacts = JSON.parse(fs.readFileSync('hubspot-import.json', 'utf-8'));
const DIR = __dirname;
let TOKEN = fs.readFileSync(DIR + '/hs_token.txt', 'utf-8').trim();
const CLIENT_ID = '1c7641c4-a312-4d8a-af96-b5364ea64aaf';
const CLIENT_SECRET = '1eca8036-e235-4ea2-8c70-6c5941202ba7';
let REFRESH_TOKEN = fs.readFileSync(DIR + '/hs_refresh.txt', 'utf-8').trim();

function httpReq(method, hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ method, hostname, path, headers }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

async function refreshToken() {
  const body = `grant_type=refresh_token&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&refresh_token=${REFRESH_TOKEN}`;
  const res = await httpReq('POST', 'api.hubapi.com', '/oauth/v1/token',
    { 'Content-Type': 'application/x-www-form-urlencoded' }, body);
  if (res.data.access_token) {
    TOKEN = res.data.access_token;
    REFRESH_TOKEN = res.data.refresh_token;
    fs.writeFileSync(DIR + '/hs_token.txt', TOKEN);
    fs.writeFileSync(DIR + '/hs_refresh.txt', REFRESH_TOKEN);
  }
}

async function batchUpdate(batch) {
  const inputs = batch.map(c => ({
    id: c.email,
    idProperty: 'email',
    properties: {
      clearonc_segment: c.segment,
      lifecyclestage: 'subscriber'
    }
  }));

  return httpReq('POST', 'api.hubapi.com', '/crm/v3/objects/contacts/batch/update',
    { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    JSON.stringify({ inputs }));
}

async function run() {
  await refreshToken();
  console.log(`Updating ${contacts.length} contacts with segment labels...`);

  const BATCH = 100;
  let updated = 0, errors = 0;

  for (let i = 0; i < contacts.length; i += BATCH) {
    const batch = contacts.slice(i, i + BATCH);

    if (i > 0 && (i / BATCH) % 10 === 0) await refreshToken();

    const res = await batchUpdate(batch);

    if (res.status === 200) {
      updated += res.data.results ? res.data.results.length : 0;
      process.stdout.write(`  Updated ${updated}/${contacts.length}\r`);
    } else if (res.status === 429) {
      console.log('\n  Rate limited, waiting 10s...');
      await new Promise(r => setTimeout(r, 10000));
      i -= BATCH; continue;
    } else if (res.status === 401) {
      await refreshToken(); i -= BATCH; continue;
    } else {
      errors += batch.length;
      console.log(`\n  Error (${res.status}):`, JSON.stringify(res.data).slice(0, 200));
    }

    await new Promise(r => setTimeout(r, 350));
  }

  console.log(`\n\nDone. Updated: ${updated}, Errors: ${errors}`);
}

run().catch(e => console.error('Fatal:', e));
