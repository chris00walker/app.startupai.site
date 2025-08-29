# Renderer Stability Playbook (Cloud Run + Puppeteer/Chromium)

Guidance for a stable, reproducible headless rendering service on Cloud Run.

## Base Image

- Use a maintained Chromium-enabled image or install system deps in Docker
- Ensure fonts and locales installed (Noto, DejaVu)

## Launch Flags

- `--no-sandbox`
- `--disable-dev-shm-usage`
- `--disable-setuid-sandbox`
- `--disable-gpu`
- `--single-process` (only if needed)

## Filesystem

- Write only to `/tmp`
- Set `XDG_CACHE_HOME=/tmp/.cache` to avoid write issues

## Resources

- Start with Cloud Run 2 vCPU / 2–4 GiB RAM
- Concurrency = 1 for renderers
- Enable CPU always allocated for faster page loads

## Timeouts & Retries

- Request timeout ≥ 120s for large canvases
- Use Cloud Tasks for retries/backoff and idempotency

## Example Launcher

```ts
import puppeteer from 'puppeteer';

export async function launchBrowser() {
  return await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    headless: 'new',
  });
}
```

See also:

- Runbooks: `docs/architecture/60-implementation/runbooks.md`
- Monitoring Dashboards: `docs/architecture/60-implementation/monitoring-dashboards.md`
