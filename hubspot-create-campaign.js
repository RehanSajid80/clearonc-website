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
  if (res.status === 401) {
    await refreshToken();
    headers['Authorization'] = `Bearer ${TOKEN}`;
    res = await httpReq(method, 'api.hubapi.com', apiPath, headers, body ? JSON.stringify(body) : null);
  }
  return res;
}

const EMAIL_IDS = ['328247028458', '328247028461', '328247028464'];

async function run() {
  console.log('=== Creating HubSpot Campaign ===\n');
  await refreshToken();

  // Step 1: Create the campaign
  console.log('Creating campaign: "ClearOnc Cost Awareness — 3-Email Drip"');
  const campaignRes = await apiCall('POST', '/marketing/v3/campaigns', {
    name: 'ClearOnc Cost Awareness — 3-Email Drip',
    description: '3-email sequence targeting benefits leaders, HR executives, and brokers. Highlights cancer cost drivers, how ClearOnc works, and the employee experience benefit. Emails sent Day 1, Day 3, Day 7.',
    startDateTime: null,
    endDateTime: null,
    properties: {
      utm_campaign: 'clearonc-cost-awareness',
    },
  });

  if (campaignRes.status === 200 || campaignRes.status === 201) {
    const campaignId = campaignRes.data.id;
    console.log(`  SUCCESS — Campaign ID: ${campaignId}\n`);

    // Step 2: Associate the 3 emails with the campaign
    console.log('Associating emails with campaign...');
    for (let i = 0; i < EMAIL_IDS.length; i++) {
      const emailId = EMAIL_IDS[i];
      console.log(`  [${i + 1}/3] Associating email ${emailId}...`);

      const assocRes = await apiCall('PUT', `/marketing/v3/campaigns/${campaignId}/assets/emails/${emailId}`, {});

      if (assocRes.status === 200 || assocRes.status === 201 || assocRes.status === 204) {
        console.log(`    Linked successfully`);
      } else {
        console.log(`    Status ${assocRes.status}: ${JSON.stringify(assocRes.data).slice(0, 200)}`);

        // Try PATCH on the email itself to set campaignGuid
        console.log(`    Trying to set campaign on email directly...`);
        const patchRes = await apiCall('PATCH', `/marketing/v3/emails/${emailId}`, {
          campaign: campaignId,
        });
        if (patchRes.status === 200 || patchRes.status === 201) {
          console.log(`    Set campaign on email ${emailId} via PATCH`);
        } else {
          console.log(`    PATCH status ${patchRes.status}: ${JSON.stringify(patchRes.data).slice(0, 200)}`);
        }
      }

      await new Promise(r => setTimeout(r, 300));
    }

    console.log(`\n=== DONE ===`);
    console.log(`Campaign: "ClearOnc Cost Awareness — 3-Email Drip"`);
    console.log(`Campaign ID: ${campaignId}`);
    console.log(`Emails: ${EMAIL_IDS.join(', ')}`);
    console.log(`\nGo to HubSpot > Marketing > Campaigns to view.`);

  } else {
    console.log(`  Campaign creation status: ${campaignRes.status}`);
    console.log(`  Response: ${JSON.stringify(campaignRes.data).slice(0, 400)}`);

    // If campaigns v3 not available, try legacy endpoint
    if (campaignRes.status === 404) {
      console.log('\n  Campaigns v3 API not available. Trying legacy...');
      const legRes = await apiCall('POST', '/email/public/v1/campaigns', {
        name: 'ClearOnc Cost Awareness — 3-Email Drip',
        appId: 0,
      });
      console.log(`  Legacy status: ${legRes.status}`);
      console.log(`  Response: ${JSON.stringify(legRes.data).slice(0, 400)}`);
    }

    // Fallback: just set campaign name on each email directly
    console.log('\n  Falling back: setting campaignName on each email...');
    for (let i = 0; i < EMAIL_IDS.length; i++) {
      const emailId = EMAIL_IDS[i];
      const patchRes = await apiCall('PATCH', `/marketing/v3/emails/${emailId}`, {
        campaignName: 'ClearOnc Cost Awareness — 3-Email Drip',
      });
      if (patchRes.status === 200) {
        console.log(`  [${i + 1}/3] Email ${emailId}: campaign name set`);
      } else {
        console.log(`  [${i + 1}/3] Email ${emailId}: ${patchRes.status} — ${JSON.stringify(patchRes.data).slice(0, 150)}`);
      }
      await new Promise(r => setTimeout(r, 300));
    }

    console.log('\n=== DONE ===');
    console.log('Emails tagged with campaign name. Review in HubSpot > Marketing > Email.');
  }
}

run().catch(e => console.error('Fatal:', e));
