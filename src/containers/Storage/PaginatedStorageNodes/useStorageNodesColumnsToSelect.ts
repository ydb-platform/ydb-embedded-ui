import {useStorageNodesSelectedColumns} from '../PaginatedStorageNodesTable/columns/hooks';
import type {StorageNodesColumnsSettings} from '../PaginatedStorageNodesTable/columns/types';
import type {StorageViewContext} from '../types';
import {useStorageQueryParams} from '../useStorageQueryParams';

export function useStorageNodesColumnsToSelect({
    database,
    viewContext,
    columnsSettings,
}: {
    database?: string;
    viewContext?: StorageViewContext;
    columnsSettings?: StorageNodesColumnsSettings;
}) {
    const {visibleEntities} = useStorageQueryParams();

    return useStorageNodesSelectedColumns({
        visibleEntities,
        database,
        viewContext,
        columnsSettings,
    });
}
