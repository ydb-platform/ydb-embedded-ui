import type {TSystemStateInfo} from '../types/api/nodes';

import {parseOptionalNonNegativeNumber} from './utils';

export function getNodeMemory(
    node: Pick<TSystemStateInfo, 'MemoryStats' | 'MemoryUsed' | 'MemoryLimit'>,
) {
    const stats = node.MemoryStats;
    const anonRss = parseOptionalNonNegativeNumber(stats?.AnonRss);
    const allocated = parseOptionalNonNegativeNumber(stats?.AllocatedMemory);
    const caches = parseOptionalNonNegativeNumber(stats?.AllocatorCachesMemory);
    const allocatorUsage =
        allocated !== undefined || caches !== undefined
            ? (allocated ?? 0) + (caches ?? 0)
            : undefined;

    const memoryUsed = anonRss ?? allocatorUsage ?? parseOptionalNonNegativeNumber(node.MemoryUsed);
    const memoryLimit =
        parseOptionalNonNegativeNumber(stats?.HardLimit) ||
        parseOptionalNonNegativeNumber(node.MemoryLimit) ||
        undefined;

    return {memoryUsed, memoryLimit};
}
