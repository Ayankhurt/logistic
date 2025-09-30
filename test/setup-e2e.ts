// Setup file for e2e tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/logistics_test_db';
process.env.CONTACTS_BASE_URL = process.env.CONTACTS_BASE_URL || 'http://localhost:3001';
process.env.CUSTOM_FIELDS_BASE_URL = process.env.CUSTOM_FIELDS_BASE_URL || 'http://localhost:3002';
process.env.TRAZABILITY_BASE_URL = process.env.TRAZABILITY_BASE_URL || 'http://localhost:3003';
process.env.STORAGE_BASE_URL = process.env.STORAGE_BASE_URL || 'http://localhost:3004';
process.env.PUBLIC_TRACK_BASE_URL = process.env.PUBLIC_TRACK_BASE_URL || 'https://track.example.com';
