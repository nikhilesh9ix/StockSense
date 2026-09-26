# StockSense - Inventory Management System Backend

A production-quality, modular monolith backend for the StockSense Inventory Management System built with Node.js, TypeScript, Express.js, PostgreSQL, and Prisma.

[![CI](https://github.com/nikhilesh9ix/StockSense/actions/workflows/ci.yml/badge.svg)](https://github.com/nikhilesh9ix/StockSense/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🚀 Quick Start (Docker - Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/nikhilesh9ix/StockSense.git
cd StockSense

# 2. Start everything with Docker (PostgreSQL + Backend)
docker-compose up -d

# 3. Done! API is running at:
#    http://localhost:5000
#    Swagger Docs: http://localhost:5000/api/docs
```

## 📋 Manual Setup (Without Docker)

```bash
# 1. Clone and install dependencies
git clone https://github.com/nikhilesh9ix/StockSense.git
cd StockSense
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env if needed (defaults work with Docker PostgreSQL)

# 3. Setup database (requires PostgreSQL running)
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 4. Start development server
npm run dev
```

## 🏗️ Architecture

```
Request → Route → Middleware → Controller → Service → Prisma → PostgreSQL
```

### Key Principles

- **Clean Architecture**: Business logic isolated in services, controllers only handle HTTP
- **Transactional Consistency**: All stock mutations use Prisma transactions
- **Auditability**: Every stock change creates an immutable Stock Ledger entry
- **Validation**: Server-side validation with Zod schemas
- **Authentication**: JWT-based with role-based access control

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 20+ |
| Language | TypeScript 5 |
| Framework | Express.js 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma 5 |
| Validation | Zod 3 |
| Auth | JWT + Argon2 |
| Testing | Vitest + Supertest |
| Docs | Swagger/OpenAPI 3 |
| Dev Tools | ESLint, Prettier, tsx |

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 16 (or Docker)
- pnpm/npm/yarn

## 🚀 Installation

```bash
# Clone and install dependencies
cd stocksense
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL and JWT secret

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

## 🐳 Docker Setup

```bash
# Start PostgreSQL
docker-compose up -d

# Verify database is running
docker-compose logs postgres
```

## 📁 Project Structure

```
server/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed data
├── src/
│   ├── config/            # Configuration (env, prisma)
│   ├── constants/         # Error codes, statuses, roles
│   ├── controllers/       # HTTP request handlers
│   ├── middleware/        # Auth, roles, errors, request ID
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   ├── utils/             # Helpers (errors, responses)
│   ├── validators/        # Zod schemas
│   ├── app.ts             # Express app setup
│   └── server.ts          # Entry point
├── tests/                 # Test files
├── .env.example           # Environment template
├── docker-compose.yml     # PostgreSQL container
├── package.json
├── tsconfig.json
└── README.md
```

## 🔐 Environment Variables

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/stocksense"
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

## 🗄️ Database Schema

### Core Models

- **User** - Authentication & authorization
- **Category** - Product categories
- **Product** - Products with SKU, reorder level
- **Warehouse** - Physical warehouses
- **Location** - Locations within warehouses
- **Inventory** - Current stock per product/location
- **Receipt** - Incoming stock
- **Delivery** - Outgoing stock
- **Transfer** - Internal stock movements
- **Adjustment** - Inventory corrections
- **StockLedger** - Immutable audit trail

### Key Constraints

- `User.email` UNIQUE
- `Product.sku` UNIQUE
- `Inventory(productId, locationId)` UNIQUE
- `quantity >= 0` (PostgreSQL check constraint)
- Foreign keys for all relationships

## 🔑 Authentication

### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "WAREHOUSE_STAFF"
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "name": "...", "role": "WAREHOUSE_STAFF" },
    "tokens": { "accessToken": "eyJ..." }
  }
}
```

### Using Token
```http
Authorization: Bearer eyJ...
```

## 👥 Roles

| Role | Permissions |
|------|-------------|
| `INVENTORY_MANAGER` | Full access including validation |
| `WAREHOUSE_STAFF` | Read access, create drafts |

## 📦 API Endpoints

### Categories
```
POST   /api/categories              # Create (Manager)
GET    /api/categories              # List with search
GET    /api/categories/:id          # Get by ID
PATCH  /api/categories/:id          # Update (Manager)
DELETE /api/categories/:id          # Delete (Manager)
```

### Products
```
POST   /api/products                # Create (Manager)
GET    /api/products                # List with filters
GET    /api/products/:id            # Get by ID
PATCH  /api/products/:id            # Update (Manager)
DELETE /api/products/:id            # Delete (Manager)
```

Query params: `?page=1&limit=20&search=STL&categoryId=xxx&lowStock=true&outOfStock=true`

### Warehouses
```
POST   /api/warehouses              # Create (Manager)
GET    /api/warehouses              # List
GET    /api/warehouses/:id          # Get with locations
PATCH  /api/warehouses/:id          # Update (Manager)
DELETE /api/warehouses/:id          # Delete (Manager)

POST   /api/warehouses/:warehouseId/locations    # Create location (Manager)
GET    /api/warehouses/:warehouseId/locations    # List locations
PATCH  /api/locations/:id          # Update location (Manager)
DELETE /api/locations/:id          # Delete location (Manager)
```

### Inventory
```
GET /api/inventory                  # List with filters
GET /api/inventory/product/:productId
GET /api/inventory/location/:locationId
```

Filters: `productId`, `warehouseId`, `locationId`, `categoryId`, `lowStock`, `outOfStock`, `search`

### Receipts (Incoming Stock)
```
POST   /api/receipts                # Create draft
GET    /api/receipts                # List with status filter
GET    /api/receipts/:id            # Get details
PATCH  /api/receipts/:id            # Update draft
POST   /api/receipts/:id/validate   # Validate & increase stock (Manager)
POST   /api/receipts/:id/cancel     # Cancel (Manager)
```

Status flow: `DRAFT → WAITING → READY → DONE`

### Deliveries (Outgoing Stock)
```
POST   /api/deliveries              # Create draft
GET    /api/deliveries              # List with status filter
GET    /api/deliveries/:id          # Get details
PATCH  /api/deliveries/:id          # Update draft
POST   /api/deliveries/:id/pick     # Mark as picked
POST   /api/deliveries/:id/pack     # Mark as packed
POST   /api/deliveries/:id/validate # Validate & decrease stock (Manager)
POST   /api/deliveries/:id/cancel   # Cancel (Manager)
```

Status flow: `DRAFT → WAITING (pick) → READY (pack) → DONE (validate)`

### Transfers (Internal Movement)
```
POST   /api/transfers               # Create draft
GET    /api/transfers               # List with status filter
GET    /api/transfers/:id           # Get details
PATCH  /api/transfers/:id           # Update draft
POST   /api/transfers/:id/validate  # Validate & move stock (Manager)
POST   /api/transfers/:id/cancel    # Cancel (Manager)
```

### Adjustments (Corrections)
```
POST   /api/adjustments             # Create draft
GET    /api/adjustments             # List with status filter
GET    /api/adjustments/:id         # Get details
PATCH  /api/adjustments/:id         # Update draft
POST   /api/adjustments/:id/validate # Validate & adjust stock (Manager)
POST   /api/adjustments/:id/cancel  # Cancel (Manager)
```

### Stock Ledger
```
GET /api/ledger                     # List with filters
GET /api/ledger/:id                 # Get entry
GET /api/ledger/product/:productId  # Product history
GET /api/ledger/location/:locationId # Location history
```

Filters: `productId`, `locationId`, `warehouseId`, `type`, `startDate`, `endDate`

### Dashboard
```
GET /api/dashboard/summary          # KPIs
GET /api/dashboard/documents        # Filtered documents
```

Dashboard filters: `documentType`, `status`, `warehouseId`, `locationId`, `categoryId`

## 📊 Inventory Business Rules

### Stock Mutations
All stock changes go through `InventoryService` using Prisma transactions:

```typescript
// Atomic operation
await prisma.$transaction(async (tx) => {
  // 1. Update Inventory
  // 2. Create StockLedger entry
  // 3. Update operation status
});
```

### Validation Rules

| Operation | Validation |
|-----------|------------|
| Quantity | Must be positive integer |
| Receipt | Items must have valid product/location |
| Delivery | Available stock >= requested quantity |
| Transfer | Source ≠ Destination, source stock >= quantity |
| Adjustment | Counted quantity >= 0, difference calculated server-side |

### Status Transitions

```
DRAFT → WAITING → READY → DONE
              ↘ CANCELED (only before DONE)
```

Completed operations (`DONE`) cannot be reverted. Use `Adjustment` for corrections.

### Low Stock Detection

- `LOW_STOCK`: `currentStock <= reorderLevel`
- `OUT_OF_STOCK`: `currentStock === 0`
- Calculated dynamically, not stored

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Critical Integration Test

The test suite includes a comprehensive integration test covering the complete inventory lifecycle:

1. Create Product, Warehouse, Locations
2. Receive 100 units via Receipt
3. Transfer 40 units between locations
4. Deliver 20 units
5. Adjust to 17 units
6. Verify final inventory = 77
7. Verify ledger: `+100 RECEIPT, -40 TRANSFER_OUT, +40 TRANSFER_IN, -20 DELIVERY, -3 ADJUSTMENT`

## 📚 API Documentation

Swagger UI available at: `http://localhost:5000/api/docs`

## 🔄 Development Workflow

```bash
# Start dev server with hot reload
npm run dev

# Run linter
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Run production build
npm start
```

## 👥 Team Onboarding

### For New Team Members

1. **Clone the repository**
   ```bash
   git clone https://github.com/nikhilesh9ix/StockSense.git
   cd StockSense
   ```

2. **Start with Docker (zero-config)**
   ```bash
   docker-compose up -d
   ```
   - API: `http://localhost:5000`
   - Swagger Docs: `http://localhost:5000/api/docs`
   - Health: `http://localhost:5000/api/health`

3. **Verify it works**
   ```bash
   curl http://localhost:5000/api/health
   # {"success":true,"data":{"status":"ok","timestamp":"..."}}
   ```

4. **Run tests**
   ```bash
   npm test
   ```

### Default Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Inventory Manager | admin@stocksense.dev | Admin@123 |
| Warehouse Staff | staff@stocksense.dev | Staff@123 |

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/stocksense` |
| `JWT_SECRET` | JWT signing secret | `change-me-in-production` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `PORT` | Server port | `5000` |
| `CLIENT_URL` | Frontend URL (CORS) | `http://localhost:5173` |
| `NODE_ENV` | Environment | `development` |

## 🔧 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR to `main`:

| Job | Description |
|-----|-------------|
| **Lint & Typecheck** | ESLint + TypeScript compilation |
| **Tests** | Full test suite with PostgreSQL service |
| **Docker Build** | Verifies Docker image builds correctly |

### CI Status Badge
![CI](https://github.com/nikhilesh9ix/StockSense/actions/workflows/ci.yml/badge.svg)

### Running CI Locally
```bash
# Lint & typecheck
npm run lint && npm run build

# Tests (requires PostgreSQL)
npm test

# Docker build
docker build -t stocksense-backend .
```

## 🗄️ Database Management

### Migrations
```bash
# Create new migration (development)
npm run prisma:migrate -- --name migration_name

# Apply migrations (production/CI)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Seeding
```bash
npm run prisma:seed
```

### Prisma Studio
```bash
npm run prisma:studio
```

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f postgres

# Stop services
docker-compose down

# Stop and remove volumes (reset DB)
docker-compose down -v

# Rebuild backend image
docker-compose build backend
```

## 📝 Contributing

1. Create feature branch from `main`
2. Make changes with tests
3. Run lint + tests locally
4. Push and create Pull Request
5. CI must pass before merge

### Code Style
- ESLint + Prettier configured
- Run `npm run format` before committing
- TypeScript strict mode enabled

## 📄 License

MIT

## 📝 Example API Workflow

### Complete Inventory Cycle

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stocksense.dev","password":"Admin@123"}'

# 2. Create category
curl -X POST http://localhost:5000/api/categories \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Raw Materials","description":"Steel and metals"}'

# 3. Create product
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Steel Rod","sku":"STL-001","categoryId":"<cat-id>","unitOfMeasure":"PCS","reorderLevel":20}'

# 4. Create warehouse & location
curl -X POST http://localhost:5000/api/warehouses \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Main Warehouse","address":"123 Industrial Blvd"}'

curl -X POST http://localhost:5000/api/warehouses/<wh-id>/locations \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Rack A","code":"RACK-A"}'

# 5. Create receipt
curl -X POST http://localhost:5000/api/receipts \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"supplierName":"Steel Co","items":[{"productId":"<prod-id>","locationId":"<loc-id>","quantity":100}]}'

# 6. Validate receipt (increases stock)
curl -X POST http://localhost:5000/api/receipts/<receipt-id>/validate \
  -H "Authorization: Bearer <token>"

# 7. Check inventory
curl -X GET http://localhost:5000/api/inventory/product/<prod-id> \
  -H "Authorization: Bearer <token>"
```

## ⚠️ Limitations & Future Improvements

- **OTP Storage**: Password reset OTPs are logged to console (dev only). Production needs Redis/database storage.
- **Email/SMS**: No actual email provider integrated. Abstracted in `AuthService.forgotPassword`.
- **Refresh Tokens**: Currently only access tokens. Refresh token rotation recommended for production.
- **Real-time**: No WebSocket support for live stock updates.
- **Batch Operations**: No bulk import/export endpoints yet.
- **Audit Log**: Stock Ledger covers stock changes; user action audit log not implemented.

## 📄 License

MIT