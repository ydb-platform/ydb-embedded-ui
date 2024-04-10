import type {TSystemStateInfo} from './nodes';

/**
 * endpoint: /viewer/json/sysinfo
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/node_whiteboard.proto
 */
export interface TEvSystemStateResponse {
    SystemStateInfo?: TSystemStateInfo[];
    /** uint64 */
    ResponseTime?: string;
    ResponseDuration?: number;
}
