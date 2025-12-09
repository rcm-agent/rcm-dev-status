/**
 * Generates a barcode-style static status page using Upptime summary data.
 * Output: site/status-page/__sapper__/export/index.html
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const summaryPath = path.join(root, "history", "summary.json");
const outputDir = path.join(root, "site", "status-page", "__sapper__", "export");
const outputPath = path.join(outputDir, "index.html");

const percentToNumber = (value) => {
  if (!value) return 0;
  if (typeof value === "number") return value;
  return Number(String(value).replace("%", "")) || 0;
};

const statusClass = (uptime) => {
  if (uptime >= 99) return "ok";
  if (uptime >= 95) return "warn";
  return "down";
};

const statusLabel = (status) => {
  if (status === "up") return "Operational";
  if (status === "down") return "Outage";
  return "Degraded";
};

const loadSummary = () => {
  const contents = fs.readFileSync(summaryPath, "utf8");
  return JSON.parse(contents);
};

const renderService = (service) => {
  const uptimeYear = percentToNumber(service.uptimeYear || service.uptime);
  const uptimeMonth = percentToNumber(service.uptimeMonth);
  const uptimeWeek = percentToNumber(service.uptimeWeek);
  const uptimeDay = percentToNumber(service.uptimeDay);

  const overall = uptimeYear || uptimeMonth || uptimeWeek || uptimeDay;
  const totalSegments = 120;
  const downSegments = Math.round((100 - overall) / 100 * totalSegments);
  const warnSegments = Math.max(0, Math.min(downSegments, Math.ceil(downSegments / 2)));
  const okSegments = Math.max(0, totalSegments - downSegments);

  const stripePalette = [
    ...Array(okSegments).fill("ok"),
    ...Array(warnSegments).fill("warn"),
    ...Array(Math.max(0, downSegments - warnSegments)).fill("down"),
  ];

  // Shuffle slightly so bars look mixed
  stripePalette.sort(() => Math.random() - 0.5);

  const currentClass = statusClass(overall);
  const pill = statusLabel(service.status);

  return `
    <section class="card">
      <div class="card-header">
        <div class="title">${service.name}</div>
        <div class="pill ${currentClass}">${pill}</div>
      </div>
      <div class="bar-row">
        <div class="service-meta">
          <div class="name">${service.name}</div>
          <div class="url">${service.url}</div>
        </div>
        <div class="barcode">
          ${stripePalette
            .map(
              (cls) => `<span class="tick ${cls}" aria-hidden="true"></span>`
            )
            .join("")}
        </div>
        <div class="uptime">${(overall || 0).toFixed(2)}% uptime</div>
      </div>
    </section>
  `;
};

const buildPage = (services) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RCM Dev Status</title>
  <style>
    :root {
      --ink: #0b1f33;
      --bg: #0f1624;
      --card: #111d30;
      --muted: #9fb3c8;
      --accent: #0c66e4;
      --warn: #f5a700;
      --down: #ef4444;
      --radius: 16px;
      --bar-height: 72px;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 24px 48px;
      font-family: "Inter", "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: radial-gradient(circle at 20% 20%, rgba(12,102,228,0.06), transparent 25%),
                  radial-gradient(circle at 80% 0%, rgba(245,167,0,0.05), transparent 30%),
                  var(--bg);
      color: #e8f1fb;
      min-height: 100vh;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 32px;
      letter-spacing: -0.5px;
    }
    p.lede {
      margin: 0 0 28px;
      color: var(--muted);
      max-width: 720px;
    }
    .grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .card {
      background: #0f1828;
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: var(--radius);
      padding: 16px;
      box-shadow: 0 12px 28px rgba(0,0,0,0.28);
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .title {
      font-weight: 700;
      font-size: 18px;
      letter-spacing: -0.2px;
    }
    .pill {
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.4px;
      border: 1px solid rgba(255,255,255,0.08);
      text-transform: uppercase;
    }
    .pill.ok { background: rgba(12,102,228,0.18); color: #b8d7ff; }
    .pill.warn { background: rgba(245,167,0,0.2); color: #ffe08a; }
    .pill.down { background: rgba(239,68,68,0.2); color: #ffb1b1; }
    .bar-row {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
    }
    .service-meta {
      min-width: 200px;
    }
    .name {
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .url {
      font-size: 12px;
      color: var(--muted);
      word-break: break-all;
    }
    .barcode {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 8px;
      gap: 4px;
      align-items: center;
      padding: 6px 10px;
      background: rgba(255,255,255,0.02);
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.06);
    }
    .tick {
      width: 8px;
      height: 28px;
      border-radius: 4px;
      display: inline-block;
    }
    .tick.ok { background: #1abf78; }
    .tick.warn { background: #f5a700; }
    .tick.down { background: #ef4444; }
    .uptime {
      font-weight: 700;
      font-size: 14px;
      color: #d9e6f7;
      white-space: nowrap;
    }
    @media (max-width: 900px) {
      .bar-row { grid-template-columns: 1fr; }
      .service-meta { min-width: auto; }
      .uptime { justify-self: flex-start; }
      .barcode { grid-auto-columns: 10px; }
    }
  </style>
</head>
<body>
  <h1>RCM Dev Status</h1>
  <p class="lede">Barcode-style snapshot of dev stack readiness. Stripes show aggregate uptime mix; labels read from live Upptime checks.</p>
  <div class="grid">
    ${services.map(renderService).join("")}
  </div>
</body>
</html>
`;
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, html.trim(), "utf8");
};

const main = () => {
  const services = loadSummary();
  buildPage(services);
  console.log(`Wrote ${outputPath}`);
};

main();
