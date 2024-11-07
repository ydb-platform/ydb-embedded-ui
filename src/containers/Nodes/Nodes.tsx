import React from 'react';

import {ASCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';

import {AccessDenied} from '../../components/Errors/403';
import {isAccessError} from '../../components/Errors/PageError/PageError';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {NODES_COLUMNS_WIDTH_LS_KEY} from '../../components/nodesColumns/constants';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import {filterNodes} from '../../store/reducers/nodes/selectors';
import type {NodesSortParams} from '../../store/reducers/nodes/types';
import {useProblemFilter} from '../../store/reducers/settings/hooks';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutoRefreshInterval, useTableSort} from '../../utils/hooks';
import {NodesUptimeFilterValues} from '../../utils/nodes';

import {NodesControls} from './NodesControls/NodesControls';
import {useNodesSelectedColumns} from './columns/hooks';
import i18n from './i18n';
import {getRowClassName} from './shared';
import {useNodesPageQueryParams} from './useNodesPageQueryParams';

import './Nodes.scss';

interface NodesProps {
    path?: string;
    database?: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export const Nodes = ({path, database, additionalNodesProps = {}}: NodesProps) => {
    const {searchValue, uptimeFilter} = useNodesPageQueryParams();
    const {problemFilter} = useProblemFilter();

    const [autoRefreshInterval] = useAutoRefreshInterval();

    const {columnsToShow, columnsToSelect, setColumns} = useNodesSelectedColumns({
        getNodeRef: additionalNodesProps.getNodeRef,
        database,
    });

    const {
        currentData: data,
        isLoading,
        error,
    } = nodesApi.useGetNodesQuery({path, database}, {pollingInterval: autoRefreshInterval});

    const [sortValue, setSortValue] = React.useState<NodesSortParams>({
        sortValue: 'NodeId',
        sortOrder: ASCENDING,
    });
    const [sort, handleSort] = useTableSort(sortValue, (sortParams) => {
        setSortValue(sortParams as NodesSortParams);
    });

    const nodes = React.useMemo(() => {
        return filterNodes(data?.Nodes, {searchValue, uptimeFilter, problemFilter});
    }, [data, searchValue, uptimeFilter, problemFilter]);

    const totalNodes = data?.TotalNodes || 0;

    const renderControls = () => {
        return (
            <NodesControls
                columnsToSelect={columnsToSelect}
                handleSelectedColumnsUpdate={setColumns}
                entitiesCountCurrent={nodes.length}
                entitiesCountTotal={totalNodes}
                entitiesLoading={isLoading}
            />
        );
    };

    const renderTable = () => {
        if (nodes.length === 0) {
            if (problemFilter !== 'All' || uptimeFilter !== NodesUptimeFilterValues.All) {
                return <Illustration name="thumbsUp" width="200" />;
            }
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
                data={nodes || []}
                columns={columnsToShow}
                settings={DEFAULT_TABLE_SETTINGS}
                sortOrder={sort}
                onSort={handleSort}
                emptyDataMessage={i18n('empty.default')}
                rowClassName={getRowClassName}
            />
        );
    };

    if (isAccessError(error)) {
        return <AccessDenied />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            {error ? <ResponseError error={error} /> : null}
            <TableWithControlsLayout.Table loading={isLoading}>
                {data ? renderTable() : null}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
