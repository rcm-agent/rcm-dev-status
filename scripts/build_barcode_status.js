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
  if (status === "up") return "UP";
  if (status === "down") return "DOWN";
  return "DEGRADED";
};

const loadSummary = () => {
  const contents = fs.readFileSync(summaryPath, "utf8");
  return JSON.parse(contents);
};

const renderService = (service) => {
  const uptimeDay = percentToNumber(service.uptimeDay);
  const uptimeWeek = percentToNumber(service.uptimeWeek);
  const uptimeMonth = percentToNumber(service.uptimeMonth);
  const uptimeYear = percentToNumber(service.uptimeYear);

  const bars = [
    { label: "24h", value: uptimeDay },
    { label: "7d", value: uptimeWeek },
    { label: "30d", value: uptimeMonth },
    { label: "365d", value: uptimeYear },
  ];

  const currentClass = statusClass(uptimeDay);
  const pill = statusLabel(service.status);

  return `
    <section class="card">
      <div class="card-header">
        <div class="title">${service.name}</div>
        <div class="pill ${currentClass}">${pill}</div>
      </div>
      <div class="barcode">
        ${bars
          .map(
            (bar) => `
          <div class="segment ${statusClass(bar.value)}">
            <div class="segment-label">${bar.label}</div>
            <div class="segment-value">${bar.value.toFixed(2)}%</div>
          </div>`
          )
          .join("")}
      </div>
      <div class="meta">
        <span class="target">${service.url}</span>
        <span class="uptime">All-time: ${service.uptime}</span>
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
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }
    .card {
      background: linear-gradient(135deg, rgba(255,255,255,0.03), rgba(12,102,228,0.03));
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: var(--radius);
      padding: 16px 16px 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.25);
      backdrop-filter: blur(4px);
    }
    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }
    .title {
      font-weight: 700;
      font-size: 16px;
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
    .pill.ok { background: rgba(12,102,228,0.15); color: #9ac5ff; }
    .pill.warn { background: rgba(245,167,0,0.18); color: #ffd167; }
    .pill.down { background: rgba(239,68,68,0.2); color: #ff9f9f; }
    .barcode {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    .segment {
      height: var(--bar-height);
      border-radius: 12px;
      position: relative;
      padding: 10px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.05);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .segment:before {
      content: "";
      position: absolute;
      inset: 0;
      opacity: 0.9;
      mix-blend-mode: screen;
      pointer-events: none;
    }
    .segment.ok { background: repeating-linear-gradient(90deg, #0c66e4 0 10px, #0b5bc6 10px 16px); }
    .segment.warn { background: repeating-linear-gradient(90deg, #f5a700 0 10px, #e89400 10px 16px); }
    .segment.down { background: repeating-linear-gradient(90deg, #ef4444 0 10px, #c81e1e 10px 16px); }
    .segment-label {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      color: rgba(255,255,255,0.78);
    }
    .segment-value {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: 0.2px;
      color: #f7fbff;
    }
    .meta {
      margin-top: 10px;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 12px;
      color: var(--muted);
    }
    .meta .target {
      color: #bcd6f3;
      word-break: break-all;
    }
    @media (max-width: 680px) {
      body { padding: 24px 16px 40px; }
      .barcode { grid-template-columns: repeat(2, 1fr); }
      .segment { height: 64px; }
    }
  </style>
</head>
<body>
  <h1>RCM Dev Status</h1>
  <p class="lede">Barcode-style view of our dev stack readiness. Stripes show uptime across 24h, 7d, 30d, and 365d snapshots for each service.</p>
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
