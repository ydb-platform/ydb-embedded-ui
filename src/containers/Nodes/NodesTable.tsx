import React from 'react';

import {Illustration} from '../../components/Illustration';
import type {PaginatedTableData} from '../../components/PaginatedTable';
import {PAGINATED_TABLE_IDS, ResizeablePaginatedTable} from '../../components/PaginatedTable';
import {NODES_COLUMNS_WIDTH_LS_KEY} from '../../components/nodesColumns/constants';
import type {NodesColumn} from '../../components/nodesColumns/types';
import {useClusterWithProxy} from '../../store/reducers/cluster/cluster';
import type {NodesFilters} from '../../store/reducers/nodes/types';
import type {PreparedStorageNode} from '../../store/reducers/storage/types';
import type {NodesGroupByField, NodesPeerRole} from '../../types/api/nodes';
import {NodesUptimeFilterValues} from '../../utils/nodes';
import {renderPaginatedTableErrorMessage} from '../../utils/renderPaginatedTableErrorMessage';

import {getNodes} from './getNodes';
import i18n from './i18n';
import {getRowClassName} from './shared';

interface NodesTableProps {
    path?: string;
    database?: string;
    databaseFullPath?: string;

    searchValue: string;
    withProblems: boolean;
    uptimeFilter: NodesUptimeFilterValues;
    peerRoleFilter?: NodesPeerRole;

    filterGroup?: string;
    filterGroupBy?: NodesGroupByField;

    columns: NodesColumn[];
    scrollContainerRef: React.RefObject<HTMLElement>;

    initialEntitiesCount?: number;

    onDataFetched?: (data: PaginatedTableData<PreparedStorageNode>) => void;
}

export function NodesTable({
    path,
    database,
    databaseFullPath,
    searchValue,
    withProblems,
    uptimeFilter,
    peerRoleFilter,
    filterGroup,
    filterGroupBy,
    columns,
    scrollContainerRef,
    initialEntitiesCount,
    onDataFetched,
}: NodesTableProps) {
    const useMetaProxy = useClusterWithProxy();
    const tableFilters: NodesFilters = React.useMemo(() => {
        return {
            path,
            databaseFullPath,
            useMetaProxy,
            database,
            searchValue,
            withProblems,
            uptimeFilter,
            peerRoleFilter,
            filterGroup,
            filterGroupBy,
        };
    }, [
        path,
        databaseFullPath,
        useMetaProxy,
        database,
        searchValue,
        withProblems,
        uptimeFilter,
        peerRoleFilter,
        filterGroup,
        filterGroupBy,
    ]);

    const renderEmptyDataMessage = () => {
        if (withProblems || uptimeFilter !== NodesUptimeFilterValues.All) {
            return <Illustration name="thumbsUp" width={200} />;
        }

        return i18n('empty.default');
    };

    return (
        <ResizeablePaginatedTable
            columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
            scrollContainerRef={scrollContainerRef}
            columns={columns}
            fetchData={getNodes}
            initialEntitiesCount={initialEntitiesCount}
            renderErrorMessage={renderPaginatedTableErrorMessage}
            renderEmptyDataMessage={renderEmptyDataMessage}
            getRowClassName={getRowClassName}
            filters={tableFilters}
            tableName={PAGINATED_TABLE_IDS.NODES}
            onDataFetched={onDataFetched}
        />
    );
}
