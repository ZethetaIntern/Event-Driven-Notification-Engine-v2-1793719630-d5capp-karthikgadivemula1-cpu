const express = require("express");

function createApp() {
  const app = express();
  app.use(express.json({ limit: "100kb" }));

  // Prototype storage: events reset whenever the server restarts.
  const events = [];
  let nextEventId = 1;

  app.get("/", (_req, res) => {
    res.json({
      success: true,
      message: "Event-Driven Notification Engine",
      status: "Running"
    });
  });

  app.get("/health", (_req, res) => {
    res.status(200).json({
      success: true,
      status: "UP",
      service: "Notification Engine"
    });
  });

  app.post("/events", (req, res) => {
    const { eventType, recipient, message } = req.body || {};
    const missing = [];

    if (typeof eventType !== "string" || !eventType.trim()) missing.push("eventType");
    if (typeof recipient !== "string" || !recipient.trim()) missing.push("recipient");
    if (typeof message !== "string" || !message.trim()) missing.push("message");

    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        requiredFields: missing
      });
    }

    const event = {
      id: nextEventId++,
      eventType: eventType.trim(),
      recipient: recipient.trim(),
      message: message.trim(),
      status: "RECEIVED",
      createdAt: new Date().toISOString(),
      processedAt: null,
      error: null
    };

    events.push(event);
    return res.status(201).json({
      success: true,
      message: "Event received successfully",
      event
    });
  });

  app.get("/events", (req, res) => {
    const status = typeof req.query.status === "string"
      ? req.query.status.toUpperCase()
      : null;

    const results = status
      ? events.filter((event) => event.status === status)
      : events;

    return res.status(200).json({
      success: true,
      count: results.length,
      events: results
    });
  });

  app.get("/events/:id", (req, res) => {
    const id = Number(req.params.id);
    const event = events.find((item) => item.id === id);

    if (!Number.isInteger(id) || id < 1 || !event) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    return res.status(200).json({ success: true, event });
  });

  app.post("/events/:id/process", (req, res) => {
    const id = Number(req.params.id);
    const event = events.find((item) => item.id === id);

    if (!Number.isInteger(id) || id < 1 || !event) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    if (event.status === "SENT") {
      return res.status(409).json({
        success: false,
        error: "Event has already been processed",
        event
      });
    }

    // Demo processing only: this marks the event as SENT.
    // No email, SMS, or push notification is actually delivered.
    event.status = "SENT";
    event.processedAt = new Date().toISOString();

    return res.status(200).json({
      success: true,
      message: "Event processed in demo mode",
      deliveryMode: "SIMULATED",
      event
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: "Route not found",
      path: req.path
    });
  });

  app.use((err, _req, res, _next) => {
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({
        success: false,
        error: "Invalid JSON request body"
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  });

  return app;
}

module.exports = { createApp };
