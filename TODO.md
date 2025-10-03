# TODO: Implement Logistic Service APIs with Swagger Documentation

## Step 1: Adjust Logistic Controller Paths and Endpoints
- [x] Change controller path from 'api/v1/logistic/records' to 'records'
- [x] Add guideNumber filter to QueryLogisticRecordsDto
- [x] Add logistic items endpoints: POST /records/{id}/items, PATCH /records/{id}/items/{itemId}, DELETE /records/{id}/items/{itemId}
- [x] Add messenger assignment endpoints: POST /records/{id}/assign, GET /records/{id}/assignment
- [x] Add traceability events endpoints: POST /records/{id}/events, GET /records/{id}/events
- [x] Update logistic.service.ts with new methods for items, assignment, events

## Step 2: Update Files Controller
- [ ] Add GET /files/{id} endpoint for file metadata and download link

## Step 3: Create Notifications Controller
- [ ] Create src/notify/notifications.controller.ts with POST /notifications/send
- [ ] Update notify.module.ts to include the new controller

## Step 4: Update Kanban Controller
- [ ] Change GET /kanban to GET /kanban/columns
- [ ] Add POST /records/{id}/tags and DELETE /records/{id}/tags/{tagId} to logistic controller

## Step 5: Update Contacts Controller
- [ ] Add GET /contacts/{id} endpoint

## Step 6: Create Public Controller
- [ ] Create src/public/public.controller.ts with GET /public/track/{guideNumber}
- [ ] Create public.module.ts and add to app.module.ts

## Step 7: Add Swagger Decorators
- [ ] Add @ApiTags, @ApiOperation, @ApiResponse to all controllers
- [ ] Add examples to DTOs using @ApiProperty
- [ ] Ensure external services (contacts, custom-fields) are not exposed in Swagger

## Step 8: Update App Module and Main
- [ ] Import TrazabilityModule in app.module.ts if needed
- [ ] Adjust Swagger setup to exclude external endpoints

## Step 9: Test and Validate
- [ ] Run the application and check Swagger docs show ~20 endpoints
- [ ] Test key endpoints for functionality
