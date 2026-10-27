export const VDisksGroupBy = {
    State: 'State',
    Space: 'Space',
    FrontQueues: 'FrontQueues',
    Compaction: 'Compaction',
    DriveType: 'DriveType',
    Datacenter: 'DC',
    All: 'All',
} as const;

export type VDisksGroupByValue = (typeof VDisksGroupBy)[keyof typeof VDisksGroupBy];
