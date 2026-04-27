# 💳 Payment Service

Payment microservice for the **Event Ticket Booking Platform** — Cloud Computing Assignment (EC7205).

## Architecture

```
Client → API Gateway → Payment Service → PostgreSQL
                              ↕
                          RabbitMQ (async messaging)
                              ↕
                       Booking Service
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js 18 |
| Framework | Express.js |
| Database | PostgreSQL 15 (Sequelize ORM) |
| Message Queue | RabbitMQ 3 |
| Auth | JWT (shared secret with User Service) |
| Security | Helmet.js, CORS, Rate Limiting |
| Containerization | Docker + Docker Compose |

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/payments/health` | Health check | ❌ |
| `POST` | `/api/payments` | Create payment | ✅ |
| `GET` | `/api/payments/:id` | Get payment by ID | ✅ |
| `GET` | `/api/payments/booking/:bookingId` | Get by booking ID | ✅ |
| `GET` | `/api/payments/user/me` | Get my payments | ✅ |
| `POST` | `/api/payments/:id/refund` | Refund payment | ✅ |

## Message Queue Events

| Queue | Direction | Event |
|-------|-----------|-------|
| `booking.payment.request` | ← Consume | Payment request from Booking Service |
| `payment.completed` | → Publish | Payment succeeded |
| `payment.failed` | → Publish | Payment failed |
| `payment.refunded` | → Publish | Payment refunded |

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (Payment + PostgreSQL + RabbitMQ)
docker-compose up --build

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Option 2: Run Locally

**Prerequisites:** PostgreSQL and RabbitMQ must be running locally.

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL and RabbitMQ credentials

# Start development server (with hot reload)
npm run dev

# Start production server
npm start
```

## Project Structure

```
payment-service/
├── src/
│   ├── config/
│   │   ├── db.js              # PostgreSQL connection (Sequelize)
│   │   ├── rabbitmq.js        # RabbitMQ connection & channels
│   │   └── env.js             # Environment configuration
│   ├── models/
│   │   └── Payment.js         # Payment model (Sequelize)
│   ├── controllers/
│   │   └── paymentController.js
│   ├── routes/
│   │   └── paymentRoutes.js
│   ├── services/
│   │   ├── paymentProcessor.js  # Simulated Stripe gateway
│   │   └── messageQueue.js      # RabbitMQ pub/sub service
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── errorHandler.js      # Global error handler
│   └── app.js                   # Entry point
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── package.json
```

## Testing with cURL

```bash
# Health check
curl http://localhost:5003/api/payments/health

# Create a payment (replace TOKEN with a valid JWT)
curl -X POST http://localhost:5003/api/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "bookingId": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 49.99,
    "currency": "USD",
    "paymentMethod": "credit_card",
    "cardLast4": "4242"
  }'

# Get payment by ID
curl http://localhost:5003/api/payments/PAYMENT_ID \
  -H "Authorization: Bearer TOKEN"

# Refund a payment
curl -X POST http://localhost:5003/api/payments/PAYMENT_ID/refund \
  -H "Authorization: Bearer TOKEN"
```

## Test Cards

| Card Last 4 | Behavior |
|-------------|----------|
| `4242` | ✅ Success |
| `0000` | ❌ Declined (Insufficient funds) |
| `1111` | ❌ Gateway timeout |
| Any other | ✅ Success |

## Cloud-Native Features

- **Scalability**: Stateless service, horizontal scaling via Docker replicas
- **High Availability**: Health checks, auto-reconnection, graceful shutdown
- **Security**: JWT auth, Helmet.js, rate limiting, input validation, non-root Docker user
- **Async Communication**: RabbitMQ event-driven messaging
- **Deployment**: Docker + Docker Compose with health-based startup ordering
