const fs = require('fs');
const path = require('path');
const https = require('https');

const DIR = __dirname;
let TOKEN = fs.readFileSync(path.join(DIR, 'hs_token.txt'), 'utf-8').trim();
let REFRESH_TOKEN = fs.readFileSync(path.join(DIR, 'hs_refresh.txt'), 'utf-8').trim();

const CDN = 'https://244068766.fs1.hubspotusercontent-na2.net/hubfs/244068766/clearonc-website';

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
  }
}

function rewriteHtml(html, pageName) {
  let out = html;

  // Rewrite asset references to HubSpot CDN
  out = out.replace(/href="styles\.css"/g, `href="${CDN}/styles.css"`);
  out = out.replace(/href="about\.css"/g, `href="${CDN}/about.css"`);
  out = out.replace(/src="script\.js"/g, `src="${CDN}/script.js"`);

  // Rewrite logo references
  out = out.replace(/src="Logo - white\.png"/g, `src="${CDN}/Logo%20-%20white.png"`);
  out = out.replace(/src="Logo - blue\.png"/g, `src="${CDN}/Logo%20-%20blue.png"`);

  // Rewrite image references
  out = out.replace(/src="images\//g, `src="${CDN}/images/`);
  out = out.replace(/url\('images\//g, `url('${CDN}/images/`);

  // Rewrite nav links to use root-relative paths for HubSpot
  out = out.replace(/href="index\.html"/g, 'href="/"');
  out = out.replace(/href="solution\.html"/g, 'href="/solution"');
  out = out.replace(/href="care-companion\.html"/g, 'href="/care-companion"');
  out = out.replace(/href="about\.html"/g, 'href="/about"');
  out = out.replace(/href="index\.html#contact"/g, 'href="/#contact"');

  return out;
}

async function createOrUpdatePage(name, slug, htmlContent, metaDescription) {
  await refreshToken();

  // First check if page with this slug exists
  const search = await httpReq('GET', 'api.hubapi.com',
    `/cms/v3/pages/site-pages?slug=${encodeURIComponent(slug)}&limit=10`,
    { 'Authorization': `Bearer ${TOKEN}` });

  let existingId = null;
  if (search.status === 200 && search.data.results) {
    const match = search.data.results.find(p => p.slug === slug);
    if (match) existingId = match.id;
  }

  const pageData = {
    name: name,
    slug: slug,
    htmlTitle: name + ' | ClearOnc Insights',
    metaDescription: metaDescription || '',
    layoutSections: {},
    templatePath: '',
    subcategory: 'site_page',
    state: 'PUBLISHED',
    headHtml: '',
    footerHtml: '',
    // Use raw HTML approach
    widgetContainers: {},
    widgets: {}
  };

  // For HubSpot CMS, we need to use the "source content" approach
  // Create page with HTML body embedded
  const bodyHtml = htmlContent;

  if (existingId) {
    console.log(`  Updating existing page: ${name} (${existingId})`);
    const res = await httpReq('PATCH', 'api.hubapi.com',
      `/cms/v3/pages/site-pages/${existingId}`,
      { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      JSON.stringify({ ...pageData, htmlTitle: name + ' | ClearOnc Insights' }));
    return res;
  } else {
    console.log(`  Creating new page: ${name}`);
    const res = await httpReq('POST', 'api.hubapi.com',
      '/cms/v3/pages/site-pages',
      { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      JSON.stringify(pageData));
    return res;
  }
}

async function run() {
  await refreshToken();

  const pages = [
    {
      name: 'Home',
      file: 'index.html',
      slug: '',
      meta: 'ClearOnc delivers Moffitt-backed oncology expertise across diagnosis, treatment, and survivorship — reducing misdiagnosis, treatment variation, and cost volatility.'
    },
    {
      name: 'Our Solution',
      file: 'solution.html',
      slug: 'solution',
      meta: 'See how ClearOnc combines intelligent automation with Moffitt subspecialty oncology expertise to deliver faster, trusted clinical guidance.'
    },
    {
      name: 'Care Companion',
      file: 'care-companion.html',
      slug: 'care-companion',
      meta: 'The ClearOnc Care Companion Model stays with patients through every turning point — from diagnosis through survivorship.'
    },
    {
      name: 'About',
      file: 'about.html',
      slug: 'about',
      meta: 'ClearOnc modernizes how oncology expertise is delivered — powered by Moffitt Cancer Center.'
    }
  ];

  console.log('Creating/updating HubSpot CMS pages...\n');

  for (const page of pages) {
    const htmlPath = path.join(DIR, page.file);
    let html = fs.readFileSync(htmlPath, 'utf-8');
    html = rewriteHtml(html, page.name);

    // Extract just the body content for HubSpot
    // HubSpot site pages need the full HTML as the page uses a "blank" template
    const res = await createOrUpdatePage(page.name, page.slug, html, page.meta);

    if (res.status === 200 || res.status === 201) {
      const url = res.data.url || '';
      console.log(`  OK: ${page.name} -> ${url}`);
    } else {
      console.log(`  FAIL (${res.status}): ${JSON.stringify(res.data).slice(0, 300)}`);
    }

    await new Promise(r => setTimeout(r, 1000));
  }

  console.log('\nDone!');
}

run().catch(e => console.error('Fatal:', e));
