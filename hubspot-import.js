const fs = require('fs');
const https = require('https');

// Load contacts
const contacts = JSON.parse(fs.readFileSync('hubspot-import.json', 'utf-8'));
console.log(`Total contacts to import: ${contacts.length}`);

// Token management
const DIR = __dirname;
let TOKEN = fs.readFileSync(DIR + '/hs_token.txt', 'utf-8').trim();
const CLIENT_ID = '1c7641c4-a312-4d8a-af96-b5364ea64aaf';
const CLIENT_SECRET = '1eca8036-e235-4ea2-8c70-6c5941202ba7';
let REFRESH_TOKEN = fs.readFileSync(DIR + '/hs_refresh.txt', 'utf-8').trim();

function httpReq(method, hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = { method, hostname, path, headers };
    const req = https.request(opts, (res) => {
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
    console.log('  Token refreshed');
  } else {
    console.error('  Token refresh failed:', JSON.stringify(res.data));
  }
}

async function batchCreate(batch) {
  const inputs = batch.map(c => ({
    properties: {
      email: c.email,
      firstname: c.firstname,
      lastname: c.lastname,
      jobtitle: c.jobtitle,
      company: c.company,
      phone: c.phone || '',
      city: c.city || '',
      state: c.state || '',
      country: c.country || '',
      hs_lead_status: 'NEW',
      lifecyclestage: 'subscriber',
      clearonc_segment: c.segment
    }
  }));

  const res = await httpReq('POST', 'api.hubapi.com', '/crm/v3/objects/contacts/batch/create',
    { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    JSON.stringify({ inputs }));

  return res;
}

async function run() {
  const BATCH_SIZE = 100;
  const batches = [];
  for (let i = 0; i < contacts.length; i += BATCH_SIZE) {
    batches.push(contacts.slice(i, i + BATCH_SIZE));
  }

  console.log(`Importing in ${batches.length} batches of ${BATCH_SIZE}...`);

  let created = 0, errors = 0, duplicates = 0;
  const segCounts = { 'Employers': 0, 'Health Plans / Payers': 0, 'Health Systems': 0, 'Clinicians': 0 };

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Refresh token every 10 batches (safety)
    if (i > 0 && i % 10 === 0) {
      await refreshToken();
    }

    const res = await batchCreate(batch);

    if (res.status === 201) {
      const count = res.data.results ? res.data.results.length : 0;
      created += count;
      batch.forEach(c => segCounts[c.segment]++);
      process.stdout.write(`  Batch ${i+1}/${batches.length}: ${count} created (total: ${created})\r`);
    } else if (res.status === 409 || (res.data && res.data.category === 'CONFLICT')) {
      // Duplicates - contacts already exist
      const numErrors = res.data.numErrors || 0;
      duplicates += batch.length;
      process.stdout.write(`  Batch ${i+1}/${batches.length}: ${batch.length} duplicates (total dupes: ${duplicates})\r`);
    } else if (res.status === 429) {
      // Rate limited - wait and retry
      console.log(`\n  Rate limited at batch ${i+1}, waiting 10s...`);
      await new Promise(r => setTimeout(r, 10000));
      i--; // retry this batch
      continue;
    } else if (res.status === 401) {
      console.log(`\n  Token expired, refreshing...`);
      await refreshToken();
      i--; // retry
      continue;
    } else {
      errors += batch.length;
      console.log(`\n  Batch ${i+1} error (${res.status}):`, JSON.stringify(res.data).slice(0, 300));
    }

    // Small delay to avoid rate limits
    await new Promise(r => setTimeout(r, 350));
  }

  console.log('\n\n=== IMPORT COMPLETE ===');
  console.log(`Created: ${created}`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`Errors: ${errors}`);
  console.log('\nBy segment:');
  Object.entries(segCounts).forEach(([k,v]) => console.log(`  ${k}: ${v}`));
}

run().catch(e => console.error('Fatal:', e));
