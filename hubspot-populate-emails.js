const fs = require('fs');
const https = require('https');

let TOKEN = fs.readFileSync('hs_token.txt', 'utf-8').trim();
let REFRESH = fs.readFileSync('hs_refresh.txt', 'utf-8').trim();

function httpReq(m, h, p, hd, b) {
  return new Promise((res, rej) => {
    const r = https.request({ method: m, hostname: h, path: p, headers: hd }, rs => {
      let d = ''; rs.on('data', c => d += c);
      rs.on('end', () => { try { res({ status: rs.statusCode, data: JSON.parse(d) }); } catch { res({ status: rs.statusCode, data: d }); } });
    }); r.on('error', rej); if (b) r.write(b); r.end();
  });
}

async function refresh() {
  const b = 'grant_type=refresh_token&client_id=1c7641c4-a312-4d8a-af96-b5364ea64aaf&client_secret=1eca8036-e235-4ea2-8c70-6c5941202ba7&refresh_token=' + REFRESH;
  const r = await httpReq('POST', 'api.hubapi.com', '/oauth/v1/token', { 'Content-Type': 'application/x-www-form-urlencoded' }, b);
  if (r.data.access_token) { TOKEN = r.data.access_token; REFRESH = r.data.refresh_token; fs.writeFileSync('hs_token.txt', TOKEN); fs.writeFileSync('hs_refresh.txt', REFRESH); }
}

const sig = '<p style="margin-bottom:10px;margin-top:24px;">Best,<br>Nisha Gandhi, RN, MBA<br>Chief Growth Officer, ClearOnc Insights<br><em>An AccelerOnc Studio Company &bull; Backed by Moffitt Cancer Center</em></p>';
const cta = '<p style="margin-bottom:10px;"><a href="https://www.clearonc.com/#contact" style="background:#FF7900;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Schedule a Call &rarr;</a></p>';
const cta15 = '<p style="margin-bottom:10px;"><a href="https://www.clearonc.com/#contact" style="background:#FF7900;color:#ffffff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Schedule a 15-Minute Call &rarr;</a></p>';

const email1 = `<p style="margin-bottom:10px;">Hi {{ contact.firstname | default("there") }},</p>
<p style="margin-bottom:10px;">When one of your employees hears "you have cancer," everything changes. For them, and for your plan.</p>
<p style="margin-bottom:10px;">Cancer is already the single largest driver of healthcare spend for most self-funded employers. But the cost problem isn't just the diagnosis. It's what happens in the days and weeks that follow, when decisions are made quickly, often without the right expertise in the room.</p>
<p style="margin-bottom:10px;">Here's what that costs:</p>
<ul>
<li>1 in 12 cancer cases are misdiagnosed initially.</li>
<li>The average delay to correct a diagnosis is 7.5 months.</li>
<li>The cost difference between late-stage and early-stage treatment for a single employee can exceed $700,000.</li>
<li>For a 10,000-person workforce, you're likely facing 2 to 3 cases like this every year.</li>
</ul>
<p style="margin-bottom:10px;">Across self-insured employers, misdiagnosis drives an estimated $2.4 million in avoidable spend annually.</p>
<p style="margin-bottom:10px;">The expertise to prevent that exists. The problem is timing and access. Traditional expert consultation takes 4 to 6 weeks. By then, treatment is already underway and the decision is already made.</p>
<p style="margin-bottom:10px;">ClearOnc delivers the subspecialty oncology guidance of Moffitt Cancer Center in 4 to 6 days, before irreversible decisions are locked in. Improving outcomes for your people, as well as your plan.</p>
<p style="margin-bottom:10px;">Interested in what this could mean for your organization?</p>
${cta}
${sig}`;

const email2 = `<p style="margin-bottom:10px;">Hi {{ contact.firstname | default("there") }},</p>
<p style="margin-bottom:10px;">A cancer diagnosis moves fast. So does the system around it: appointments, imaging, pathology, a treatment plan. Most employees do what feels natural: They trust the first recommendation and prepare to start treatment.</p>
<p style="margin-bottom:10px;">The challenge is that the first recommendation isn't always the right one. So much depends on where that patient is located, the access they have to subspecialty care, and how early they can be matched with the right treatment plan for their particular diagnosis.</p>
<p style="margin-bottom:10px;">ClearOnc was built to quickly deliver the right expertise to patients upon diagnosis and throughout the cancer journey regardless of their location. Here's how:</p>
<ul>
<li>Medical records are gathered and synthesized using AI, in minutes rather than weeks.</li>
<li>The case is routed to the appropriate Moffitt subspecialist for that cancer type.</li>
<li>Expert guidance is delivered in 4 to 6 days.</li>
<li>Oncologist review time drops from 3+ hours to 15 to 45 minutes.</li>
</ul>
<p style="margin-bottom:10px;">The result: expert input arrives before treatment decisions are locked in, not after. Employers using this model have reduced cancer care costs by 34% while achieving 67% earlier detection rates.</p>
<p style="margin-bottom:10px;">ClearOnc isn't a second opinion requested after something goes wrong. It's expert input built into the beginning of the care journey, and it stays present throughout.</p>
<p style="margin-bottom:10px;">I'd welcome the chance to walk you through how ClearOnc will amplify prevention for your employees. A 15-minute conversation is a good place to start.</p>
${cta}
${sig}`;

const email3 = `<p style="margin-bottom:10px;">Hi {{ contact.firstname | default("there") }},</p>
<p style="margin-bottom:10px;">Benefits decisions are usually made in spreadsheets. Cancer is experienced in waiting rooms.</p>
<p style="margin-bottom:10px;">That gap matters. When an employee faces a cancer diagnosis, what they remember most about their benefits isn't their deductible or their network tier. It's how their employer showed up to support them.</p>
<p style="margin-bottom:10px;">ClearOnc gives benefits leaders a way to help their members get the best possible treatment for their particular diagnosis. From the moment they hear "you have cancer" and throughout their journey. And the results go beyond clinical outcomes.</p>
<p style="margin-bottom:10px;">89% of employees rate access to expert cancer guidance as extremely valuable. It ranks as the second most requested benefit after mental health support. Employers who have implemented ClearOnc report a 23% improvement in overall benefits satisfaction. For CHROs navigating a competitive talent environment, that signal matters.</p>
<p style="margin-bottom:10px;">The financial impact is equally clear. Employers using ClearOnc have seen an average 34% reduction in cancer care costs, 67% earlier detection rates, and measurable ROI within 18 months.</p>
<p style="margin-bottom:10px;">Better decisions upstream not only lead to better outcomes for the patient &mdash; for your employees, they also reduce the cost volatility that makes cancer the most unpredictable line item in a self-funded plan.</p>
<p style="margin-bottom:10px;">If you'd like to see how this applies to your employee population, I would be glad to walk through the specifics.</p>
${cta15}
${sig}`;

const emails = [
  { id: '334587438805', body: email1, name: 'Email 1 (Day 1)' },
  { id: '334587438808', body: email2, name: 'Email 2 (Day 3)' },
  { id: '334587322061', body: email3, name: 'Email 3 (Day 7)' },
];

async function run() {
  await refresh();
  console.log('Token refreshed\n');

  for (const e of emails) {
    console.log('Updating', e.name, '...');

    // The DnD plain_text template uses widget name "module-0-0-0" for the body
    const patch = await httpReq('PATCH', 'api.hubapi.com', '/marketing/v3/emails/' + e.id,
      { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      JSON.stringify({
        content: {
          widgets: {
            'module-0-0-0': {
              body: {
                html: e.body,
                css_class: 'dnd-module',
                path: '@hubspot/rich_text',
                schema_version: 2,
              },
              type: 'module',
              name: 'module-0-0-0',
            }
          }
        }
      }));

    if (patch.status === 200) {
      // Verify
      const v = await httpReq('GET', 'api.hubapi.com', '/marketing/v3/emails/' + e.id, { 'Authorization': 'Bearer ' + TOKEN });
      const html = v.data?.content?.widgets?.['module-0-0-0']?.body?.html || '';
      const hasContent = html.includes('ClearOnc');
      console.log('  Status: OK | Content:', hasContent ? 'YES (' + html.length + ' chars)' : 'NO - still placeholder');
    } else {
      console.log('  Status:', patch.status);
      console.log('  ', JSON.stringify(patch.data).slice(0, 200));
    }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDone! Check in HubSpot:');
  console.log('Email 1: https://app-na2.hubspot.com/email/244068766/edit/334587438805/content');
  console.log('Email 2: https://app-na2.hubspot.com/email/244068766/edit/334587438808/content');
  console.log('Email 3: https://app-na2.hubspot.com/email/244068766/edit/334587322061/content');
}

run().catch(e => console.error('Fatal:', e));
