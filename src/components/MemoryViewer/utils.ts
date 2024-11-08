import type {TMemoryStats} from '../../types/api/nodes';
import {isNumeric} from '../../utils/utils';

import i18n from './i18n';

function getMaybeNumber(value: string | number | undefined): number | undefined {
    return isNumeric(value) ? parseFloat(String(value)) : undefined;
}

interface MemorySegment {
    label: string;
    key: string;
    value: number;
    capacity?: number;
    isInfo?: boolean;
}

export function getMemorySegments(stats: TMemoryStats): MemorySegment[] {
    const segments = [
        {
            label: i18n('text_external-consumption'),
            key: 'ExternalConsumption',
            value: getMaybeNumber(stats.ExternalConsumption),
            isInfo: true,
        },
        {
            label: i18n('text_allocator-caches'),
            key: 'AllocatorCachesMemory',
            value: getMaybeNumber(stats.AllocatorCachesMemory),
        },
        {
            label: i18n('text_shared-cache'),
            key: 'SharedCacheConsumption',
            value: getMaybeNumber(stats.SharedCacheConsumption),
            capacity: getMaybeNumber(stats.SharedCacheLimit),
        },
        {
            label: i18n('text_memtable'),
            key: 'MemTableConsumption',
            value: getMaybeNumber(stats.MemTableConsumption),
            capacity: getMaybeNumber(stats.MemTableLimit),
        },
        {
            label: i18n('text_query-execution'),
            key: 'QueryExecutionConsumption',
            value: getMaybeNumber(stats.QueryExecutionConsumption),
            capacity: getMaybeNumber(stats.QueryExecutionLimit),
        },
        {
            label: i18n('text_soft-limit'),
            key: 'SoftLimit',
            value: getMaybeNumber(stats.SoftLimit),
        },
        {
            label: i18n('text_hard-limit'),
            key: 'HardLimit',
            value: getMaybeNumber(stats.HardLimit),
        },
    ];

    return segments.filter((segment) => segment.value !== undefined) as MemorySegment[];
}
