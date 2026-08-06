import type {TenantStorageStats} from '../../../../../store/reducers/tenants/utils';
import type {ETenantType, TTenantResource} from '../../../../../types/api/tenant';

export interface TenantStorageMetrics {
    blobStorageUsed?: number;
    blobStorageLimit?: number;
    tabletStorageUsed?: number;
    tabletStorageLimit?: number;
}

export interface TenantStorageProps {
    allocatedResources?: TTenantResource[];
    database: string;
    databaseFullPath: string;
    metrics: TenantStorageMetrics;
    blobStorageStats?: TenantStorageStats[];
    tabletStorageStats?: TenantStorageStats[];
    databaseType?: ETenantType;
}
