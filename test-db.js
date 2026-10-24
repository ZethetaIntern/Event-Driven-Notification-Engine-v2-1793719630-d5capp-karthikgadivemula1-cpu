
const pool = require("./db");

async function createTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notification_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        recipient VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(30) NOT NULL DEFAULT 'RECEIVED',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        processed_at TIMESTAMPTZ
      )
    `);

    console.log("Notification events table created successfully!");
  } catch (error) {
    console.error("Table creation failed:", error.message);
  } finally {
    await pool.end();
  }
}

createTable();
