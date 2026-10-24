
const express = require("express");
const pool = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Event-Driven Notification Engine",
    status: "Running"
  });
});

// Health check, including database connection
app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({
      success: true,
      status: "UP",
      service: "Notification Engine",
      database: "CONNECTED"
    });
  } catch (error) {
    console.error("Health check failed:", error.message);
    res.status(503).json({
      success: false,
      status: "DOWN",
      database: "DISCONNECTED"
    });
  }
});

// Temporary route test
app.post("/test-route", (req, res) => {
  res.json({
    success: true,
    message: "Test route works"
  });
});

// Create an event
app.post("/events", async (req, res, next) => {
  try {
    const { eventType, recipient, message } = req.body || {};

    if (
      typeof eventType !== "string" || !eventType.trim() ||
      typeof recipient !== "string" || !recipient.trim() ||
      typeof message !== "string" || !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        error: "eventType, recipient, and message are required"
      });
    }

    const result = await pool.query(
      `INSERT INTO notification_events
       (event_type, recipient, message)
       VALUES ($1, $2, $3)
       RETURNING id, event_type, recipient, message, status,
                 created_at, processed_at`,
      [eventType.trim(), recipient.trim(), message.trim()]
    );

    const row = result.rows[0];

    return res.status(201).json({
      success: true,
      message: "Event created successfully",
      event: {
        id: row.id,
        eventType: row.event_type,
        recipient: row.recipient,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
        ...(row.processed_at && { processedAt: row.processed_at })
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get all events
app.get("/events", async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT id, event_type, recipient, message, status,
              created_at, processed_at
       FROM notification_events
       ORDER BY id`
    );

    const events = result.rows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      recipient: row.recipient,
      message: row.message,
      status: row.status,
      createdAt: row.created_at,
      ...(row.processed_at && { processedAt: row.processed_at })
    }));

    return res.json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    next(error);
  }
});

// Get one event by ID
app.get("/events/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        error: "A valid event ID is required"
      });
    }

    const result = await pool.query(
      `SELECT id, event_type, recipient, message, status,
              created_at, processed_at
       FROM notification_events WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Event not found"
      });
    }

    const row = result.rows[0];

    return res.json({
      success: true,
      event: {
        id: row.id,
        eventType: row.event_type,
        recipient: row.recipient,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
        ...(row.processed_at && { processedAt: row.processed_at })
      }
    });
  } catch (error) {
    next(error);
  }
});

// Process an event (simulated delivery only)
app.post("/events/:id/process", async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        error: "A valid event ID is required"
      });
    }

    const result = await pool.query(
      `UPDATE notification_events
       SET status = 'SENT', processed_at = NOW()
       WHERE id = $1 AND status = 'RECEIVED'
       RETURNING id, event_type, recipient, message, status,
                 created_at, processed_at`,
      [id]
    );

    if (result.rows.length === 0) {
      const existing = await pool.query(
        "SELECT status FROM notification_events WHERE id = $1",
        [id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Event not found"
        });
      }

      return res.status(409).json({
        success: false,
        error: `Event cannot be processed from status ${existing.rows[0].status}`
      });
    }

    const row = result.rows[0];

    console.log("Demo notification processed:", row.id);

    return res.json({
      success: true,
      message: "Demo notification processed successfully",
      event: {
        id: row.id,
        eventType: row.event_type,
        recipient: row.recipient,
        message: row.message,
        status: row.status,
        createdAt: row.created_at,
        processedAt: row.processed_at
      }
    });
  } catch (error) {
    next(error);
  }
});

// Handle invalid JSON
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: "Invalid JSON request body"
    });
  }

  console.error("Request failed:", err.message);

  return res.status(500).json({
    success: false,
    error: "Internal server error"
  });
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
const server = app.listen(PORT, () => {
  console.log(`Notification Engine running at http://localhost:${PORT}`);
});

// Gracefully close the database pool when the server stops
function shutdown() {
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
