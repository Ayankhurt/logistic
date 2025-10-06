# Implementation Plan for Client Requirements

## Information Gathered
- **Contacts Service**: API endpoints `apis.gestoru.com/api/contacts/list` and `/validate/{contactId}` with Bearer token + tenant-id headers ✓
- **Traceability Service**: Endpoint `/trazability/create` with payload containing action, entity, entityId, tenantId, userId, data ✓
- **Storage Service**: Single file upload at `apis.gestoru.com/files/create`, multiple needs domain change to `storage.gestoru.com`
- **State Transitions**: `changeState` method allows direct DRAFT→READY transitions ✓
- **Contact Validation**: Implemented in `createRecord` method ✓
- **PDF Content**: Includes guide number, Code 128 barcode, sender/recipient IDs, items; missing names and company brand
- **Notifications**: Templates include comprehensive record data ✓

## Tasks
- [x] Update StorageService to use `storage.gestoru.com` for multiple file uploads
- [x] Add validation in LogisticService.checkItems to allow qtyVerified > qtyExpected with warning
- [ ] Define required fields validation for TRACKING vs PICKING records in createRecord
- [ ] Integrate CustomFieldsService for label validation (Status: To be assigned, assigned, in process, completed; Approval: Not authorized, authorized)
- [x] Update PrintingService to fetch and include sender/recipient names instead of IDs
- [x] Add company brand/logo to PDF generation
- [x] Fix trazability service call in addEvent method
- [ ] Test all implemented features

## Dependent Files to Edit
- `src/integrations/storage/storage.service.ts`
- `src/logistic/logistic.service.ts`
- `src/printing/printing.service.ts`
- `src/logistic/dto/create-logistic-record.dto.ts` (for validation rules)

## Followup Steps
- [ ] Run tests to verify functionality
- [ ] Update API documentation if needed
- [ ] Deploy and test in staging environment
