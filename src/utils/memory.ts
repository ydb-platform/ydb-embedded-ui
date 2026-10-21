import type {TSystemStateInfo} from '../types/api/nodes';

import {parseOptionalNonNegativeNumber} from './utils';

export function getNodeMemory(
    node: Pick<TSystemStateInfo, 'MemoryStats' | 'MemoryUsed' | 'MemoryLimit'>,
) {
    // Match the backend's process usage and sorting, including its allocator fallback.
    const memoryUsed =
        parseOptionalNonNegativeNumber(node.MemoryUsed) ??
        parseOptionalNonNegativeNumber(node.MemoryStats?.AnonRss) ??
        parseOptionalNonNegativeNumber(node.MemoryStats?.AllocatedMemory);
    const memoryLimit = parseOptionalNonNegativeNumber(node.MemoryLimit) || undefined;

    return {memoryUsed, memoryLimit};
}
