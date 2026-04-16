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

const MEETING = 'https://meetings-na2.hubspot.com/mike-lavance';
const LOGO = 'https://rehansajid80.github.io/clearonc-website/Logo%20-%20blue.png';

// Template uses {% widget_block rich_text %} which is editable in HubSpot editor
function brandedTemplate(label, defaultBodyHtml, ctaText) {
  return `<!--
  templateType: email
  isAvailableForNewContent: true
  label: ${label}
-->
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ClearOnc Insights</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;">
<tr><td align="center" style="padding:40px 20px;">

<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

  <tr>
    <td style="padding:32px 40px 16px;text-align:center;">
      <img src="${LOGO}" alt="ClearOnc Insights" width="160" style="display:inline-block;">
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px;">
      <div style="height:2px;background:linear-gradient(90deg,#24C8B9,#A2DCE9);border-radius:2px;"></div>
    </td>
  </tr>

  <tr>
    <td style="padding:28px 40px 0;font-size:15px;color:#4a5568;line-height:1.75;">
      {% widget_block rich_text "email_body" overrideable=True, label='Email Body - Click to Edit' %}
        {% widget_attribute "html" %}
${defaultBodyHtml}
        {% end_widget_attribute %}
      {% end_widget_block %}
    </td>
  </tr>

  <tr>
    <td style="padding:24px 40px 8px;text-align:center;">
      <table role="presentation" cellpadding="0" cellspacing="0" align="center"><tr>
        <td style="background:#FF7900;border-radius:8px;">
          <a href="${MEETING}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            ${ctaText} &rarr;
          </a>
        </td>
      </tr></table>
    </td>
  </tr>

  <tr>
    <td style="padding:12px 40px 28px;text-align:center;">
      <span style="font-size:13px;color:#718096;">or </span>
      <a href="https://www.clearonc.com/solution" style="font-size:13px;color:#24C8B9;text-decoration:none;font-weight:500;">see how it works</a>
      <span style="font-size:13px;color:#cbd5e0;"> &nbsp;|&nbsp; </span>
      <a href="mailto:nisha@clearonc.com?subject=ClearOnc%20intro" style="font-size:13px;color:#24C8B9;text-decoration:none;font-weight:500;">just reply to this email</a>
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px 20px;">
      <div style="border-top:1px solid #e2e8f0;padding-top:20px;">
        <p style="margin:0 0 2px;font-size:14px;color:#20366A;font-weight:600;">Nisha Gandhi, RN, MBA</p>
        <p style="margin:0 0 2px;font-size:13px;color:#718096;">Chief Growth Officer, ClearOnc Insights</p>
        <p style="margin:0;font-size:13px;color:#718096;">An AccelerOnc Studio Company &bull; Backed by Moffitt Cancer Center</p>
      </div>
    </td>
  </tr>

  <tr>
    <td style="padding:0 40px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="background:#20366A;border-radius:10px;width:100%;">
        <tr>
          <td style="padding:16px 20px;">
            <p style="margin:0 0 4px;font-size:13px;color:#ffffff;font-weight:600;">Powered by Moffitt Cancer Center</p>
            <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.4;">NCI-Designated Comprehensive Cancer Center &bull; 50+ cancer subspecialties &bull; Outcomes up to 4x better in select high-acuity cancers</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>

<table role="presentation" width="600" cellpadding="0" cellspacing="0">
  <tr>
    <td style="padding:20px 40px;text-align:center;">
      <p style="margin:0 0 6px;font-size:12px;color:#a0aec0;">
        {{ site_settings.company_name }}, {{ site_settings.company_street_address_1 }}, {{ site_settings.company_city }}, {{ site_settings.company_state }} {{ site_settings.company_zip }}
      </p>
      <p style="margin:0;font-size:11px;color:#cbd5e0;">
        {{ unsubscribe_link_all }}
      </p>
    </td>
  </tr>
</table>

</td></tr></table>
</body></html>`;
}

const body1 = `<p style="margin:0 0 16px;">Hi {{contact.firstname}},</p>
<p style="margin:0 0 16px;">When one of your employees hears &ldquo;you have cancer,&rdquo; everything changes. For them, and for your plan.</p>
<p style="margin:0 0 16px;">Cancer is already the single largest driver of healthcare spend for most self-funded employers. But the cost problem isn&rsquo;t just the diagnosis. It&rsquo;s what happens in the days and weeks that follow, when decisions are made quickly, often without the right expertise in the room.</p>
<p style="margin:0 0 12px;color:#20366A;font-weight:600;">Here&rsquo;s what that costs:</p>
<p style="margin:0 0 6px;">&bull; 1 in 12 cancer cases are misdiagnosed initially</p>
<p style="margin:0 0 6px;">&bull; The average delay to correct a diagnosis is 7.5 months</p>
<p style="margin:0 0 6px;">&bull; The cost difference between late-stage and early-stage treatment can exceed $700,000</p>
<p style="margin:0 0 16px;">&bull; For a 10,000-person workforce, you&rsquo;re likely facing 2-3 cases every year</p>
<p style="margin:0 0 16px;">Across self-insured employers, misdiagnosis drives an estimated <strong style="color:#20366A;">$2.4 million</strong> in avoidable spend annually.</p>
<p style="margin:0 0 16px;">The expertise to prevent that exists. The problem is timing and access. Traditional expert consultation takes 4 to 6 weeks. By then, treatment is already underway.</p>
<p style="margin:0 0 16px;"><strong style="color:#24C8B9;">ClearOnc delivers Moffitt subspecialty guidance in 4&ndash;6 days</strong> &mdash; before irreversible decisions are locked in. Improving outcomes for your people, as well as your plan.</p>
<p style="margin:0;">Interested in what this could mean for your organization?</p>`;

const body2 = `<p style="margin:0 0 16px;">Hi {{contact.firstname}},</p>
<p style="margin:0 0 16px;">A cancer diagnosis moves fast. So does the system around it: appointments, imaging, pathology, a treatment plan. Most employees do what feels natural: They trust the first recommendation and prepare to start treatment.</p>
<p style="margin:0 0 16px;">The challenge is that the first recommendation isn&rsquo;t always the right one. So much depends on where that patient is located, the access they have to subspecialty care, and how early they can be matched with the right treatment plan.</p>
<p style="margin:0 0 12px;color:#20366A;font-weight:600;">ClearOnc was built for exactly this. Here&rsquo;s how:</p>
<p style="margin:0 0 6px;">&bull; Medical records gathered and synthesized using AI, in minutes rather than weeks</p>
<p style="margin:0 0 6px;">&bull; Case routed to the appropriate Moffitt subspecialist for that cancer type</p>
<p style="margin:0 0 6px;">&bull; Expert guidance delivered in 4 to 6 days</p>
<p style="margin:0 0 16px;">&bull; Oncologist review time drops from 3+ hours to 15&ndash;45 minutes</p>
<p style="margin:0 0 16px;">The result: expert input arrives before treatment decisions are locked in. Employers using this model have reduced cancer care costs by 34% while achieving 67% earlier detection rates.</p>
<p style="margin:0 0 16px;">ClearOnc isn&rsquo;t a second opinion after something goes wrong. It&rsquo;s expert input built into the beginning of the care journey &mdash; and it stays present throughout.</p>
<p style="margin:0;">A 15-minute conversation is a good place to start.</p>`;

const body3 = `<p style="margin:0 0 16px;">Hi {{contact.firstname}},</p>
<p style="margin:0 0 16px;">Benefits decisions are usually made in spreadsheets. Cancer is experienced in waiting rooms.</p>
<p style="margin:0 0 16px;">That gap matters. When an employee faces a cancer diagnosis, what they remember most isn&rsquo;t their deductible or network tier. It&rsquo;s how their employer showed up to support them.</p>
<p style="margin:0 0 16px;">ClearOnc gives benefits leaders a way to help their members get the best possible treatment &mdash; from the moment they hear &ldquo;you have cancer&rdquo; and throughout their journey.</p>
<p style="margin:0 0 16px;">89% of employees rate access to expert cancer guidance as extremely valuable. It ranks as the second most requested benefit after mental health support. Employers report a 23% improvement in overall benefits satisfaction.</p>
<p style="margin:0 0 16px;">The financial impact is equally clear: average 34% reduction in cancer care costs, 67% earlier detection rates, and measurable ROI within 18 months.</p>
<p style="margin:0 0 16px;">Better decisions upstream reduce the cost volatility that makes cancer the most unpredictable line item in a self-funded plan. For your people, it&rsquo;s the benefit they&rsquo;ll actually talk about.</p>
<p style="margin:0;">If you&rsquo;d like to see how this applies to your employee population, I&rsquo;d be glad to walk through the specifics.</p>`;

const emails = [
  { label: 'ClearOnc Editable v2 - Email 1', body: body1, cta: 'Schedule a Call', name: 'ClearOnc — Email 1: The cancer cost hiding in your benefits data', subject: 'The cancer cost hiding in your benefits data' },
  { label: 'ClearOnc Editable v2 - Email 2', body: body2, cta: 'Schedule 15 Minutes', name: "ClearOnc — Email 2: Cancer care shouldn't depend on where you live", subject: "Cancer care shouldn't depend on where you live" },
  { label: 'ClearOnc Editable v2 - Email 3', body: body3, cta: 'Schedule a 15-Minute Call', name: 'ClearOnc — Email 3: The benefit employees remember', subject: 'When cancer care becomes a benefit that employees remember' },
];

async function run() {
  await refresh();
  console.log('Token refreshed\n');

  // Delete old
  const oldIds = ['334593500872', '334593500875', '334593597164'];
  for (const id of oldIds) {
    await httpReq('DELETE', 'api.hubapi.com', '/marketing/v3/emails/' + id, { 'Authorization': 'Bearer ' + TOKEN });
  }
  console.log('Old emails deleted\n');

  for (let i = 0; i < emails.length; i++) {
    const e = emails[i];
    console.log(`[${i + 1}/3] ${e.name}`);

    const tmplSource = brandedTemplate(e.label, e.body, e.cta);

    const tmplRes = await httpReq('POST', 'api.hubapi.com', '/content/api/v2/templates',
      { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
      JSON.stringify({
        source: tmplSource,
        path: 'clearonc-editable-v2/email-' + (i + 1),
        is_available_for_new_content: true,
        template_type: 2,
        label: e.label,
      }));

    if (tmplRes.status === 200 || tmplRes.status === 201) {
      const tmplPath = tmplRes.data.path;
      console.log('  Template:', tmplPath);

      const emailRes = await httpReq('POST', 'api.hubapi.com', '/marketing/v3/emails',
        { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json' },
        JSON.stringify({
          name: e.name,
          subject: e.subject,
          type: 'REGULAR',
          from: { email: 'nisha@clearonc.com', name: 'Nisha Gandhi' },
          replyTo: 'nisha@clearonc.com',
          content: { templatePath: tmplPath },
        }));

      if (emailRes.status === 200 || emailRes.status === 201) {
        console.log('  Email ID:', emailRes.data.id);
        console.log('  Edit: https://app-na2.hubspot.com/email/244068766/edit/' + emailRes.data.id + '/content');
      } else {
        console.log('  Email:', emailRes.status, JSON.stringify(emailRes.data).slice(0, 200));
      }
    } else {
      console.log('  Template:', tmplRes.status);
      if (tmplRes.data && tmplRes.data.errors) {
        for (const err of tmplRes.data.errors) console.log('    ' + err.message);
      } else {
        console.log('  ' + JSON.stringify(tmplRes.data).slice(0, 400));
      }
    }

    console.log('');
    await new Promise(r => setTimeout(r, 500));
  }
}

run().catch(e => console.error('Fatal:', e));
