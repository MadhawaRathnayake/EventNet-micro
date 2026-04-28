# 🎫 EventNet — Event Ticket Booking Platform

A cloud-native event ticket booking platform built with a **microservice architecture**, deployed on **Azure Kubernetes Service (AKS)** with a fully automated **CI/CD pipeline** via GitHub Actions.

---

## 📐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        NGINX Ingress                            │
│                    (85.211.224.91 — AKS)                        │
└────────┬──────────┬──────────┬───────────┬──────────────────────┘
         │          │          │           │
    ┌────▼───┐ ┌────▼───┐ ┌───▼────┐ ┌────▼─────┐
    │Frontend│ │  User  │ │ Event  │ │ Payment  │
    │Next.js │ │Service │ │Service │ │ Service  │
    │ :3000  │ │ :5000  │ │ :5002  │ │  :5003   │
    └────────┘ └────┬───┘ └───┬────┘ └────┬─────┘
                    │         │           │
                    │    ┌────▼─────┐     │        ┌──────────┐
                    │    │ Booking  │◄────┘◄───────│ RabbitMQ │
                    │    │ Service  │──────────────►│  (AMQP)  │
                    │    │  :5001   │               └──────────┘
                    │    └────┬─────┘
                    │         │
               ┌────▼─────────▼────┐
               │   PostgreSQL DBs  │
               │  (Azure Flexible) │
               └───────────────────┘
```

| Component | Tech Stack | Port |
|-----------|-----------|------|
| **Frontend** | Next.js 16, NextAuth, TailwindCSS | `3000` |
| **User Service** | Express 5, Sequelize, PostgreSQL, JWT + Google OAuth | `5000` |
| **Event Service** | Express 5, pg (raw), PostgreSQL, RabbitMQ | `5002` |
| **Payment Service** | Express 4, Sequelize, PostgreSQL, RabbitMQ | `5003` |
| **Booking Service** | Express 4, pg (raw), PostgreSQL, RabbitMQ | `5001` |

---

## 📋 Prerequisites

Before running locally, make sure you have:

- [Node.js](https://nodejs.org/) v18+ (v20 recommended)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) v4+
- [Git](https://git-scm.com/)
- A PostgreSQL instance (local or cloud) — or use Docker Compose (see below)
- _(Optional)_ A RabbitMQ instance — required for Booking ↔ Payment communication

---

## 🚀 Quick Start — Run Everything with Docker

The fastest way to get the full stack running locally using each service's individual Dockerfile.

### 1. Clone the Repository

```bash
git clone https://github.com/<your-org>/event_book_microservice.git
cd event_book_microservice
```

### 2. Create a Docker Network

All services need to communicate with each other on the same network:

```bash
docker network create eventnet
```

### 3. Start Infrastructure (PostgreSQL + RabbitMQ)

```bash
# PostgreSQL for User Service
docker run -d --name user-postgres --network eventnet \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=users_db \
  -p 5432:5432 \
  postgres:16-alpine

# PostgreSQL for Event Service
docker run -d --name event-postgres --network eventnet \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=event_service_db \
  -p 5433:5432 \
  postgres:16-alpine

# PostgreSQL for Payment Service
docker run -d --name payment-postgres --network eventnet \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=payment_service_db \
  -p 5434:5432 \
  postgres:15-alpine

# PostgreSQL for Booking Service
docker run -d --name booking-postgres --network eventnet \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=booking_service_db \
  -p 5435:5432 \
  postgres:16-alpine

# RabbitMQ (needed by Event, Payment, and Booking services)
docker run -d --name rabbitmq --network eventnet \
  -e RABBITMQ_DEFAULT_USER=guest \
  -e RABBITMQ_DEFAULT_PASS=guest \
  -p 5672:5672 \
  -p 15672:15672 \
  rabbitmq:3-management-alpine
```

> **💡 Tip:** RabbitMQ Management UI will be available at http://localhost:15672 (guest/guest)

### 4. Build & Run User Service

```bash
docker build -t user-service ./user_service

docker run -d --name user-service --network eventnet \
  -e DATABASE_URL=postgresql://postgres:postgres@user-postgres:5432/users_db \
  -e JWT_SECRET=your_jwt_secret_key_here \
  -e GOOGLE_CLIENT_ID=your_google_client_id \
  -p 5000:5000 \
  user-service
```

### 5. Build & Run Event Service

```bash
docker build -t event-service ./event_service

docker run -d --name event-service --network eventnet \
  -e PORT=5002 \
  -e DB_USER=postgres \
  -e DB_HOST=event-postgres \
  -e DB_NAME=event_service_db \
  -e DB_PASSWORD=postgres \
  -e DB_PORT=5432 \
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672 \
  -p 5002:5002 \
  event-service
```

### 6. Build & Run Payment Service

```bash
docker build -t payment-service ./payment_service

docker run -d --name payment-service --network eventnet \
  -e PORT=5003 \
  -e NODE_ENV=development \
  -e DB_HOST=payment-postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=payment_service_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672 \
  -e JWT_SECRET=your_jwt_secret_key_here \
  -p 5003:5003 \
  payment-service
```

### 7. Build & Run Booking Service

```bash
docker build -t booking-service ./booking_service

docker run -d --name booking-service --network eventnet \
  -e PORT=5001 \
  -e DB_HOST=booking-postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=booking_service_db \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e DB_SSL=false \
  -e EVENT_SERVICE_BASE_URL=http://event-service:5002/api \
  -e USER_SERVICE_BASE_URL=http://user-service:5000/api \
  -e RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672 \
  -e PAYMENT_RESULT_QUEUE_NAME=payment-result-queue \
  -e BOOKING_EXPIRY_MINUTES=10 \
  -p 5001:5001 \
  booking-service
```

### 8. Build & Run Frontend

```bash
docker build -t eventnet-frontend \
  --build-arg NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api \
  --build-arg NEXT_PUBLIC_PAYMENT_API_URL=http://localhost:5003/api \
  ./frontend

docker run -d --name frontend --network eventnet \
  -e GOOGLE_CLIENT_ID=your_google_client_id \
  -e GOOGLE_CLIENT_SECRET=your_google_client_secret \
  -e NEXTAUTH_URL=http://localhost:3000 \
  -e NEXTAUTH_SECRET=any_random_secret_string \
  -e NEXT_PUBLIC_API_URL=http://localhost:5000/api \
  -e NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api \
  -e NEXT_PUBLIC_PAYMENT_API_URL=http://localhost:5003/api \
  -p 3000:3000 \
  eventnet-frontend
```

### 9. Verify Everything Is Running

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected output:
```
NAMES              STATUS         PORTS
frontend           Up 2 minutes   0.0.0.0:3000->3000/tcp
booking-service    Up 3 minutes   0.0.0.0:5001->5001/tcp
event-service      Up 3 minutes   0.0.0.0:5002->5002/tcp
payment-service    Up 3 minutes   0.0.0.0:5003->5003/tcp
user-service       Up 4 minutes   0.0.0.0:5000->5000/tcp
rabbitmq           Up 5 minutes   0.0.0.0:5672->5672/tcp, 0.0.0.0:15672->15672/tcp
booking-postgres   Up 5 minutes   0.0.0.0:5435->5432/tcp
payment-postgres   Up 5 minutes   0.0.0.0:5434->5432/tcp
event-postgres     Up 5 minutes   0.0.0.0:5433->5432/tcp
user-postgres      Up 5 minutes   0.0.0.0:5432->5432/tcp
```

---

## 🖥️ Run Services Natively (Without Docker)

If you prefer to run each service directly with Node.js for development:

### Frontend (Next.js)

```bash
cd frontend
npm install
```

Create a `.env.local` file:
```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=any_random_secret_string
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api
NEXT_PUBLIC_PAYMENT_API_URL=http://localhost:5003/api
```

```bash
npm run dev
# → Running at http://localhost:3000
```

### User Service

```bash
cd user_service
npm install
```

Create a `.env` file:
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/users_db
JWT_SECRET=your_jwt_secret_key_here
GOOGLE_CLIENT_ID=your_google_client_id
```

```bash
node index.js
# → Running at http://localhost:5000
```

### Event Service

```bash
cd event_service
npm install
```

Create a `.env` file:
```env
PORT=5002
DB_USER=postgres
DB_HOST=localhost
DB_NAME=event_service_db
DB_PASSWORD=postgres
DB_PORT=5433
NODE_ENV=development
RABBITMQ_URL=amqp://guest:guest@localhost:5672
```

```bash
npm start
# → Running at http://localhost:5002
```

### Payment Service

```bash
cd payment_service
npm install
```

Create a `.env` file:
```env
PORT=5003
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5434
DB_NAME=payment_service_db
DB_USER=postgres
DB_PASSWORD=postgres
RABBITMQ_URL=amqp://guest:guest@localhost:5672
JWT_SECRET=your_jwt_secret_key_here
```

```bash
npm start
# → Running at http://localhost:5003
```

### Booking Service

```bash
cd booking_service
npm install
```

Create a `.env` file (or copy `.env.example`):
```env
PORT=5001
DB_HOST=localhost
DB_PORT=5435
DB_NAME=booking_service_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
EVENT_SERVICE_BASE_URL=http://localhost:5002/api
USER_SERVICE_BASE_URL=http://localhost:5000/api
RABBITMQ_URL=amqp://guest:guest@localhost:5672
PAYMENT_RESULT_QUEUE_NAME=payment-result-queue
BOOKING_EXPIRY_MINUTES=10
```

```bash
npm start
# → Running at http://localhost:5001
```

---

## 🔌 Port Reference

| Service | Local Port | Health Check Endpoint |
|---------|-----------|----------------------|
| Frontend | `3000` | `http://localhost:3000/` |
| User Service | `5000` | `http://localhost:5000/api/users` (returns 401 if auth required) |
| Event Service | `5002` | `http://localhost:5002/api/events` |
| Payment Service | `5003` | `http://localhost:5003/api/payments/health` |
| Booking Service | `5001` | `http://localhost:5001/health` |
| RabbitMQ AMQP | `5672` | — |
| RabbitMQ UI | `15672` | `http://localhost:15672/` |
| User DB (PostgreSQL) | `5432` | — |
| Event DB (PostgreSQL) | `5433` | — |
| Payment DB (PostgreSQL) | `5434` | — |
| Booking DB (PostgreSQL) | `5435` | — |

---

## 🔄 Using Individual Docker Compose Files

Some services have their own `docker-compose.yml` which spins up the service along with its database (and RabbitMQ where needed):

### Event Service
```bash
cd event_service
docker compose up --build
# → Event Service on :5002, PostgreSQL on :5433
```

### Payment Service
```bash
cd payment_service
docker compose up --build
# → Payment Service on :5003, PostgreSQL on :5433, RabbitMQ on :5673/:15673
```

---

## 🧹 Cleanup

Stop and remove all containers and the network:

```bash
# Stop all containers
docker stop frontend booking-service payment-service event-service user-service \
  rabbitmq booking-postgres payment-postgres event-postgres user-postgres

# Remove all containers
docker rm frontend booking-service payment-service event-service user-service \
  rabbitmq booking-postgres payment-postgres event-postgres user-postgres

# Remove the network
docker network rm eventnet

# (Optional) Remove all volumes
docker volume prune
```

---

## ⚙️ CI/CD Pipeline

The project uses a **GitHub Actions** pipeline (`.github/workflows/deploy-all.yml`) that runs on every push to `main`. The pipeline has **11 jobs**:

| Stage | Job | Description |
|-------|-----|-------------|
| 1 | **Detect Changes** | Uses `dorny/paths-filter` to determine which services changed |
| 2–6 | **Deploy Services** | Builds Docker images, pushes to Azure ACR, deploys to AKS (only changed services) |
| 7 | **Security Scan** | Runs Trivy vulnerability scanner on all changed Docker images |
| 8 | **Validate Manifests** | Validates all Kubernetes YAML files with kubeconform |
| 9 | **Health Checks** | Verifies rollout status, pod health, detects CrashLoopBackOff pods |
| 10 | **Smoke Tests** | Hits live endpoints via `kubectl port-forward` to confirm HTTP responses |
| 11 | **Deployment Summary** | Generates a formatted report of all job results |

```
detect-changes
  ├──► deploy-frontend ──────────────────────┐
  ├──► deploy-user-service ──────────────────┤
  ├──► deploy-event-service ─────────────────┤
  ├──► deploy-payment-service ───────────────┼──► post-deploy-health-check
  ├──► deploy-booking-service ───────────────┘          │
  ├──► security-scan (parallel) ─────────────────►      ▼
  └──► validate-manifests (parallel) ────────►    smoke-tests
                                                        │
                                                        ▼
                                                deployment-summary
```

---

## 📁 Project Structure

```
event_book_microservice/
├── .github/
│   └── workflows/
│       └── deploy-all.yml          # CI/CD pipeline
├── frontend/                       # Next.js 16 frontend
│   ├── app/                        # App Router pages
│   ├── k8s/                        # K8s deployment, service, ingress
│   ├── Dockerfile                  # Multi-stage build
│   └── package.json
├── user_service/                   # User & Auth microservice
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── k8s/
│   ├── Dockerfile
│   └── package.json
├── event_service/                  # Event management microservice
│   ├── src/
│   ├── k8s/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── package.json
├── payment_service/                # Payment processing microservice
│   ├── src/
│   ├── k8s/
│   ├── docker-compose.yml
│   ├── Dockerfile
│   └── package.json
├── booking_service/                # Booking & reservation microservice
│   ├── src/
│   ├── database/
│   ├── k8s/
│   ├── Dockerfile
│   └── package.json
├── .gitignore
└── README.md                       # ← You are here
```

---

## 🤝 Team

| Member | Reg. No. |Service |
|--------|---------|---------|
| R.M.D. Madhusankha | EG/2021/4655 | User Service, Frontend, CI/CD, Infrastructure |
| T.M. Threemavithana | EG/2021/4835 | Payment Service |
| W.A.H.U.W. Arachchi | EG/2021/4410 | Event Service, ACR/AKS Setup |
| R.P.L. Jayasena | EG/2021/4575 | Booking Service |

---