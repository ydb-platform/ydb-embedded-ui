import type {TSystemStateInfo} from './nodes';
import type {TThreadPoolInfo} from './threads';

/**
 * endpoint: /viewer/json/sysinfo
 *
 * source: https://github.com/ydb-platform/ydb/blob/main/ydb/core/protos/node_whiteboard.proto
 */
export interface TEvSystemStateResponse {
    SystemStateInfo?: TSystemStateInfo[];
    /** Detailed thread information when fields_required=-1 is used */
    Threads?: TThreadPoolInfo[];
    /** uint64 */
    ResponseTime?: string;
    ResponseDuration?: number;
}
