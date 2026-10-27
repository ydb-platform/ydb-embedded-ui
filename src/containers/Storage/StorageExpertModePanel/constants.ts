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
    DriveType: 'DriveType',
    All: 'All',
} as const;

export type PDisksGroupByValue = (typeof PDisksGroupBy)[keyof typeof PDisksGroupBy];

export const NODES_VDISKS_GROUP_BY_VALUES = [
    VDisksGroupBy.State,
    VDisksGroupBy.Space,
    VDisksGroupBy.FrontQueues,
    VDisksGroupBy.Compaction,
    VDisksGroupBy.All,
] as const;
export type NodesVDisksGroupByValue = (typeof NODES_VDISKS_GROUP_BY_VALUES)[number];

export const NODES_PDISKS_GROUP_BY_VALUES = [
    PDisksGroupBy.State,
    PDisksGroupBy.Space,
    PDisksGroupBy.Drive,
    PDisksGroupBy.Decommit,
    PDisksGroupBy.Maintenance,
    PDisksGroupBy.Device,
    PDisksGroupBy.All,
] as const;
export type NodesPDisksGroupByValue = (typeof NODES_PDISKS_GROUP_BY_VALUES)[number];

export const vdisksGroupBySchema = z.nativeEnum(VDisksGroupBy).catch(VDisksGroupBy.State);
export const pdisksGroupBySchema = z.nativeEnum(PDisksGroupBy).catch(PDisksGroupBy.State);
export const nodesVdisksGroupBySchema = z
    .enum(NODES_VDISKS_GROUP_BY_VALUES)
    .catch(VDisksGroupBy.State);
export const nodesPdisksGroupBySchema = z
    .enum(NODES_PDISKS_GROUP_BY_VALUES)
    .catch(PDisksGroupBy.State);

export const b = cn('ydb-storage-expert-mode-panel');
