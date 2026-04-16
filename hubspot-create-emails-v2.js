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

// Delete old emails
const OLD_IDS = ['328645048008', '328645048012', '328602448603'];

const emails = [
  { file: 'campaign-emails/cost-awareness-email1.html', name: 'ClearOnc Cost Awareness — Email 1 (Day 1)', subject: 'the cancer cost hiding in your benefits data', templateName: 'ClearOnc Email 1 - Cost' },
  { file: 'campaign-emails/cost-awareness-email2.html', name: 'ClearOnc Cost Awareness — Email 2 (Day 3)', subject: 'how it actually works (4-6 days, not weeks)', templateName: 'ClearOnc Email 2 - How' },
  { file: 'campaign-emails/cost-awareness-email3.html', name: 'ClearOnc Cost Awareness — Email 3 (Day 7)', subject: 'the benefit employees actually remember', templateName: 'ClearOnc Email 3 - Benefit' },
];

function makeTemplate(htmlContent, label) {
  // Strip <!DOCTYPE> through </head> and <body>...</body> wrapper — keep just the inner HTML
  // Actually, for email templates we want the FULL HTML since this IS the entire email
  // But we need to add CAN-SPAM required tags
  // The HTML already has an unsubscribe placeholder, so we just need the company address

  // Replace the {{ unsubscribe_link_all }} placeholder with actual HubL tag
  let html = htmlContent.replace(/\{\{\s*unsubscribe_link_all\s*\}\}/g, '{{ unsubscribe_link_all }}');

  // Replace {{contact.firstname}} and variants with HubL personalization
  html = html.replace(/\{\{contact\.firstname\s*\|\s*"([^"]+)"\s*\}\}/g, '{{ contact.firstname | default("$1") }}');
  html = html.replace(/\{\{contact\.firstname\}\}/g, '{{ contact.firstname }}');

  // Wrap with template annotation
  return `<!--\n  templateType: email\n  isAvailableForNewContent: true\n  label: ${label}\n-->\n${html}`;
}

async function run() {
  console.log('=== Creating Per-Email Templates with Baked-In HTML ===\n');
  await refreshToken();

  // Delete old emails
  console.log('Deleting old emails...');
  for (const id of OLD_IDS) {
    await apiCall('DELETE', `/marketing/v3/emails/${id}`);
  }
  console.log('  Done\n');

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    const htmlContent = fs.readFileSync(path.join(DIR, email.file), 'utf-8');
    console.log(`[${i + 1}/3] ${email.name}`);

    // Step 1: Create a template with the full HTML baked in
    const templateSource = makeTemplate(htmlContent, email.templateName);
    console.log('  Creating template...');

    const tmplRes = await apiCall('POST', '/content/api/v2/templates', {
      source: templateSource,
      path: `clearonc-emails/${email.templateName.replace(/\s+/g, '-').toLowerCase()}`,
      is_available_for_new_content: true,
      template_type: 2,
      label: email.templateName,
    });

    if (tmplRes.status === 200 || tmplRes.status === 201) {
      const tmplPath = tmplRes.data.path;
      console.log(`  Template created: ${tmplPath} (ID: ${tmplRes.data.id})`);

      // Step 2: Create email using this template
      console.log('  Creating email...');
      const emailRes = await apiCall('POST', '/marketing/v3/emails', {
        name: email.name,
        subject: email.subject,
        type: 'REGULAR',
        from: { email: 'nisha@clearonc.com', name: 'Nisha Gandhi' },
        replyTo: 'nisha@clearonc.com',
        content: {
          templatePath: tmplPath,
        },
      });

      if (emailRes.status === 200 || emailRes.status === 201) {
        console.log(`  Email created — ID: ${emailRes.data.id}`);
        console.log(`  Template mode: ${emailRes.data.emailTemplateMode}`);
      } else {
        console.log(`  Email create failed: ${emailRes.status}`);
        console.log(`  ${JSON.stringify(emailRes.data).slice(0, 200)}`);
      }
    } else {
      console.log(`  Template create failed: ${tmplRes.status}`);
      console.log(`  ${JSON.stringify(tmplRes.data).slice(0, 300)}`);
      if (tmplRes.data?.errors) {
        for (const err of tmplRes.data.errors) {
          console.log(`    ${err.message}`);
        }
      }
    }

    console.log('');
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('=== DONE ===');
}

run().catch(e => console.error('Fatal:', e));
