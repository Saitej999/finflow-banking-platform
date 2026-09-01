# FinFlow Banking Platform

FinFlow is a full-stack banking platform that demonstrates a modern microservice architecture with Java 21 and Spring Boot on the backend, and React + TypeScript on the frontend.  
The platform now includes identity, account ownership enforcement, persistent transaction history, and a synchronous V1 transfer workflow between the Transaction and Account services.

## Architecture

```text
React :5173
        |
        v
API Gateway :8080
      /       \
     /         \
Identity     Transaction
Service      Service
:8081        :8083
   |           |
   v           v
PostgreSQL   PostgreSQL
:5436        :5438
finflow_identity
           finflow_transactions

Account
Service
:8082
   |
   v
PostgreSQL
:5437
finflow_accounts
```

Each microservice owns its own database. Identity, account, and transaction data are intentionally isolated to keep service boundaries clear. The Account Service owns balances and debit/credit logic; the Transaction Service owns ledger records and transfer history.

## Tech Stack

### Backend
- Java 21
- Spring Boot 4.1.1
- Spring MVC
- Spring Data JPA
- Hibernate
- Spring Security
- JWT / JJWT
- Spring Cloud Gateway
- Maven

### Frontend
- React
- TypeScript
- Vite
- Material UI
- Axios
- TanStack React Query
- React Router

### Infrastructure
- PostgreSQL 17
- Docker Compose

## Current Features

### Identity Service
- User registration
- BCrypt password hashing
- Login
- JWT generation
- JWT validation
- `GET /api/identity/me`

### Frontend Authentication
- Register page
- Login page
- JWT stored in `localStorage`
- Axios `Authorization` interceptor
- Authenticated dashboard
- Logout

### Account Service
- Separate PostgreSQL database
- Account entity
- `CHECKING` / `SAVINGS` account types
- `ACTIVE` / `FROZEN` / `CLOSED` statuses
- `BigDecimal` balances
- JWT validation
- Account ownership from JWT subject
- `POST /api/accounts`
- `GET /api/accounts/me`
- Generated account numbers
- Initial balance = `0`
- Initial status = `ACTIVE`

### Frontend Accounts
- Display authenticated user's accounts
- Masked account numbers
- Currency formatting
- Create Account dialog
- React Query cache invalidation and refetch

### Transaction Service
- `POST /api/transactions/transfers`
- `GET /api/transactions/me`
- `GET /api/transactions/{transactionId}`
- JWT-authenticated transfer orchestration
- PENDING -> COMPLETED/FAILED ledgers
- Ownership-protected transaction history

### Frontend Transaction Workflow
- Transfer Money dialog from the authenticated dashboard
- Source-account selection from the user's existing accounts
- Destination account UUID entry
- Amount validation and currency normalization
- Account balance refresh via React Query invalidation
- Transaction history cards with status, timestamps, and masked account references

## Security Design

- Stateless JWT authentication
- Identity Service signs JWTs
- JWT subject (`sub`) contains the user UUID
- Account Service validates JWTs locally
- `userId` is not accepted in Create Account requests
- Account ownership is derived from validated JWT subject
- API Gateway forwards the `Authorization` header
- Passwords are hashed with BCrypt

## API Endpoints

### Identity
- `POST /api/identity/register`
- `POST /api/identity/login`
- `GET /api/identity/me`

### Account
- `POST /api/accounts`
- `GET /api/accounts/me`
- `POST /api/accounts/transfer`

### Transaction
- `POST /api/transactions/transfers`
- `GET /api/transactions/me`
- `GET /api/transactions/{transactionId}`

Protected endpoints require:

```http
Authorization: Bearer <JWT>
```

## Project Structure

```text
backend/
  pom.xml
  api-gateway/
  identity-service/
  account-service/

frontend/

docker-compose.yml
.env.example
```

## Local Development

### Prerequisites
- Java 21
- Maven or Maven Wrapper
- Node.js + npm
- Docker Desktop
- Git

Use `.env.example` as the template for local environment configuration.

### Startup Order
1. Start PostgreSQL containers
2. Start Identity Service
3. Start Account Service
4. Start Transaction Service
5. Start API Gateway
6. Start React frontend

### Commands

Start databases:

```bash
docker compose up -d postgres account-postgres transaction-postgres
```

Start backend services (separate terminals):

```bash
cd backend/identity-service
../mvnw.cmd spring-boot:run
```

```bash
cd backend/account-service
../mvnw.cmd spring-boot:run
```

```bash
cd backend/transaction-service
../mvnw.cmd spring-boot:run
```

```bash
cd backend/api-gateway
../mvnw.cmd spring-boot:run
```

Start frontend:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## V1 Transfer Flow

The React frontend submits transfer requests through the API Gateway to the Transaction Service, which validates the authenticated user, records a ledger entry, and then calls the Account Service for the atomic local debit/credit operation. The Account Service owns balances, while the Transaction Service owns the ledger and history.
