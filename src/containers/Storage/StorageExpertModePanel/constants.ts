import {z} from 'zod';

import {cn} from '../../../utils/cn';
import {VDisksGroupBy} from '../../../utils/disks/groupBy';
import type {VDisksGroupByValue} from '../../../utils/disks/groupBy';

export {VDisksGroupBy};
export type {VDisksGroupByValue};

export const PDisksGroupBy = {
    State: 'State',
    Space: 'Space',
    Drive: 'Drive',
    Decommit: 'Decommit',
    Maintenance: 'Maintenance',
    Device: 'Device',
    All: 'All',
} as const;

export type PDisksGroupByValue = (typeof PDisksGroupBy)[keyof typeof PDisksGroupBy];

export const vdisksGroupBySchema = z.nativeEnum(VDisksGroupBy).catch(VDisksGroupBy.State);
export const pdisksGroupBySchema = z.nativeEnum(PDisksGroupBy).catch(PDisksGroupBy.State);

export const b = cn('ydb-storage-expert-mode-panel');
