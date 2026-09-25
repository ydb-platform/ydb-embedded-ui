export const VDisksGroupBy = {
    State: 'State',
    Space: 'Space',
    FrontQueues: 'FrontQueues',
    Compaction: 'Compaction',
    DriveType: 'DriveType',
    All: 'All',
} as const;

export type VDisksGroupByValue = (typeof VDisksGroupBy)[keyof typeof VDisksGroupBy];
