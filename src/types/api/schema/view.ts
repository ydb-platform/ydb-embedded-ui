import type {TPathID} from './shared';

export interface TViewDescription {
    Name?: string;
    PathId?: TPathID;
    /** uint64 */
    Version?: string;
    QueryText?: string;
}
