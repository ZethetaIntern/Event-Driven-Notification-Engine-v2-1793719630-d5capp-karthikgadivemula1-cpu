
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// In-memory event storage (data resets when server restarts)
const events = [];
let nextEventId = 1;

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Event-Driven Notification Engine",
    status: "Running"
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "UP",
    service: "Notification Engine"
  });
});

// Temporary route test
app.post("/test-route", (req, res) => {
  res.json({
    success: true,
    message: "Test route works"
  });
});

// Create an event
app.post("/events", (req, res) => {
  const { eventType, recipient, message } = req.body || {};

  if (
    typeof eventType !== "string" ||
    !eventType.trim() ||
    typeof recipient !== "string" ||
    !recipient.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    return res.status(400).json({
      success: false,
      error: "eventType, recipient, and message are required"
    });
  }

  const event = {
    id: nextEventId++,
    eventType: eventType.trim(),
    recipient: recipient.trim(),
    message: message.trim(),
    status: "RECEIVED",
    createdAt: new Date().toISOString()
  };

  events.push(event);

  return res.status(201).json({
    success: true,
    message: "Event created successfully",
    event
  });
});

// Get all events
app.get("/events", (req, res) => {
  res.json({
    success: true,
    count: events.length,
    events
  });
});

// Get one event by ID
app.get("/events/:id", (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((item) => item.id === id);

  if (!Number.isInteger(id) || id < 1 || !event) {
    return res.status(404).json({
      success: false,
      error: "Event not found"
    });
  }

  return res.json({
    success: true,
    event
  });
});

// Process an event (simulated delivery only)
app.post("/events/:id/process", (req, res) => {
  const id = Number(req.params.id);
  const event = events.find((item) => item.id === id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      success: false,
      error: "A valid event ID is required"
    });
  }

  if (!event) {
    return res.status(404).json({
      success: false,
      error: "Event not found"
    });
  }

  if (event.status !== "RECEIVED") {
    return res.status(409).json({
      success: false,
      error: `Event cannot be processed from status ${event.status}`
    });
  }

  // Demo only: no real email or SMS is sent.
  event.status = "SENT";
  event.processedAt = new Date().toISOString();

  console.log("Demo notification processed:", event.id);

  return res.json({
    success: true,
    message: "Demo notification processed successfully",
    event
  });
});

// Handle invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON request body"
    });
  }

  return next(err);
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.path
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Notification Engine running at http://localhost:${PORT}`);
});
