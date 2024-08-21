// Pages
export const tenantsPage = 'cluster/tenants';
export const nodesPage = 'cluster/nodes';
export const storagePage = 'cluster/storage';
export const clusterPage = 'cluster/cluster';
export const authPage = 'auth';
export const tenantPage = 'tenant';

// Entities
export const tenantName = '/local';
export const dsVslotsSchema = '/local/.sys/ds_vslots';
export const dsVslotsTableName = 'ds_vslots';

// URLs
export const backend = process.env.PLAYWRIGHT_APP_BACKEND || 'http://localhost:8765';
