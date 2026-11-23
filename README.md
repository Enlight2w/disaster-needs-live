# Disaster Needs Live

A crisis coordination prototype for browsing reported incidents, filtering open needs, and preparing responder or donor coordination. It combines an interactive map with request categories, urgency indicators, and sharing and translation helpers.

## Safety and prototype limits

This is not an emergency dispatch service and does not confirm that an incident, need, or responder is current or verified. The need-intake form is a non-persistent prototype. Do not use it for life-critical requests; contact local emergency services and verify information through official sources.

## Development

Use Node.js and the pnpm version declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm check
pnpm build
```

To start the development server on macOS or Linux, run `pnpm dev`. In Windows PowerShell, set the environment variable explicitly:

```powershell
$env:NODE_ENV = "development"
pnpm exec tsx watch server/_core/index.ts
```

Configure any required server variables locally before using database-backed or AI-assisted features. Do not commit credentials.
