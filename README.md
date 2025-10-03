# Logistic Service

A comprehensive NestJS microservice for managing logistics operations including trackings, pickings, Kanban boards, file storage, notifications, and real-time socket events.

## Features

- **CRUD Operations**: Full lifecycle management of logistic records (trackings/pickings)
- **Custom Fields Integration**: Dynamic field support for tenant-specific requirements
- **Kanban Management**: Visual board management with customizable columns and tags
- **File Storage**: PDF generation with barcodes and cloud storage integration
- **Real-time Notifications**: Socket.IO events for real-time updates
- **Audit Trail**: Complete traceability with event logging
- **Multi-tenant Support**: Tenant-based data isolation
- **Authentication**: JWT-based auth with external service integration
- **Monitoring**: Prometheus metrics and structured JSON logging

## Technology Stack

- **Framework**: NestJS (Node.js + TypeScript)
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Sockets**: Socket.IO
- **File Processing**: Puppeteer + bwip-js (Code 128 barcodes)
- **Notifications**: Twilio (SMS/WhatsApp)
- **Logging**: Winston (structured JSON)
- **Metrics**: Prometheus
- **Containerization**: Docker + Docker Compose

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (or use Docker)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd logistic-service
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Generate Prisma client
   pnpm db:generate

   # Run migrations
   pnpm db:migrate:dev

   # Seed demo data
   pnpm db:seed
   ```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/logistic_db?schema=public"

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGINS="http://localhost:3000,http://localhost:4200"

# Auth
AUTH_BASE_URL="https://apis.gestoru.com"
JWT_PUBLIC_KEY="your-jwt-public-key"

# External Services
CONTACTS_BASE_URL="https://apis.gestoru.com"
CUSTOM_FIELDS_BASE_URL="https://apis.gestoru.com"
TRAZABILITY_BASE_URL="https://apis.gestoru.com"
STORAGE_BASE_URL="https://apis.gestoru.com"
STORAGE_UUID="f5095a81-cd27-4159-9785-88bda66d5d0f"
STORAGE_MODULE_ID="rRa1j8pPlZS5T8G7ADXD5sf7mBlQpnyY"

# Twilio (Notifications)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_FROM_NUMBER="+1234567890"

# Kafka (for Custom Fields integration)
KAFKA_BROKERS="localhost:9092"

# Logging
LOG_LEVEL=info
```

## Running the Application

### Development Mode
```bash
# Start with hot reload
pnpm start:dev

# Start with debugging
pnpm start:debug
```

### Production Mode
```bash
# Build the application
pnpm build

# Start production server
pnpm start:prod
```

### Using Docker
```bash
# Build and run with Docker Compose
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## API Documentation

### Swagger UI
- **URL**: `http://localhost:3000/api/docs`
- Interactive API documentation with request/response examples

### OpenAPI Specification
- **URL**: `http://localhost:3000/openapi/openapi.yaml`
- YAML specification for API integration

## API Endpoints

### Core CRUD Operations
- `POST /api/v1/logistic/records` - Create logistic record
- `GET /api/v1/logistic/records` - List records (with filters)
- `GET /api/v1/logistic/records/{id}` - Get specific record
- `PATCH /api/v1/logistic/records/{id}` - Update record
- `DELETE /api/v1/logistic/records/{id}` - Delete record

### Items Management
- `POST /api/v1/logistic/records/{id}/items` - Add item
- `PATCH /api/v1/logistic/records/{id}/items/{itemId}` - Update item verification
- `DELETE /api/v1/logistic/records/{id}/items/{itemId}` - Remove item

### Check Operations
- `POST /api/v1/logistic/records/{id}/check/finalize` - Finalize item verification

### Assignment
- `POST /api/v1/logistic/records/{id}/assign` - Assign messenger
- `GET /api/v1/logistic/records/{id}/assignment` - Get assignment details

### Events & Audit
- `POST /api/v1/logistic/records/{id}/events` - Add custom event
- `GET /api/v1/logistic/records/{id}/events` - List record events

### Kanban Management
- `GET /api/v1/logistic/kanban/columns` - Get Kanban columns
- `PATCH /api/v1/logistic/records/{id}/tags` - Update record tags/labels

### File Operations
- `POST /api/v1/logistic/files/upload` - Upload file
- `GET /api/v1/logistic/files/{id}` - Get file

### Notifications
- `POST /api/v1/logistic/notifications/send` - Send SMS/WhatsApp notification

### Public Endpoints
- `GET /api/v1/logistic/public/track/{guideNumber}` - Public tracking info

## Socket Events

Namespace: `/logistics`

### Rooms
- `tenant:{tenantId}` - Events for specific tenant
- `messenger:{messengerId}` - Events for specific messenger

### Events
- `logistic.created` - New record created
- `logistic.updated` - Record updated
- `logistic.state.changed` - Record state changed
- `logistic.labels.updated` - Record labels/tags updated
- `logistic.messenger.assigned` - Messenger assigned to record
- `logistic.check.updated` - Item verification updated
- `logistic.check.finalized` - Check process finalized
- `logistic.printed` - Guide printed
- `logistic.notification.sent` - Notification sent
- `logistic.duplicated` - Record duplicated

### Event Payload
```typescript
{
  id: string;
  tenantId: string;
  guideNumber: string;
  type: 'TRACKING' | 'PICKING';
  state: string;
  messengerId?: string;
  etiquetas?: any;
  resumen?: any;
  changedBy: string;
  timestamp: string;
}
```

## Monitoring & Metrics

### Prometheus Metrics
- **URL**: `http://localhost:3000/metrics`
- Available metrics:
  - `http_requests_total` - HTTP request counts
  - `http_request_duration_seconds` - Request latencies
  - `logistic_records_created_total` - Records created
  - `logistic_records_updated_total` - Records updated
  - `socket_events_total` - Socket events emitted
  - `active_socket_connections` - Active connections

### Structured Logging
All logs are output in JSON format with:
- Timestamp
- Log level
- Message
- Context
- Additional metadata

## Development

### Database Management
```bash
# Generate Prisma client
pnpm db:generate

# Create new migration
pnpm db:migrate:dev

# Apply migrations
pnpm db:migrate

# Reset database (development only)
pnpm db:reset

# Open Prisma Studio
pnpm db:studio

# Seed database
pnpm db:seed
```

### Testing
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:cov

# Run e2e tests
pnpm test:e2e
```

### Code Quality
```bash
# Lint code
pnpm lint

# Format code
pnpm format

# Build application
pnpm build
```

## Architecture Decisions

### Database Design
- **Single Table Pattern**: Used one `LogisticRecord` table with `type` enum to differentiate trackings vs pickings
- **JSONB Fields**: Used PostgreSQL JSONB for flexible `extra`, `labels`, and `summary` fields
- **GIN Indices**: Added GIN indices for efficient JSONB queries and text search

### Authentication
- **External Auth**: JWT tokens validated against external auth service
- **Mock Service**: Development mode bypasses external calls for easier testing

### File Storage
- **Cloud Integration**: Files uploaded to external storage service using provided credentials
- **PDF Generation**: Uses Puppeteer for HTML-to-PDF conversion with Code 128 barcodes

### Real-time Events
- **Socket.IO**: Namespace `/logistics` with tenant and messenger-specific rooms
- **Event Types**: Comprehensive event system for all business operations

### External Integrations
- **Contacts Service**: Validates sender/recipient contacts
- **Custom Fields**: Dynamic field definitions and Kanban column management
- **Trazability**: Event logging with failure-stop policy
- **Storage Service**: File upload and retrieval

## Deployment

### Docker Production
```bash
# Build production image
docker build -t logistic-service .

# Run with environment file
docker run -d \
  --name logistic-service \
  -p 3000:3000 \
  --env-file .env \
  logistic-service
```

### Docker Compose Production
```yaml
version: '3.9'
services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: logistic
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db_data:/var/lib/postgresql/data

  api:
    image: logistic-service:latest
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/logistic
      NODE_ENV: production
    depends_on:
      - db
    ports:
      - "3000:3000"

volumes:
  db_data:
```

## Definition of Done Checklist

✅ **CRUD operational** - `/api/v1/logistic/records` endpoints working
✅ **Contacts validation** - Integration with contacts service for validation
✅ **Sockets emitting** - All required events emitted correctly
✅ **PostgreSQL setup** - Migrations and seeds created (1 tracking, 1 picking demo)
✅ **OpenAPI complete** - `/openapi/openapi.yaml` and Swagger UI available
✅ **Tests implemented** - Unit and integration tests for critical flows
✅ **Logs structured** - JSON logging with Winston
✅ **Metrics available** - Prometheus metrics endpoint
✅ **Docker configured** - Single stack with app + Postgres + volumes
✅ **README complete** - Comprehensive documentation provided

## Support

For issues and questions, please refer to the project documentation or contact the development team.
