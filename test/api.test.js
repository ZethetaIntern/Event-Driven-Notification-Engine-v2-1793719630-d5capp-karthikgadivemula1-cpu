const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

async function withServer(run) {
  const app = createApp();
  const server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    await run(baseUrl);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve()))
    );
  }
}

test("GET /health returns UP", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.status, "UP");
    assert.equal(body.service, "Notification Engine");
  });
});

test("POST /events rejects missing required fields", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "OrderPlaced" })
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.success, false);
    assert.ok(body.requiredFields.includes("recipient"));
    assert.ok(body.requiredFields.includes("message"));
  });
});

test("event can be created, retrieved, and processed once", async () => {
  await withServer(async (baseUrl) => {
    const createResponse = await fetch(`${baseUrl}/events`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: "OrderPlaced",
        recipient: "customer@example.com",
        message: "Your order has been confirmed"
      })
    });
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(created.event.status, "RECEIVED");

    const id = created.event.id;
    const processResponse = await fetch(`${baseUrl}/events/${id}/process`, {
      method: "POST"
    });
    const processed = await processResponse.json();
    assert.equal(processResponse.status, 200);
    assert.equal(processed.event.status, "SENT");
    assert.equal(processed.deliveryMode, "SIMULATED");

    const secondProcess = await fetch(`${baseUrl}/events/${id}/process`, {
      method: "POST"
    });
    assert.equal(secondProcess.status, 409);

    const getResponse = await fetch(`${baseUrl}/events/${id}`);
    const retrieved = await getResponse.json();
    assert.equal(getResponse.status, 200);
    assert.equal(retrieved.event.status, "SENT");
  });
});

test("unknown routes return a JSON 404", async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/does-not-exist`);
    const body = await response.json();
    assert.equal(response.status, 404);
    assert.equal(body.error, "Route not found");
  });
});
