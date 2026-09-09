import type React from 'react';

import {useStorageNodesSelectedColumns} from '../PaginatedStorageNodesTable/columns/hooks';
import type {StorageNodesColumnsSettings} from '../PaginatedStorageNodesTable/columns/types';
import type {StorageViewContext} from '../types';
import {useStorageQueryParams} from '../useStorageQueryParams';

export function useStorageNodesColumnsToSelect({
    database,
    viewContext,
    columnsSettings,
    scrollContainerRef,
}: {
    database?: string;
    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;
    scrollContainerRef?: React.RefObject<HTMLElement>;
}) {
    const {visibleEntities} = useStorageQueryParams();

    return useStorageNodesSelectedColumns({
        visibleEntities,
        database,
        viewContext,
        columnsSettings,
        scrollContainerRef,
    });
}
