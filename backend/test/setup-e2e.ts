// E2E tests run against a separate database that is wiped on every run.
process.env.DB_NAME = process.env.DB_TEST_NAME ?? 'tasks_test';
process.env.DB_DROP_SCHEMA = 'true';
