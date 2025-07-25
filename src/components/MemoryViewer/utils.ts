import type {TMemoryStats} from '../../types/api/nodes';
import {isNumeric} from '../../utils/utils';

import i18n from './i18n';

export function calculateAllocatedMemory(stats: TMemoryStats) {
    const allocatedMemory = getMaybeNumber(stats.AllocatedMemory) || 0;
    const allocatorCaches = getMaybeNumber(stats.AllocatorCachesMemory) || 0;
    return String(allocatedMemory + allocatorCaches);
}

export function getMaybeNumber(value: string | number | undefined): number | undefined {
    return isNumeric(value) ? parseFloat(String(value)) : undefined;
}

export interface MemorySegment {
    label: string;
    key: string;
    value: number;
    capacity?: number;
    isInfo?: boolean;
}

// Memory segment colors using CSS variables for theme support
export const MEMORY_SEGMENT_COLORS: Record<string, string> = {
    SharedCacheConsumption: 'var(--g-color-base-info-medium)',
    QueryExecutionConsumption: 'var(--g-color-base-positive-medium)',
    MemTableConsumption: 'var(--g-color-base-warning-medium)',
    AllocatorCachesMemory: 'var(--g-color-base-danger-medium)',
    Other: 'var(--g-color-base-neutral-medium)',
};

export function getMemorySegmentColor(key: string): string {
    return MEMORY_SEGMENT_COLORS[key] || MEMORY_SEGMENT_COLORS['Other'];
}

export function getMemorySegments(stats: TMemoryStats, memoryUsage: number): MemorySegment[] {
    const segments = [
        {
            label: i18n('text_shared-cache'),
            key: 'SharedCacheConsumption',
            value: getMaybeNumber(stats.SharedCacheConsumption),
            capacity: getMaybeNumber(stats.SharedCacheLimit),
            isInfo: false,
        },
        {
            label: i18n('text_query-execution'),
            key: 'QueryExecutionConsumption',
            value: getMaybeNumber(stats.QueryExecutionConsumption),
            capacity: getMaybeNumber(stats.QueryExecutionLimit),
            isInfo: false,
        },
        {
            label: i18n('text_memtable'),
            key: 'MemTableConsumption',
            value: getMaybeNumber(stats.MemTableConsumption),
            capacity: getMaybeNumber(stats.MemTableLimit),
            isInfo: false,
        },
        {
            label: i18n('text_allocator-caches'),
            key: 'AllocatorCachesMemory',
            value: getMaybeNumber(stats.AllocatorCachesMemory),
            isInfo: false,
        },
    ];

    const nonInfoSegments = segments.filter(
        (segment) => segment.value !== undefined,
    ) as MemorySegment[];
    const sumNonInfoSegments = nonInfoSegments.reduce((acc, segment) => acc + segment.value, 0);

    const otherMemory = Math.max(0, memoryUsage - sumNonInfoSegments);

    segments.push({
        label: i18n('text_other'),
        key: 'Other',
        value: otherMemory,
        isInfo: false,
    });

    segments.push(
        {
            label: i18n('text_external-consumption'),
            key: 'ExternalConsumption',
            value: getMaybeNumber(stats.ExternalConsumption),
            isInfo: true,
        },
        {
            label: i18n('text_usage'),
            key: 'Usage',
            value: memoryUsage,
            isInfo: true,
        },
        {
            label: i18n('text_soft-limit'),
            key: 'SoftLimit',
            value: getMaybeNumber(stats.SoftLimit),
            isInfo: true,
        },
        {
            label: i18n('text_hard-limit'),
            key: 'HardLimit',
            value: getMaybeNumber(stats.HardLimit),
            isInfo: true,
        },
    );

    return segments.filter((segment) => segment.value !== undefined) as MemorySegment[];
}
