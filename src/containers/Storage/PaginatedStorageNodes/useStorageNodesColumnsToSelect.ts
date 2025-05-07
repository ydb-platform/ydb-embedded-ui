import {useAdditionalNodesProps} from '../../../utils/hooks/useAdditionalNodesProps';
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
    const additionalNodesProps = useAdditionalNodesProps();
    const {visibleEntities} = useStorageQueryParams();

    return useStorageNodesSelectedColumns({
        additionalNodesProps,
        visibleEntities,
        database,
        viewContext,
        columnsSettings,
    });
}
