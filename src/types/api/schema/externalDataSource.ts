import type {TPathID} from './shared';

export interface TExternalDataSourceDescription {
    Name?: string;
    PathId?: TPathID;
    /** uint64 */
    Version?: string;
    SourceType?: string;
    Location?: string;
    Installation?: string;
    Auth?: TAuth;
}

interface TAuth {
    None?: NoneAuth;
    ServiceAccount?: ServiceAccountAuth;
}

interface NoneAuth {}

interface ServiceAccountAuth {
    Id?: string;
    SecretName?: string;
}
