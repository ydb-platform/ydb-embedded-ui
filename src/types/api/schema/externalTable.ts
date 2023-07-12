import type {TColumnDescription, TPathID} from './schema';

export interface TExternalTableDescription {
    Name?: string;
    PathId?: TPathID;
    /** uint64 */
    Version?: string;
    SourceType?: string;
    DataSourcePath?: string;
    Location?: string;
    Columns?: TColumnDescription[];
    /** bytes */
    Content?: unknown;
}
