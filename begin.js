// node begin.js
const fetch = global.fetch || require("node-fetch");

(async () => {
  const res = await fetch("https://workwithus.lucioai.com/begin", {
    method: "GET",
  });
  const text = await res.text();
  console.log("Status:", res.status);
  try {
    console.log("JSON:", JSON.parse(text));
  } catch {
    console.log("Body:\n", text);
  }
})();
