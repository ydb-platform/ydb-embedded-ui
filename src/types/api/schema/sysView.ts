import type {TPathID} from './shared';

export interface TSysViewDescription {
    Name?: string;
    Type?: ESysViewType;
    SourceObject?: TPathID;
}

export type ESysViewType =
    | 'EPartitionStats'
    | 'ENodes'
    | 'ETopQueriesByDurationOneMinute'
    | 'ETopQueriesByDurationOneHour'
    | 'ETopQueriesByReadBytesOneMinute'
    | 'ETopQueriesByReadBytesOneHour'
    | 'ETopQueriesByCpuTimeOneMinute'
    | 'ETopQueriesByCpuTimeOneHour'
    | 'ETopQueriesByRequestUnitsOneMinute'
    | 'ETopQueriesByRequestUnitsOneHour'
    | 'EQuerySessions'
    | 'EPDisks'
    | 'EVSlots'
    | 'EGroups'
    | 'EStoragePools'
    | 'EStorageStats'
    | 'ETablets'
    | 'EQueryMetricsOneMinute'
    | 'ETopPartitionsByCpuOneMinute'
    | 'ETopPartitionsByCpuOneHour'
    | 'ETopPartitionsByTliOneMinute'
    | 'ETopPartitionsByTliOneHour'
    | 'EResourcePoolClassifiers'
    | 'EResourcePools'
    | 'EAuthUsers'
    | 'EAuthGroups'
    | 'EAuthGroupMembers'
    | 'EAuthOwners'
    | 'EAuthPermissions'
    | 'EAuthEffectivePermissions'
    | 'EPgTables'
    | 'EInformationSchemaTables'
    | 'EPgClass'
    | 'EShowCreate'
    | 'ECompileCacheQueries';
