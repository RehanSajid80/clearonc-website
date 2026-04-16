const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = __dirname;
let TOKEN = fs.readFileSync(path.join(DIR, 'hs_token.txt'), 'utf-8').trim();
let REFRESH_TOKEN = fs.readFileSync(path.join(DIR, 'hs_refresh.txt'), 'utf-8').trim();

function httpReq(method, hostname, reqPath, headers, body) {
  return new Promise((resolve, reject) => {
    const req = https.request({ method, hostname, path: reqPath, headers }, (res) => {
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
  const body = `grant_type=refresh_token&client_id=1c7641c4-a312-4d8a-af96-b5364ea64aaf&client_secret=1eca8036-e235-4ea2-8c70-6c5941202ba7&refresh_token=${REFRESH_TOKEN}`;
  const res = await httpReq('POST', 'api.hubapi.com', '/oauth/v1/token',
    { 'Content-Type': 'application/x-www-form-urlencoded' }, body);
  if (res.data.access_token) {
    TOKEN = res.data.access_token;
    REFRESH_TOKEN = res.data.refresh_token;
    fs.writeFileSync(path.join(DIR, 'hs_token.txt'), TOKEN);
    fs.writeFileSync(path.join(DIR, 'hs_refresh.txt'), REFRESH_TOKEN);
    console.log('  Token refreshed');
  } else {
    console.error('  Token refresh failed:', JSON.stringify(res.data).slice(0, 200));
  }
}

async function apiCall(method, apiPath, body) {
  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
  let res = await httpReq(method, 'api.hubapi.com', apiPath, headers, body ? JSON.stringify(body) : null);

  // Retry on 401
  if (res.status === 401) {
    await refreshToken();
    headers['Authorization'] = `Bearer ${TOKEN}`;
    res = await httpReq(method, 'api.hubapi.com', apiPath, headers, body ? JSON.stringify(body) : null);
  }

  return res;
}

// Email definitions
const emails = [
  {
    file: 'campaign-emails/cost-awareness-email1.html',
    name: 'ClearOnc Cost Awareness — Email 1 (Day 1)',
    subject: 'the cancer cost hiding in your benefits data',
    previewText: 'One misdiagnosis can cost your plan $700K',
  },
  {
    file: 'campaign-emails/cost-awareness-email2.html',
    name: 'ClearOnc Cost Awareness — Email 2 (Day 3)',
    subject: 'how it actually works (4-6 days, not weeks)',
    previewText: 'Medical records synthesized in minutes. Expert guidance in days.',
  },
  {
    file: 'campaign-emails/cost-awareness-email3.html',
    name: 'ClearOnc Cost Awareness — Email 3 (Day 7)',
    subject: 'the benefit employees actually remember',
    previewText: '89% rate expert cancer guidance as extremely valuable',
  },
];

async function createEmail(email) {
  const htmlContent = fs.readFileSync(path.join(DIR, email.file), 'utf-8');

  // Use the Marketing Email v3 API
  const payload = {
    name: email.name,
    subject: email.subject,
    // The body is custom HTML
    customProperties: {
      previewText: email.previewText,
    },
  };

  // Try transactional single-send create first, then fall back to marketing email
  // HubSpot Marketing Email API: POST /marketing/v3/emails
  const res = await apiCall('POST', '/marketing/v3/emails', {
    name: email.name,
    subject: email.subject,
    type: 'REGULAR',
    from: {
      email: 'nisha@clearonc.com',
      name: 'Nisha Gandhi',
    },
    replyTo: 'nisha@clearonc.com',
    content: {
      plainTextVersion: '',
      htmlContent: htmlContent,
    },
    // Draft state
    state: 'DRAFT',
  });

  return res;
}

async function run() {
  console.log('=== Creating ClearOnc Campaign Emails in HubSpot ===\n');

  await refreshToken();

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    console.log(`[${i + 1}/${emails.length}] Creating: ${email.name}`);
    console.log(`  Subject: "${email.subject}"`);

    const res = await createEmail(email);

    if (res.status === 200 || res.status === 201) {
      const id = res.data.id;
      console.log(`  SUCCESS — Email ID: ${id}`);
      console.log(`  Status: DRAFT (ready to review in HubSpot)\n`);
    } else {
      console.log(`  Status: ${res.status}`);
      console.log(`  Response: ${JSON.stringify(res.data).slice(0, 300)}`);

      // If v3 marketing emails API doesn't work, try the legacy API
      if (res.status === 404 || res.status === 400) {
        console.log('  Trying legacy API...');
        const legacyRes = await apiCall('POST', '/marketing-emails/v1/emails', {
          name: email.name,
          subject: email.subject,
          fromName: 'Nisha Gandhi',
          replyTo: 'nisha@clearonc.com',
          emailBody: fs.readFileSync(path.join(DIR, email.file), 'utf-8'),
          htmlTitle: email.name,
          previewText: email.previewText,
        });

        if (legacyRes.status === 200 || legacyRes.status === 201) {
          console.log(`  SUCCESS (legacy) — Email ID: ${legacyRes.data.id}`);
          console.log(`  Status: DRAFT\n`);
        } else {
          console.log(`  Legacy also failed (${legacyRes.status}): ${JSON.stringify(legacyRes.data).slice(0, 300)}\n`);
        }
      }
      console.log('');
    }

    // Rate limit buffer
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('=== DONE ===');
  console.log('Go to HubSpot > Marketing > Email to review and send.');
}

run().catch(e => console.error('Fatal:', e));
