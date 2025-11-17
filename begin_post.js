// begin_post.js (Node 18+)
const payload = {
  name: "Syam Kumar Cherukuri",
  email: "shyamkumar97@live.com",
};

(async () => {
  try {
    const res = await fetch("https://workwithus.lucioai.com/begin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const status = res.status;
    const text = await res.text();

    console.log("Status:", status);
    try {
      console.log("JSON:", JSON.parse(text));
    } catch {
      console.log("Body:", text);
    }
  } catch (err) {
    console.error("Request failed:", err.message);
  }
})();
