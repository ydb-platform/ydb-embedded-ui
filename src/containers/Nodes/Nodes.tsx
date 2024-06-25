import React from 'react';

import {ASCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';
import {skipToken} from '@reduxjs/toolkit/query';
import {StringParam, useQueryParams} from 'use-query-params';

import {EntitiesCount} from '../../components/EntitiesCount';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {ProblemFilter} from '../../components/ProblemFilter';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {selectAutoRefreshInterval} from '../../store/reducers/autoRefreshControl';
import {nodesApi} from '../../store/reducers/nodes/nodes';
import {filterNodes} from '../../store/reducers/nodes/selectors';
import type {NodesSortParams} from '../../store/reducers/nodes/types';
import {ProblemFilterValues, changeFilter} from '../../store/reducers/settings/settings';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {
    DEFAULT_POLLING_INTERVAL,
    DEFAULT_TABLE_SETTINGS,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
} from '../../utils/constants';
import {useSetting, useTableSort, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {
    NodesUptimeFilterValues,
    isSortableNodesProperty,
    isUnavailableNode,
    nodesUptimeFilterValuesSchema,
} from '../../utils/nodes';

import {NODES_COLUMNS_WIDTH_LS_KEY, getNodesColumns} from './getNodesColumns';
import i18n from './i18n';

import './Nodes.scss';

const b = cn('ydb-nodes');

interface NodesProps {
    path?: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export const Nodes = ({path, additionalNodesProps = {}}: NodesProps) => {
    const [queryParams, setQueryParams] = useQueryParams({
        uptimeFilter: StringParam,
        search: StringParam,
    });
    const uptimeFilter = nodesUptimeFilterValuesSchema.parse(queryParams.uptimeFilter);
    const searchValue = queryParams.search ?? '';

    const dispatch = useTypedDispatch();

    const isClusterNodes = !path;

    const problemFilter = useTypedSelector((state) => state.settings.problemFilter);
    const autorefresh = useTypedSelector(selectAutoRefreshInterval);

    const [useNodesEndpoint] = useSetting(USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY);

    const autoRefreshInterval = isClusterNodes ? DEFAULT_POLLING_INTERVAL : autorefresh;
    // If there is no path, it's cluster Nodes tab
    const useGetComputeNodes = path && !useNodesEndpoint;
    const nodesQuery = nodesApi.useGetNodesQuery(useGetComputeNodes ? skipToken : {path}, {
        pollingInterval: autoRefreshInterval,
    });
    const computeQuery = nodesApi.useGetComputeNodesQuery(useGetComputeNodes ? {path} : skipToken, {
        pollingInterval: autoRefreshInterval,
    });

    const {currentData: data, isLoading, error} = useGetComputeNodes ? computeQuery : nodesQuery;

    const [sortValue, setSortValue] = React.useState<NodesSortParams>({
        sortValue: 'NodeId',
        sortOrder: ASCENDING,
    });
    const [sort, handleSort] = useTableSort(sortValue, (sortParams) => {
        setSortValue(sortParams as NodesSortParams);
    });

    const handleSearchQueryChange = (value: string) => {
        setQueryParams({search: value || undefined}, 'replaceIn');
    };

    const handleProblemFilterChange = (value: ProblemFilterValue) => {
        dispatch(changeFilter(value));
    };

    const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
        setQueryParams({uptimeFilter: value}, 'replaceIn');
    };

    const nodes = React.useMemo(() => {
        return filterNodes(data?.Nodes, {searchValue, uptimeFilter, problemFilter});
    }, [data, searchValue, uptimeFilter, problemFilter]);

    const totalNodes = data?.TotalNodes || 0;

    const renderControls = () => {
        return (
            <React.Fragment>
                <Search
                    onChange={handleSearchQueryChange}
                    placeholder="Host name"
                    className={b('search')}
                    value={searchValue}
                />
                <ProblemFilter value={problemFilter} onChange={handleProblemFilterChange} />
                <UptimeFilter value={uptimeFilter} onChange={handleUptimeFilterChange} />
                <EntitiesCount
                    total={totalNodes}
                    current={nodes?.length || 0}
                    label={'Nodes'}
                    loading={isLoading}
                />
            </React.Fragment>
        );
    };

    const renderTable = () => {
        const rawColumns = getNodesColumns({
            getNodeRef: additionalNodesProps.getNodeRef,
        });

        const columns = rawColumns.map((column) => {
            return {...column, sortable: isSortableNodesProperty(column.name)};
        });

        if (nodes && nodes.length === 0) {
            if (
                problemFilter !== ProblemFilterValues.ALL ||
                uptimeFilter !== NodesUptimeFilterValues.All
            ) {
                return <Illustration name="thumbsUp" width="200" />;
            }
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={NODES_COLUMNS_WIDTH_LS_KEY}
                data={nodes || []}
                columns={columns}
                settings={DEFAULT_TABLE_SETTINGS}
                sortOrder={sort}
                onSort={handleSort}
                emptyDataMessage={i18n('empty.default')}
                rowClassName={(row) => b('node', {unavailable: isUnavailableNode(row)})}
            />
        );
    };

    if (error) {
        if ((error as any).status === 403) {
            return <AccessDenied />;
        }
        return <ResponseError error={error} />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={isLoading}>
                {renderTable()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
