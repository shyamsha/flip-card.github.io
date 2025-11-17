// enumerate_carded.js
// Node 18+ (native fetch). Usage: node enumerate_carded.js

import crypto from "crypto";

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU3lhbSBLdW1hciBDaGVydWt1cmkiLCJlbWFpbCI6InNoeWFta3VtYXI5N0BsaXZlLmNvbSIsImRhdGUiOiIyMDI1LTExLTE3IDA5OjIzOjM5In0.TBVL45HEtXqw5gMTyld66v-CIh3fphOnMx-sCR1uGJ4";
const BASE = "https://workwithus.lucioai.com";

function b64urlDecode(s) {
  try {
    s = s.split(".")[1] || "";
    s = s.replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    return Buffer.from(s, "base64").toString();
  } catch (e) {
    return "";
  }
}

// parse payload for derived values
const payloadRaw = b64urlDecode(TOKEN);
let payload = {};
try {
  payload = JSON.parse(payloadRaw || "{}");
} catch (e) {
  payload = {};
}

const nameB64 = payload.name
  ? Buffer.from(payload.name).toString("base64")
  : "";
const emailB64 = payload.email
  ? Buffer.from(payload.email).toString("base64")
  : "";
const dateVal = payload.date || "";

const endpoints = [
  "/get-carded",
  "/get-card",
  "/carded",
  "/card",
  "/bouncer",
  "/get-bouncer",
  "/stamp",
  "/take-stamp",
  "/entry-stamp",
  "/get-stamp",
  "/get-stamped",
  "/stamp-me",
  "/get-stamped",
  "/verify",
  "/checkin",
  "/check-in",
  "/enter",
  "/admit",
  "/admit-me",
  "/card/check",
  "/card/verify",
  "/bouncer/check",
];

const headerNames = [
  "Authorization",
  "authorization",
  "X-Entry-Stamp",
  "X-Entry-Stamp".toLowerCase(),
  "X-Stamp",
  "X-Auth-Token",
  "X-Token",
  "Entry-Stamp",
  "Stamp",
  "X-Bouncer",
  "X-Auth",
  "Auth",
  "x-entry",
  "x-stamp",
];

const headerValues = [
  TOKEN,
  "stamped",
  "stamped:true",
  "yes",
  "true",
  "got-stamp",
  nameB64,
  emailB64,
  dateVal,
  Buffer.from(dateVal || "").toString("base64"),
  Buffer.from(TOKEN).toString("base64"),
];

const commonHeaders = {
  Accept: "application/json, text/plain, */*",
  "User-Agent": "enumerator/1.0 (node)",
};

async function tryRequest(method = "GET", url, headers = {}, body = undefined) {
  try {
    const opts = {
      method,
      headers: { ...commonHeaders, ...headers },
      redirect: "follow",
    };
    if (body) opts.body = body;
    const res = await fetch(url, opts);
    const text = await res.text();
    return {
      status: res.status,
      text,
      headers: Object.fromEntries(res.headers.entries()),
    };
  } catch (err) {
    return { error: err.message };
  }
}

(async () => {
  console.log("Parsed JWT payload:", payload);
  // 1) quick check on root and obvious endpoints
  for (const ep of ["/", "/get-started", "/get-carded"]) {
    const r = await tryRequest("GET", BASE + ep);
    console.log(`GET ${ep} -> ${r.status || "err"} (${r.error || "ok"})`);
  }

  // 2) try permutations
  for (const ep of endpoints) {
    const url = BASE + ep;
    // try Authorization header (Bearer)
    let r = await tryRequest("GET", url, { Authorization: `Bearer ${TOKEN}` });
    if (
      r.status !== 403 ||
      (r.text && !r.text.includes("Hmmm...this doesn't look right"))
    ) {
      console.log("Unique response at GET", url, r.status);
      console.log(r.text.slice(0, 2000));
      process.exit(0);
    }
    // try many header names and values
    for (const hn of headerNames) {
      for (const hv of headerValues) {
        const hdr = {};
        hdr[hn] = hv;
        r = await tryRequest("GET", url, hdr);
        if (
          r.status !== 403 ||
          (r.text && !r.text.includes("Hmmm...this doesn't look right"))
        ) {
          console.log(
            "Unique response at GET",
            url,
            "header",
            hn,
            "=",
            hv,
            "status",
            r.status
          );
          console.log(r.text.slice(0, 4000));
          process.exit(0);
        }
      }
    }
    // try token in query param
    let r2 = await tryRequest(
      "GET",
      url + `?token=${encodeURIComponent(TOKEN)}`
    );
    if (
      r2.status !== 403 ||
      (r2.text && !r2.text.includes("Hmmm...this doesn't look right"))
    ) {
      console.log("Unique response at GET", url + `?token=...`, r2.status);
      console.log(r2.text.slice(0, 2000));
      process.exit(0);
    }
    // try POST body patterns
    const bodies = [
      JSON.stringify({ token: TOKEN }),
      JSON.stringify({ authorization: `Bearer ${TOKEN}` }),
      JSON.stringify({ stamp: "stamped", token: TOKEN }),
      JSON.stringify({ arm: "stamped", token: TOKEN }),
    ];
    for (const body of bodies) {
      const r3 = await tryRequest(
        "POST",
        url,
        { "Content-Type": "application/json" },
        body
      );
      if (
        r3.status !== 403 ||
        (r3.text && !r3.text.includes("Hmmm...this doesn't look right"))
      ) {
        console.log(
          "Unique response at POST",
          url,
          "body",
          body,
          "status",
          r3.status
        );
        console.log(r3.text.slice(0, 2000));
        process.exit(0);
      }
    }
    // small delay to be polite
    await new Promise((r) => setTimeout(r, 250));
  }

  console.log(
    "\nAll permutations tried — nothing unique found. Two likely causes:"
  );
  console.log(
    "1) the server expects a one-time/stamp value that you must obtain from another endpoint (e.g. /stamp or hidden page), or"
  );
  console.log(
    "2) the server is rate-limiting or blocking non-browser clients; try from a real browser session or inspect network traffic while interacting with the site UI."
  );
  process.exit(0);
})();
