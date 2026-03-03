# Pixel Sprite Creator

## Analytics (Usage, Location, Shares)

This app now includes your Google Analytics 4 (GA4) tag directly in site entry pages.

### 1) Create a GA4 property

- In Google Analytics, create a Web Data Stream for your domain (`pixelspirite.com`).
- Copy your Measurement ID (looks like `G-XXXXXXXXXX`).

### 2) Deploy

The Google tag with your Measurement ID (`G-7EDDWZRCBF`) is already added to:

- `index.html`
- `docs/index.html`
- `404.html`

Rebuild/deploy as usual:

```bash
npm run build
```

### 3) What is tracked

- `page_view` when the app loads
- `canvas_started` (first canvas interaction per session)
- `sprite_saved`
- `sprite_exported`
- `share_clicked`
- `app_opened`
- `template_picker_opened`
- `template_started`
- `animation_played` / `animation_paused`
- `animation_preset_applied`
- `project_saved`
- `export_completed` (with export format)
- `share_intent` (when using share-oriented exports)

### 4) Location tracking notes

GA4 provides approximate geo insights (country/city/region) based on IP-derived data in analytics reports.

### 5) Youth-safe privacy defaults

In GA4 Admin settings, keep this property safety-focused:

- Turn OFF Google Signals
- Turn OFF Ad personalization
- Keep measurement for product analytics only
- Keep `anonymize_ip: true` in the site tag config

### 6) Shares tracking notes

This app currently tracks share intent via share-oriented export actions (`jpeg`, `gif` fallback).
If you add a dedicated share button later (e.g., Web Share API), wire it to send `share_intent` with channel details.

