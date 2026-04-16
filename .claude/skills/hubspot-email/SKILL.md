---
name: hubspot-email
description: Build production-ready HTML email templates for ClearOnc's HubSpot campaigns. Creates responsive, beautifully designed emails matching ClearOnc brand guidelines. Use when creating HTML emails for HubSpot import.
argument-hint: [email content or campaign name]
allowed-tools: Read, Write, Edit, Glob, Grep, Agent
model: claude-opus-4-6
effort: high
---

# HubSpot Email Builder — ClearOnc

You build production-ready HTML email templates for import into HubSpot. Every email must be visually polished, on-brand, and render correctly across all email clients.

## Output Format

Each email is a single `.html` file in `campaign-emails/`. Include a comment block at the top with:
```html
<!--
  CAMPAIGN: [Campaign name]
  EMAIL: [1 of 3, etc.]
  SUBJECT: [Subject line]
  PREVIEW: [Preview text]
  SEND DAY: [Day 1, Day 3, etc.]
  SEND TO: [Audience description]

  TO IMPORT INTO HUBSPOT:
  1. Go to Marketing > Email > Create email
  2. Choose "Custom" or "Code your own"
  3. Paste this HTML
  4. Set subject line and preview text from above
-->
```

## Design System

### Brand Colors
```
Navy (primary text, headers): #20366A
Teal (accents, highlights): #24C8B9
Light Blue (secondary accent): #A2DCE9
Orange (CTA buttons): #FF7900
Midnight (dark backgrounds): #00232B
Sand (warm neutral): #E6E5D3
```

### Typography
- Font stack: `'Helvetica Neue', Helvetica, Arial, sans-serif`
- Body: 15-16px, color #4a5568, line-height 1.7
- Headlines: 22-28px, color #20366A, font-weight 600
- Keep text sizes readable on mobile

### Layout Principles
- 600px max width container
- 40px horizontal padding
- White (#ffffff) email body with subtle shadow
- Light gray (#f4f6f9) outer background
- 12px border-radius on container
- Clean, airy spacing — don't cram

### CTA Buttons
- Primary: background #FF7900, white text, 8px border-radius
- Padding: 14px 32px
- Font: 15px, weight 600
- Always centered, always one clear primary CTA
- Secondary CTAs as text links in teal (#24C8B9)

### Header
- ClearOnc logo centered: `https://rehansajid80.github.io/clearonc-website/Logo%20-%20blue.png`
- Width: 160-180px
- Teal accent line below (2px gradient)

### Footer
- "ClearOnc Insights - An AccelerOnc Studio Company"
- Links: Website, About, Our Solution
- Unsubscribe: `{{ unsubscribe_link_all }}`
- Text: 11-12px, color #a0aec0

### Moffitt Authority Block (use when relevant)
- Dark navy (#20366A) rounded box
- White text with key Moffitt credentials
- Place near bottom, before footer

## Email Client Compatibility

- Use `<table role="presentation">` for all layout
- Inline all styles
- No CSS grid, flexbox, or media queries (optional progressive enhancement only)
- Use `cellpadding="0" cellspacing="0"` on all tables
- Background colors on `<td>`, not `<div>`
- `<img>` tags need: `style="display:block"`, width attribute, alt text
- Use `&bull;` for separators, `&rarr;` for arrows

## HubSpot Tokens

- `{{contact.firstname}}` — first name
- `{{ unsubscribe_link_all }}` — unsubscribe
- Use fallback: `{{contact.firstname | "there"}}` when personalization may be empty

## Design Philosophy

These emails should feel like they came from a premium healthcare brand — clean, trustworthy, confident. Not cluttered. Not promotional. Think: Apple meets Mayo Clinic.

The copy should already be written (use `/email-copywriter` first). This skill focuses on making that copy look beautiful in HTML.

## File Naming

`campaign-emails/{campaign-name}-email{N}.html`

Example: `campaign-emails/cost-awareness-email1.html`

## $ARGUMENTS

The user will provide email copy to template, or reference existing copy. Read existing emails in `campaign-emails/` for design patterns before building.
