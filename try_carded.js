// try_carded.js
// Node 18+ required (native fetch).
// Usage: node try_carded.js

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU3lhbSBLdW1hciBDaGVydWt1cmkiLCJlbWFpbCI6InNoeWFta3VtYXI5N0BsaXZlLmNvbSIsImRhdGUiOiIyMDI1LTExLTE3IDA5OjIzOjM5In0.TBVL45HEtXqw5gMTyld66v-CIh3fphOnMx-sCR1uGJ4";
const BASE = "https://workwithus.lucioai.com/get-carded";

const commonHeaders = {
  Accept: "application/json,text/plain,*/*",
  "User-Agent": "node-fetch/1.0 (CTF-agent)",
  Referer: "https://workwithus.lucioai.com/",
};

const attempts = [
  // 1. GET with Bearer
  { method: "GET", url: BASE, headers: { Authorization: `Bearer ${TOKEN}` } },

  // 2. POST empty JSON with Bearer
  {
    method: "POST",
    url: BASE,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  },

  // 3. POST with token in JSON body
  {
    method: "POST",
    url: BASE,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: TOKEN }),
  },

  // 4. POST with field "authorization" in body (some apps expect this)
  {
    method: "POST",
    url: BASE,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authorization: `Bearer ${TOKEN}` }),
  },

  // 5. GET with token as query param
  { method: "GET", url: BASE + `?token=${encodeURIComponent(TOKEN)}` },

  // 6. GET with a guessed "stamp" query param
  { method: "GET", url: BASE + "?stamp=1" },

  // 7. POST with "stamp" in body
  {
    method: "POST",
    url: BASE,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stamp: "got-stamp", token: TOKEN }),
  },

  // 8. Custom header X-Entry-Stamp (from puzzle text)
  {
    method: "GET",
    url: BASE,
    headers: { "X-Entry-Stamp": "true", Authorization: `Bearer ${TOKEN}` },
  },

  // 9. Custom header X-Auth-Token
  { method: "GET", url: BASE, headers: { "X-Auth-Token": TOKEN } },

  // 10. Cookie with token
  { method: "GET", url: BASE, headers: { Cookie: `auth=${TOKEN}` } },

  // 11. POST form-encoded token
  {
    method: "POST",
    url: BASE,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `token=${encodeURIComponent(TOKEN)}`,
  },

  // 12. POST with both header + body stamp
  {
    method: "POST",
    url: BASE,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "X-Entry-Stamp": "yes",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stamp: true }),
  },

  // 13. GET with Referer+Origin set (some servers check Origin/Referer)
  {
    method: "GET",
    url: BASE,
    headers: {
      Origin: "http://localhost:5173",
      Referer: "http://localhost:5173/",
      Authorization: `Bearer ${TOKEN}`,
    },
  },

  // 14. GET with Accept: text/html (sometimes different route)
  {
    method: "GET",
    url: BASE,
    headers: { Accept: "text/html", Authorization: `Bearer ${TOKEN}` },
  },

  // 15. POST with a plausible "arm" field (puzzle wording referenced 'show out your arm')
  {
    method: "POST",
    url: BASE,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ arm: "stamped", token: TOKEN }),
  },
];

async function runOne(attempt, idx) {
  const headers = { ...commonHeaders, ...(attempt.headers || {}) };
  const opts = {
    method: attempt.method,
    headers,
    body: attempt.body,
    redirect: "follow",
  };
  console.log(`\n=== Attempt ${idx + 1} ===`);
  console.log(`${opts.method} ${attempt.url}`);
  console.log("Headers:", headers);
  if (opts.body)
    console.log("Body:", opts.body.slice ? opts.body.slice(0, 400) : opts.body);

  try {
    const res = await fetch(attempt.url, opts);
    const status = res.status;
    let text;
    try {
      text = await res.text();
    } catch (e) {
      text = `<couldn't read body: ${e.message}>`;
    }
    console.log("Status:", status);
    // Print first 2000 chars for safety
    console.log(
      "Response body (first 2000 chars):\n",
      text ? text.slice(0, 2000) : ""
    );
  } catch (err) {
    console.error("Request error:", err.message);
  }
}

(async () => {
  for (let i = 0; i < attempts.length; i++) {
    await runOne(attempts[i], i);
    // wait a bit between attempts (avoid rate-limiting)
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(
    "\nAll attempts complete. Paste the most interesting response (JSON or text) here and I'll decode the next step."
  );
})();
