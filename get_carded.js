// // get_carded.js
// const token =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU3lhbSBLdW1hciBDaGVydWt1cmkiLCJlbWFpbCI6InNoeWFta3VtYXI5N0BsaXZlLmNvbSIsImRhdGUiOiIyMDI1LTExLTE3IDEwOjI4OjU0In0.epf_5oMsgq-EvEPupQOlO9UKFOsH_1R4dPXmh7v54ZI";

// (async () => {
//   const res = await fetch("https://workwithus.lucioai.com/get-carded", {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   });

//   const text = await res.text();
//   console.log("Status:", res.status);
//   try {
//     console.log(JSON.parse(text));
//   } catch {
//     console.log(text);
//   }
// })();
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU3lhbSBLdW1hciBDaGVydWt1cmkiLCJlbWFpbCI6InNoeWFta3VtYXI5N0BsaXZlLmNvbSIsImRhdGUiOiIyMDI1LTExLTE3IDEwOjI4OjU0In0.epf_5oMsgq-EvEPupQOlO9UKFOsH_1R4dPXmh7v54ZI";

(async () => {
  const res = await fetch("https://workwithus.lucioai.com/get-carded", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
  });

  const text = await res.text();
  console.log("Status:", res.status);
  try {
    console.log(JSON.parse(text));
  } catch {
    console.log(text);
  }
})();
