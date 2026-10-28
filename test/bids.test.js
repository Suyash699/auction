const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const app = require("../src/app");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("rejects malformed bid fields before accessing the database", async () => {
  const response = await fetch(`${baseUrl}/bid`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      auction_id: "not-an-object-id",
      user_id: "665f1a2b3c4d5e6f708192a4",
      amount: 125,
    }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /ObjectIds/);
});

test("rejects non-numeric and non-positive amounts", async () => {
  for (const amount of ["125", 0, -1, Number.NaN]) {
    const response = await fetch(`${baseUrl}/bid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auction_id: "665f1a2b3c4d5e6f708192a3",
        user_id: "665f1a2b3c4d5e6f708192a4",
        amount,
      }),
    });

    assert.equal(response.status, 400);
  }
});

test("rejects an invalid idempotency key before accessing the database", async () => {
  const response = await fetch(`${baseUrl}/bid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "x".repeat(129),
    },
    body: JSON.stringify({
      auction_id: "665f1a2b3c4d5e6f708192a3",
      user_id: "665f1a2b3c4d5e6f708192a4",
      amount: 125,
    }),
  });

  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /Idempotency-Key/);
});
