export enum EShardsWorkloadMode {
    Immediate = 'immediate',
    History = 'history',
}

export interface ShardsWorkloadFilters {
    /** ms from epoch */
    from?: string;
    /** ms from epoch */
    to?: string;
    mode?: EShardsWorkloadMode;
}
