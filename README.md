# Logistics Microservice

A comprehensive NestJS microservice for managing logistics operations including **Trackings** (shipments) and **Pickings** (collections/order preparation). This service provides full CRUD operations, real-time WebSocket events, and integrations with external services.

## 🚀 Features

### Core Functionality
- **CRUD Operations**: Complete Create, Read, Update, Delete operations for logistic records
- **Dual Types**: Support for both TRACKING (shipments) and PICKING (collections) records
- **Item Verification**: Physical verification of items against source documents
- **State Management**: Kanban-style state management with real-time updates
- **Messenger Assignment**: Assign messengers to handle specific records
- **PDF Generation**: Generate and store PDF guides for records
- **Notifications**: Send tracking links via multiple channels (Email, SMS, WhatsApp)
- **Record Duplication**: Duplicate existing records with optional field copying
- **Record Splitting**: Split large shipments into multiple smaller records

### Integrations
- **Custom Fields Service**: Dynamic field validation and label management
- **Trazability Service**: Event tracking and audit logging
- **File Storage Service**: PDF upload and management
- **Contacts Service**: Contact validation and management
- **Auth Service**: Bearer token authentication

### Real-time Features
- **WebSocket Gateway**: Real-time event broadcasting
- **Room-based Broadcasting**: Tenant and messenger-specific rooms
- **Event Types**: Comprehensive event system for all operations

## 🏗️ Architecture

### Technology Stack
- **Framework**: NestJS (Node.js + TypeScript)
- **Database**: PostgreSQL with Prisma ORM
- **WebSockets**: Socket.IO for real-time communication
- **Validation**: class-validator and class-transformer
- **Documentation**: Swagger/OpenAPI 3.0
- **Package Manager**: pnpm

### Project Structure
```
src/
├── logistic/                 # Main logistic module
│   ├── dto/                 # Data Transfer Objects
│   ├── interfaces/          # TypeScript interfaces
│   ├── logistic.controller.ts
│   ├── logistic.service.ts
│   └── logistic.module.ts
├── integrations/            # External service integrations
│   ├── contacts/           # Contacts service integration
│   ├── custom-fields/      # Custom fields service
│   ├── storage/            # File storage service
│   └── trazability/        # Trazability service
├── sockets/                # WebSocket gateway
├── common/                 # Shared utilities
│   └── auth/              # Authentication guards
└── prisma/                # Database service
```

## 📋 API Endpoints

### Base URL
```
/api/v1/logistic/records
```

### Core CRUD Operations
- `POST /` - Create new logistic record
- `GET /` - List logistic records with filtering
- `GET /:id` - Get specific logistic record
- `PATCH /:id` - Update logistic record
- `DELETE /:id` - Delete logistic record

### Item Verification
- `POST /:id/check/verify` - Verify items during check process
- `POST /:id/check/finalize` - Finalize item verification

### State Management
- `POST /:id/state` - Change record state (Kanban)
- `PATCH /:id/labels` - Update record labels

### Operations
- `POST /:id/messenger/assign` - Assign messenger
- `POST /:id/print` - Generate PDF guide
- `POST /:id/notify` - Send tracking notification
- `POST /:id/duplicate` - Duplicate record
- `POST /:id/split` - Split record into multiple records

## 🔧 Setup and Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- pnpm

### Environment Variables
Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/logistics_db"

# External Services
CONTACTS_BASE_URL="http://localhost:3001"
CUSTOM_FIELDS_BASE_URL="http://localhost:3002"
TRAZABILITY_BASE_URL="http://localhost:3003"
STORAGE_BASE_URL="http://localhost:3004"

# Application
PORT=3000
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
PUBLIC_TRACK_BASE_URL="https://track.example.com"
```

### Installation Steps

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd logistic
pnpm install
```

2. **Setup database**
```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# Seed database with demo data
pnpm run seed
```

3. **Start the application**
```bash
# Development mode
pnpm run start:dev

# Production mode
pnpm run start
```

4. **Access documentation**
- Swagger UI: http://localhost:3000/docs
- OpenAPI Spec: http://localhost:3000/openapi/openapi.yaml

## 📊 Database Schema

### LogisticRecord
Main entity for tracking and picking records.

```typescript
{
  id: string                    // UUID primary key
  tenantId: string             // Multi-tenant identifier
  type: 'TRACKING' | 'PICKING' // Record type
  guideNumber: string          // Unique guide number
  originType?: string          // Source document type
  originId?: string            // Source document ID
  senderContactId: string      // Sender contact reference
  recipientContactId: string   // Recipient contact reference
  carrierId?: string           // Carrier reference
  messengerId?: string         // Assigned messenger
  state: LogisticState         // Current state
  labels: string[]             // Categorization labels
  extra: Json                  // Custom fields data
  summary: Json                // Computed summary
  fileUri?: string             // PDF file reference
  // ... audit and timestamps
}
```

### LogisticItem
Items within a logistic record.

```typescript
{
  id: string           // UUID primary key
  recordId: string     // Parent record reference
  originItemId?: string // Source item reference
  sku?: string         // Product SKU
  name?: string        // Item name
  qtyExpected: number  // Expected quantity
  qtyVerified: number  // Verified quantity
  selected: boolean    // Verification status
}
```

## 🔌 WebSocket Events

### Namespace
```
/logistics
```

### Rooms
- `tenant:{tenantId}` - Tenant-specific events
- `messenger:{messengerId}` - Messenger-specific events

### Event Types
- `logistic.created` - New record created
- `logistic.updated` - Record updated
- `logistic.state.changed` - State changed
- `logistic.labels.updated` - Labels updated
- `logistic.messenger.assigned` - Messenger assigned
- `logistic.check.updated` - Item verification updated
- `logistic.check.finalized` - Check process finalized
- `logistic.printed` - PDF guide generated
- `logistic.notification.sent` - Notification sent
- `logistic.duplicated` - Record duplicated

### Event Payload
```typescript
{
  id: string
  tenantId: string
  guideNumber: string
  type: 'TRACKING' | 'PICKING'
  state: LogisticState
  messengerId?: string | null
  etiquetas: string[]
  resumen?: Record<string, any> | null
  changedBy?: string
  timestamp: string
}
```

## 🧪 Testing

### Run Tests
```bash
# Unit tests
pnpm run test

# E2E tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

### Test Data
The seed script creates comprehensive demo data:
- 1 Tracking record with 3 items (CHECK_FINALIZED state)
- 1 Picking record with 5 items (READY state)
- Complete audit trails for both records

## 📈 Monitoring and Logging

### Metrics
- Prometheus metrics available at `/metrics`
- Custom metrics for business operations

### Logging
- Structured JSON logging with Pino
- Request/response logging
- Error tracking and correlation IDs

## 🔒 Security

### Authentication
- Bearer token authentication
- Multi-tenant support
- Request validation and sanitization

### Data Protection
- Input validation with class-validator
- SQL injection prevention via Prisma
- CORS configuration

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t logistics-service .

# Run with docker-compose
docker-compose up -d
```

### Environment-specific Configuration
- Development: Hot reload, detailed logging
- Production: Optimized builds, structured logging
- Testing: In-memory database, mock services

## 📚 API Documentation

### Swagger UI
Access the interactive API documentation at `/docs` when running the service.

### OpenAPI Specification
The complete OpenAPI 3.0 specification is available at `/openapi/openapi.yaml`.

### Example Requests

#### Create Tracking Record
```bash
curl -X POST "http://localhost:3000/api/v1/logistic/records?type=TRACKING" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: tenant-demo-1" \
  -d '{
    "tenantId": "tenant-demo-1",
    "senderContactId": "contact-001",
    "recipientContactId": "contact-002",
    "carrierId": "fedex",
    "labels": ["urgent", "fragile"],
    "items": [
      {
        "sku": "SKU-001",
        "name": "Laptop",
        "qtyExpected": 1
      }
    ]
  }'
```

#### Verify Items
```bash
curl -X POST "http://localhost:3000/api/v1/logistic/records/tracking-001/check/verify" \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "id": "item-001",
        "selected": true,
        "qtyVerified": 1
      }
    ]
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the test cases for usage examples

---

**Built with ❤️ using NestJS, Prisma, and PostgreSQL**