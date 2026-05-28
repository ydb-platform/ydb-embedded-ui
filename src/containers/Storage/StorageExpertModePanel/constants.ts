import {z} from 'zod';

export const VDisksGroupBy = {
    State: 'State',
    Space: 'Space',
    FrontQueues: 'FrontQueues',
    Compaction: 'Compaction',
    All: 'All',
} as const;

export type VDisksGroupByValue = (typeof VDisksGroupBy)[keyof typeof VDisksGroupBy];

export const vdisksGroupBySchema = z.nativeEnum(VDisksGroupBy).catch(VDisksGroupBy.State);
