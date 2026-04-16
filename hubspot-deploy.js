const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const DIR = __dirname;
let TOKEN = fs.readFileSync(path.join(DIR, 'hs_token.txt'), 'utf-8').trim();
let REFRESH_TOKEN = fs.readFileSync(path.join(DIR, 'hs_refresh.txt'), 'utf-8').trim();

const FOLDER = 'clearonc-website';

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
    if (body) req.write(body);
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

// Upload file using multipart form data
function uploadFile(filePath, folderPath) {
  return new Promise((resolve, reject) => {
    const fileName = path.basename(filePath);
    const fileData = fs.readFileSync(filePath);
    const boundary = '----FormBoundary' + Math.random().toString(36).substr(2);

    // Determine content type
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.gif': 'image/gif'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Build multipart body
    const parts = [];

    // file part
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`));
    parts.push(fileData);
    parts.push(Buffer.from('\r\n'));

    // options part
    const options = JSON.stringify({
      access: 'PUBLIC_INDEXABLE',
      overwrite: true,
      duplicateValidationStrategy: 'NONE',
      duplicateValidationScope: 'ENTIRE_PORTAL'
    });
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="options"\r\nContent-Type: application/json\r\n\r\n${options}\r\n`));

    // folderPath part
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="folderPath"\r\n\r\n${folderPath}\r\n`));

    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    const req = https.request({
      method: 'POST',
      hostname: 'api.hubapi.com',
      path: '/filemanager/api/v3/files/upload',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length
      }
    }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, data }); }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  await refreshToken();

  // Files to upload
  const files = [
    // CSS & JS
    { local: 'styles.css', folder: FOLDER },
    { local: 'about.css', folder: FOLDER },
    { local: 'script.js', folder: FOLDER },

    // Logos
    { local: 'Logo - white.png', folder: FOLDER },
    { local: 'Logo - blue.png', folder: FOLDER },

    // Images
    { local: 'images/telehealth-consult.jpg', folder: `${FOLDER}/images` },
    { local: 'images/patient-connection.jpg', folder: `${FOLDER}/images` },
    { local: 'images/expert-physician.jpg', folder: `${FOLDER}/images` },
    { local: 'images/compassionate-care.jpg', folder: `${FOLDER}/images` },
    { local: 'images/nurse-patient-tablet.jpg', folder: `${FOLDER}/images` },
    { local: 'images/care-navigator.jpg', folder: `${FOLDER}/images` },
    { local: 'images/survivorship-outdoors.jpg', folder: `${FOLDER}/images` },
    { local: 'images/patient-resilience.jpg', folder: `${FOLDER}/images` },
    { local: 'images/care-companion-grid.png', folder: `${FOLDER}/images` },
    { local: 'images/roi-infographic.png', folder: `${FOLDER}/images` },
    { local: 'images/doctor-confident.jpg', folder: `${FOLDER}/images` },
    { local: 'images/medical-research.jpg', folder: `${FOLDER}/images` },
    { local: 'images/patient-care.jpg', folder: `${FOLDER}/images` },
    { local: 'images/surgical-team.jpg', folder: `${FOLDER}/images` },
    { local: 'images/comfort-hands.png', folder: `${FOLDER}/images` },
    { local: 'images/caregiver-hands.png', folder: `${FOLDER}/images` },
  ];

  console.log(`Uploading ${files.length} files to HubSpot File Manager...\n`);

  const urlMap = {};
  let uploaded = 0;

  for (const f of files) {
    const fullPath = path.join(DIR, f.local);
    if (!fs.existsSync(fullPath)) {
      console.log(`  SKIP (not found): ${f.local}`);
      continue;
    }

    const res = await uploadFile(fullPath, f.folder);

    if (res.status === 200 || res.status === 201) {
      const url = res.data.url || res.data.objects?.[0]?.url || '';
      urlMap[f.local] = url;
      uploaded++;
      console.log(`  [${uploaded}/${files.length}] ${f.local} -> ${url.substring(0, 80)}...`);
    } else if (res.status === 401) {
      await refreshToken();
      // Retry
      const retry = await uploadFile(fullPath, f.folder);
      if (retry.status === 200 || retry.status === 201) {
        urlMap[f.local] = retry.data.url || '';
        uploaded++;
        console.log(`  [${uploaded}/${files.length}] ${f.local} (retry ok)`);
      } else {
        console.log(`  FAIL: ${f.local} (${retry.status}): ${JSON.stringify(retry.data).slice(0, 150)}`);
      }
    } else {
      console.log(`  FAIL: ${f.local} (${res.status}): ${JSON.stringify(res.data).slice(0, 150)}`);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== UPLOAD COMPLETE ===`);
  console.log(`Uploaded: ${uploaded}/${files.length}`);

  // Save URL map for HTML rewriting
  fs.writeFileSync(path.join(DIR, 'hubspot-url-map.json'), JSON.stringify(urlMap, null, 2));
  console.log('URL map saved to hubspot-url-map.json');
}

run().catch(e => console.error('Fatal:', e));
