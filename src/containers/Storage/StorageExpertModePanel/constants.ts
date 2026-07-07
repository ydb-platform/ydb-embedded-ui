import {z} from 'zod';

import {cn} from '../../../utils/cn';
import {VDisksGroupBy} from '../../../utils/disks/groupBy';
import type {VDisksGroupByValue} from '../../../utils/disks/groupBy';

export {VDisksGroupBy};
export type {VDisksGroupByValue};

export const vdisksGroupBySchema = z.nativeEnum(VDisksGroupBy).catch(VDisksGroupBy.State);

export const b = cn('ydb-storage-expert-mode-panel');
