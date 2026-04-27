// Pages
export const databasesPage = 'cluster/databases';
export const nodesPage = 'cluster/nodes';
export const storagePage = 'cluster/storage';
export const clusterPage = 'cluster/databases';
export const authPage = 'auth';
export const databasePage = 'database';

// Deprecated aliases — kept temporarily for callers still using the old names.
// Prefer `databasePage` / `databasesPage` in new code.
export const tenantPage = databasePage;
export const tenantsPage = databasesPage;

// Entities
export const database = '/local';
export const dsVslotsSchema = '/local/.sys/ds_vslots';
export const dsVslotsTableName = 'ds_vslots';
export const dsStorageStatsTableName = 'ds_storage_stats';
export const dsStoragePoolsTableName = 'ds_storage_pools';

// URLs
export const backend = process.env.PLAYWRIGHT_APP_BACKEND || 'http://localhost:8765';
