// ─── OSS Vidéothèque — Seed Users ────────────────────────────
// Run from inside the backend container:
//   docker compose exec backend node /app/seed-users.js
//
// Password = email for each user (they can change it after first login).
// ─────────────────────────────────────────────────────────────

const http = require("http");

const BACKEND_URL = "http://localhost:4000";
const ADMIN_EMAIL = "admin@videotheque.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "123";

const EMAILS = [
  "nabil.benkhatra@oss.org.tn",
  "boc@oss.org.tn",
  "adel.rekik@oss.org.tn",
  "nabil.hamada@oss.org.tn",
  "safouene.ghannouchi@oss.org.tn",
  "rafik.ziadi@oss.org.tn",
  "sarra.dardour@oss.org.tn",
  "brahim.hammami@oss.org.tn",
  "molka.romdhani@oss.org.tn",
  "sonia.njah@oss.org.tn",
  "benhedia.souhir@oss.org.tn",
  "nadia.mathlouthi@oss.org.tn",
  "mourad.briki@oss.org.tn",
  "foughalihamda@oss.org.tn",
  "malak.chalbi@oss.org.tn",
  "olfa.karous@oss.org.tn",
  "webmaster@oss.org.tn",
  "ahmed.bensalah@oss.org.tn",
  "leila.bennani@oss.org.tn",
  "khaoula.jaoui@oss.org.tn",
  "lamine.babasy@oss.org.tn",
  "apolline.bambara@oss.org.tn",
  "soumaya.mouhli@oss.org.tn",
  "yosr.turki@oss.org.tn",
  "bello.abdoulkarim@oss.org.tn",
  "youssouf.amadou@oss.org.tn",
  "abir.benromdhane@oss.org.tn",
  "sebastien.lupeto@oss.org.tn",
  "henda.belkhodja@oss.org.tn",
  "ghazi.gader@oss.org.tn",
  "steve.muhanji@oss.org.tn",
  "kaouther.hamrouni@oss.org.tn",
  "aymen.benahmed@oss.org.tn",
  "wafa.ameur@oss.org.tn",
  "aziz.belhamra@oss.org.tn",
  "robert.onyango@oss.org.tn",
  "haithem.rejeb@oss.org.tn",
  "omar.ennaifar@oss.org.tn",
  "safa.arfaoui@oss.org.tn",
  "zied.sediri@oss.org.tn",
  "tarek.larbi@oss.org.tn",
  "mustapha.mimouni@oss.org.tn",
  "louis.zoungrana@oss.org.tn",
  "amjed.hadjtaieb@oss.org.tn",
  "anis.ghattassi@oss.org.tn",
  "ahmed.moussa@oss.org.tn",
  "kambia.pouwedeou@oss.org.tn",
  "khaled.lachaal@oss.org.tn",
  "mohamed.azzabi@oss.org.tn",
  "youssef.haddouk@oss.org.tn",
];

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(BACKEND_URL + path);
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method,
      headers: { "Content-Type": "application/json" },
    };
    if (data) options.headers["Content-Length"] = Buffer.byteLength(data);
    if (token) options.headers["Authorization"] = "Bearer " + token;

    const req = http.request(options, (res) => {
      let chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        resolve({ status: res.statusCode, body: raw });
      });
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  // ── Login as admin ────────────────────────────────────────
  console.log("Logging in as admin...");
  const loginRes = await request("POST", "/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (loginRes.status !== 200) {
    console.error("ERROR: Failed to login as admin.");
    console.error(loginRes.body);
    process.exit(1);
  }

  const token = JSON.parse(loginRes.body).data.token;
  console.log("OK: Got admin token.\n");

  // ── Create each user ──────────────────────────────────────
  let success = 0;
  let skip = 0;
  let fail = 0;

  for (const email of EMAILS) {
    const res = await request(
      "POST",
      "/users",
      { email, password: email, role: "uploader" },
      token
    );

    if (res.status === 201) {
      console.log(`OK:   ${email}`);
      success++;
    } else if (res.status === 409) {
      console.log(`SKIP: ${email} (already exists)`);
      skip++;
    } else {
      console.log(`FAIL: ${email} -> HTTP ${res.status}`);
      fail++;
    }
  }

  console.log("");
  console.log("========================================");
  console.log(`Done! Created: ${success} | Skipped: ${skip} | Failed: ${fail}`);
  console.log("========================================");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
