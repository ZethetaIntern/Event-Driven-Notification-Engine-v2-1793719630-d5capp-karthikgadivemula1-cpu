# Event-Driven Notification Engine

**Project resubmission edition — Zetheta project work experience**

## 1. Overview
This project demonstrates a REST API that accepts notification events, validates required fields, stores them temporarily, and lets a client process and inspect event status. It is a learning prototype, not a production notification platform.

## 2. Problem statement
Applications often need to notify users after business events such as an order being placed or a payment being completed. A notification engine provides a consistent interface for accepting those events and tracking processing status.

## 3. Features
- `GET /` — service welcome response
- `GET /health` — health check
- `POST /events` — validate and accept an event
- `GET /events` — list events; optional `?status=RECEIVED` filter
- `GET /events/:id` — retrieve one event
- `POST /events/:id/process` — simulate processing and mark the event `SENT`
- JSON validation errors and unknown-route handling
- Automated API tests using Node's built-in test runner

## 4. Technology
- Node.js (20 or newer recommended)
- Express.js
- JSON over HTTP
- Node.js built-in `node:test` and `fetch` for tests

## 5. Architecture and event flow
1. A client sends an event to `POST /events`.
2. The API validates `eventType`, `recipient`, and `message`.
3. A valid event is assigned an ID and starts with status `RECEIVED`.
4. A client requests `POST /events/:id/process`.
5. In this demo, processing is simulated and status becomes `SENT`.
6. The client can inspect the event with `GET /events/:id`.

## 6. Run locally
```bash
npm install
npm start
```
The default address is `http://localhost:3000`.

Run automated tests:
```bash
npm test
```

## 7. API examples

Create an event:
```http
POST /events
Content-Type: application/json
```
```json
{
  "eventType": "OrderPlaced",
  "recipient": "customer@example.com",
  "message": "Your order has been confirmed"
}
```

Process an event (replace `1` with the ID returned by the create response):
```http
POST /events/1/process
```

List events:
```http
GET /events
```

Filter by status:
```http
GET /events?status=RECEIVED
```

## 8. Validation and error handling
- Missing or blank required fields return HTTP `400`.
- An unknown event ID returns HTTP `404`.
- A repeated process request for an already processed event returns HTTP `409`.
- Unknown routes return a JSON `404`.
- Malformed JSON returns HTTP `400`.

## 9. Testing checklist
- [ ] `GET /health` returns HTTP 200 and `status: UP`.
- [ ] A valid event returns HTTP 201 and status `RECEIVED`.
- [ ] Missing fields return HTTP 400.
- [ ] A known event can be retrieved.
- [ ] Processing changes status to `SENT`.
- [ ] Processing an already processed event returns HTTP 409.
- [ ] Unknown routes and event IDs return HTTP 404.
- [ ] `npm test` passes on the machine used for submission.

## 10. Limitations — be transparent
- Events are stored in memory and are lost when the process restarts.
- Processing is simulated; no email, SMS, or push notification is delivered.
- There is no message broker, database, authentication, or retry/dead-letter system.
- The prototype has not been load-tested or deployed as a production service.

## 11. Future improvements
1. Persist events in PostgreSQL.
2. Use RabbitMQ or another message broker for asynchronous delivery.
3. Add retry with backoff and a dead-letter queue.
4. Integrate a real email/SMS provider using environment-based secrets.
5. Add authentication, structured logging, metrics, and rate limiting.
6. Containerize the service and add CI checks.

## 12. Submission notes
Before resubmitting, run `npm install` and `npm test`, start the server, and capture genuine screenshots of the test results and API requests. Include the actual GitHub repository URL and any rubric-required artifacts. Do not claim production delivery, database persistence, or broker integration unless you implement and verify them.
