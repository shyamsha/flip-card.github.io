// find_stamp_and_get_carded.js  (Node 18+)
const BASE = "https://workwithus.lucioai.com";
const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU3lhbSBLdW1hciBDaGVydWt1cmkiLCJlbWFpbCI6InNoeWFta3VtYXI5N0BsaXZlLmNvbSIsImRhdGUiOiIyMDI1LTExLTE3IDEwOjQ1OjExIn0.kl9Ff7PhU5y9dDPvoUtvGeCZ1Hsjgk5IBpr6VVaqs90";
const NAME = "Syam Kumar Cherukuri";
const EMAIL = "shyamkumar97@live.com";

const stampEndpoints = [
  "/stamp",
  "/take-stamp",
  "/get-stamp",
  "/entry-stamp",
  "/get-stamped",
  "/stamp-me",
  "/take-stamp",
  "/claim-stamp",
  "/get-stamp",
  "/take-entry",
  "/take-entry-stamp",
  "/stamp/claim",
];

const possibleStampFields = [
  "stamp",
  "entry_stamp",
  "code",
  "entry",
  "value",
  "token",
  "stamp_value",
  "stampCode",
  "code_value",
  "stamp_id",
];

const headerNamesToTry = [
  "X-Entry-Stamp",
  "X-Entry-Stamp".toLowerCase(),
  "X-Stamp",
  "X-Auth-Token",
  "X-Token",
  "Entry-Stamp",
  "Stamp",
  "X-Bouncer",
  "X-Stamp-Code",
  "X-Stamp-Value",
  "X-Auth",
];

const cookieNames = ["entry_stamp", "auth", "stamp", "stamp_token", "entry"];

// small helper
async function req(method, url, headers = {}, body = undefined) {
  try {
    const opts = {
      method,
      headers: {
        "User-Agent": "stamp-finder/1.0",
        Accept: "application/json,text/plain,*/*",
        ...headers,
      },
    };
    if (body) opts.body = body;
    const res = await fetch(url, opts);
    const text = await res.text();
    let json = null;
    try {
      json = JSON.parse(text);
    } catch {}
    return {
      status: res.status,
      text,
      json,
      headers: Object.fromEntries(res.headers.entries()),
    };
  } catch (err) {
    return { error: err.message };
  }
}

function extractStampFromObj(obj) {
  if (!obj || typeof obj !== "object") return null;
  for (const f of possibleStampFields) {
    if (obj[f]) return String(obj[f]);
  }
  // also search nested strings
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === "string") {
      for (const f of possibleStampFields) {
        if (v.toLowerCase().includes(f.replace(/_/g, ""))) {
          return v;
        }
      }
    }
  }
  return null;
}

(async () => {
  console.log(
    "1) Quick grep of homepage JS for 'stamp' (uses curl - show this in terminal if you want):"
  );
  console.log(`curl -s ${BASE}/ | grep -i "stamp" -n || true`);
  console.log("\n--- Starting stamp endpoint probes ---\n");

  for (const ep of stampEndpoints) {
    const url = BASE + ep;
    // try GET
    const g = await req("GET", url);
    console.log(`GET ${ep} -> ${g.status || g.error}`);
    if (g.json) {
      const s = extractStampFromObj(g.json);
      if (s) {
        console.log("Found stamp in JSON (GET):", s);
        // attempt /get-carded with this stamp now
        await tryCardedWithStamp(s);
        return;
      }
    } else if (
      g.text &&
      g.text.length < 1000 &&
      g.text.toLowerCase().includes("stamp")
    ) {
      console.log("Found stamp text:", g.text.slice(0, 500));
    }

    // try POST with name/email (some endpoints require POST)
    const body = JSON.stringify({ name: NAME, email: EMAIL });
    const p = await req(
      "POST",
      url,
      { "Content-Type": "application/json" },
      body
    );
    console.log(`POST ${ep} -> ${p.status || p.error}`);
    if (p.json) {
      const s = extractStampFromObj(p.json);
      if (s) {
        console.log("Found stamp in JSON (POST):", s);
        await tryCardedWithStamp(s);
        return;
      }
    }
    // small polite delay
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(
    "\nNo stamp discovered from direct endpoints. Now trying to call /get-carded with derived/guessed stamp placements."
  );

  // If nothing found, try several guessed stamp values derived from JWT date and name
  const jwtPayloadDate = "2025-11-17 10:28:54"; // if you want to change, update
  const derivedCandidates = [
    jwtPayloadDate,
    jwtPayloadDate.split(" ")[0],
    jwtPayloadDate.replaceAll(" ", "_"),
    Buffer.from(NAME).toString("base64"),
    Buffer.from(EMAIL).toString("base64"),
    "stamped",
    "got-stamp",
    "entry",
    "entry-stamp",
    "YES",
    "true",
    "1",
  ];

  for (const cand of derivedCandidates) {
    console.log("Trying candidate stamp:", cand);
    const tried = await tryCardedWithStamp(cand);
    if (tried) return;
  }

  console.log(
    "\nExhausted automated guesses. If still 403, do these manually next:"
  );
  console.log(
    "- Inspect homepage and bundled JS for 'stamp' (curl the root and search: curl -s / | grep -i stamp -n)."
  );
  console.log(
    "- Visit the site in a real browser and watch the Network tab while clicking through — client JS sometimes requests a one-time stamp value from a background endpoint."
  );
  console.log(
    "- If you get any JSON from any endpoint, paste it here and I'll parse further."
  );
  process.exit(0);

  // helper nested so it can call req()
  async function tryCardedWithStamp(stampValue) {
    console.log(
      "\n==> Trying /get-carded with discovered stamp value:",
      stampValue
    );
    // 1) Try header variants with Authorization
    for (const hn of headerNamesToTry) {
      const hdr = { Authorization: `Bearer ${TOKEN}` };
      hdr[hn] = stampValue;
      const r = await req("GET", `${BASE}/get-carded`, hdr);
      console.log(
        `GET /get-carded with header ${hn} => ${r.status || r.error}`
      );
      if (r.json && r.status !== 403) {
        console.log("Success (header):", hn, r.json);
        return true;
      }
      if (r.text && !r.text.includes("Hmmm...this doesn't look right.")) {
        console.log("Unique response (header):", hn, r.text);
        return true;
      }
    }

    // 2) Try cookie placement
    for (const cn of cookieNames) {
      const hdr = {
        Cookie: `${cn}=${encodeURIComponent(stampValue)}`,
        Authorization: `Bearer ${TOKEN}`,
      };
      const r = await req("GET", `${BASE}/get-carded`, hdr);
      console.log(
        `GET /get-carded with cookie ${cn} => ${r.status || r.error}`
      );
      if (r.json && r.status !== 403) {
        console.log("Success (cookie):", cn, r.json);
        return true;
      }
      if (r.text && !r.text.includes("Hmmm...this doesn't look right.")) {
        console.log("Unique response (cookie):", cn, r.text);
        return true;
      }
    }

    // 3) Try as query param
    let rq = await req(
      "GET",
      `${BASE}/get-carded?stamp=${encodeURIComponent(stampValue)}`,
      { Authorization: `Bearer ${TOKEN}` }
    );
    console.log("GET /get-carded?stamp=... =>", rq.status || rq.error);
    if (rq.json && rq.status !== 403) {
      console.log("Success (query param):", rq.json);
      return true;
    }
    if (rq.text && !rq.text.includes("Hmmm...this doesn't look right.")) {
      console.log("Unique response (query param):", rq.text);
      return true;
    }

    // 4) Try POST body placements
    const bodies = [
      JSON.stringify({ stamp: stampValue }),
      JSON.stringify({ entry_stamp: stampValue }),
      JSON.stringify({ token: TOKEN, stamp: stampValue }),
      JSON.stringify({ authorization: `Bearer ${TOKEN}`, stamp: stampValue }),
    ];
    for (const b of bodies) {
      const r = await req(
        "POST",
        `${BASE}/get-carded`,
        { "Content-Type": "application/json" },
        b
      );
      console.log(
        `POST /get-carded body ${b.slice(0, 80)}... => ${r.status || r.error}`
      );
      if (r.json && r.status !== 403) {
        console.log("Success (POST body):", r.json);
        return true;
      }
      if (r.text && !r.text.includes("Hmmm...this doesn't look right.")) {
        console.log("Unique response (POST body):", r.text);
        return true;
      }
    }

    console.log("No luck with this stamp value:", stampValue);
    return false;
  }
})();
