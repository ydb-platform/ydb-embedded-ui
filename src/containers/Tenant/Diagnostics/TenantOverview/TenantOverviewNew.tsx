// loading: PropTypes.bool,
// autorefresh: PropTypes.bool,
// tenant: PropTypes.object,
// systemTablets: PropTypes.array,
// additionalTenantInfo: PropTypes.func,
// tenantName: PropTypes.string,

// import type {TTabletStateInfo} from '../../../../types/api/tablet';
// import type {TTenant} from '../../../../types/api/tenant';
// import {formatCPU} from '../../../../utils';
// import {TABLET_STATES} from '../../../../utils/constants';
// import {bytesToGB} from '../../../../utils/utils';
// import {mapDatabaseTypeToDBName} from '../../utils/schema';

// interface TenantOverviewProps {
//     loading?: boolean;
//     autorefresh?: boolean;
//     tenant: TTenant;
//     systemTablets: TTabletStateInfo[];
//     additionalTenantInfo: any;
//     tenantName: string;
// }

// export function TenantOverview({tenant, loading}: TenantOverviewProps) {
//     const {
//         Metrics = {},
//         PoolStats,
//         StateStats = [],
//         MemoryUsed,
//         Name,
//         CoresUsed,
//         StorageGroups,
//         StorageAllocatedSize,
//         Type,
//         SystemTablets,
//     } = tenant;

//     const tenantName = mapDatabaseTypeToDBName(Type);
//     const memoryRaw = MemoryUsed ?? Metrics.Memory;

//     const memory = (memoryRaw && bytesToGB(memoryRaw)) || 'no data';
//     const storage = (Metrics.Storage && bytesToGB(Metrics.Storage)) || 'no data';
//     const storageGroups = StorageGroups ?? 'no data';
//     const blobStorage = (StorageAllocatedSize && bytesToGB(StorageAllocatedSize)) || 'no data';
//     const storageEfficiency =
//         Metrics.Storage && StorageAllocatedSize
//             ? `${((parseInt(Metrics.Storage) * 100) / parseInt(StorageAllocatedSize)).toFixed(2)}%`
//             : 'no data';

//     const cpuRaw = CoresUsed !== undefined ? Number(CoresUsed) * 1_000_000 : Metrics.CPU;

//     const cpu = formatCPU(cpuRaw);

//     const metricsInfo = [
//         {label: 'Type', value: Type},
//         {label: 'Memory', value: memory},
//         {label: 'CPU', value: cpu},
//         {label: 'Tablet storage', value: storage},
//         {label: 'Storage groups', value: storageGroups},
//         {label: 'Blob storage', value: blobStorage},
//         {label: 'Storage efficiency', value: storageEfficiency},
//     ];

//     const tabletsInfo = StateStats.map((info) => {
//         if (info.VolatileState) {
//             return {label: TABLET_STATES[info.VolatileState], value: info.Count};
//         }
//         return {label: TABLET_STATES.TABLET_VOLATILE_STATE_UNKNOWN, value: 0};
//     });
// }

export {};
