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

    // The backend sorts both Memory and MemoryDetailed by MemoryUsed.
    const memoryUsed = parseOptionalNonNegativeNumber(node.MemoryUsed) ?? anonRss ?? allocatorUsage;
    const memoryLimit =
        parseOptionalNonNegativeNumber(stats?.HardLimit) ||
        parseOptionalNonNegativeNumber(node.MemoryLimit) ||
        undefined;

    return {memoryUsed, memoryLimit};
}
