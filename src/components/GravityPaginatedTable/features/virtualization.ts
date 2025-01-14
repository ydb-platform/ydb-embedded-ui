import React from 'react';

import {useRowVirtualizer} from '@gravity-ui/table';

import type {BaseEntity, VirtualRow} from '../types';

const OVERSCAN_COUNT = 5;

interface UseVirtualizationProps<T extends BaseEntity> {
    data: T[];
    totalEntities: number;
    rowHeight: number;
    containerRef: React.RefObject<HTMLDivElement>;
    isLoadingMore: boolean;
}

export function useVirtualization<T extends BaseEntity>({
    data,
    totalEntities,
    rowHeight,
    containerRef,
    isLoadingMore,
}: UseVirtualizationProps<T>) {
    // Generate virtual rows
    const virtualRows = React.useMemo(() => {
        const items: VirtualRow<T>[] = data.map((item, index) => ({
            id: item.id || item.NodeId || index,
            type: 'data',
            data: item,
            index,
        }));

        // Add loading/empty rows for unloaded content
        for (let i = data.length; i < totalEntities; i++) {
            items[i] = {
                id: `virtual-${i}`,
                type: isLoadingMore && i < data.length + OVERSCAN_COUNT ? 'loading' : 'empty',
                index: i,
            };
        }
        return items;
    }, [data, totalEntities, isLoadingMore]);

    // Initialize virtualizer
    const rowVirtualizer = useRowVirtualizer({
        count: virtualRows.length,
        estimateSize: () => rowHeight,
        overscan: OVERSCAN_COUNT,
        getScrollElement: () => containerRef.current,
    });

    // Get virtual items
    const virtualItems = rowVirtualizer.getVirtualItems();

    // Calculate total size
    const totalSize = virtualRows.length * rowHeight;

    return {
        virtualRows,
        virtualItems,
        totalSize,
    };
}
