
@'
const express = require("express");

const app = express();
const PORT = 3000;

app.use(express.json());

const events = [];

app.get("/", (req, res) => {
  res.json({
    message: "Event-Driven Notification Engine",
    status: "Running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "UP",
    service: "Notification Engine"
  });
});

app.post("/events", (req, res) => {
  const { eventType, recipient, message } = req.body;

  if (!eventType || !recipient || !message) {
    return res.status(400).json({
      success: false,
      error: "eventType, recipient, and message are required"
    });
  }

  const event = {
    id: events.length + 1,
    eventType,
    recipient,
    message,
    status: "RECEIVED",
    createdAt: new Date().toISOString()
  };

  events.push(event);

  console.log("New event received:", event);

  res.status(201).json({
    success: true,
    message: "Event received successfully",
    event
  });
});

app.get("/events", (req, res) => {
  res.json({
    success: true,
    count: events.length,
    events
  });
});

app.listen(PORT, () => {
  console.log(
    `Notification Engine running at http://localhost:${PORT}`
  );
});
'@ | Set-Content .\server.js -Encoding utf8
