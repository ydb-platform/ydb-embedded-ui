export enum EShardsWorkloadMode {
    Immediate = 'immediate',
    History = 'history',
}

export interface ShardsWorkloadFilters {
    /** ms from epoch */
    from?: number;
    /** ms from epoch */
    to?: number;
    mode?: EShardsWorkloadMode;
}

export interface ShardsWorkloadRootStateSlice {
    shardsWorkload: ShardsWorkloadFilters;
}
