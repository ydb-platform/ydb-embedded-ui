import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {ASCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';
import {skipToken} from '@reduxjs/toolkit/query';

import {EntitiesCount} from '../../components/EntitiesCount';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {ProblemFilter} from '../../components/ProblemFilter';
import {Search} from '../../components/Search';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {
    nodesApi,
    setInitialState,
    setSearchValue,
    setSort,
    setUptimeFilter,
} from '../../store/reducers/nodes/nodes';
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
} from '../../utils/nodes';

import {getNodesColumns} from './getNodesColumns';
import i18n from './i18n';

import './Nodes.scss';

const b = cn('ydb-nodes');

interface NodesProps {
    path?: string;
    additionalNodesProps?: AdditionalNodesProps;
}

export const Nodes = ({path, additionalNodesProps = {}}: NodesProps) => {
    const dispatch = useTypedDispatch();

    const isClusterNodes = !path;

    const {
        uptimeFilter,
        searchValue,
        sortOrder = ASCENDING,
        sortValue = 'NodeId',
    } = useTypedSelector((state) => state.nodes);
    const problemFilter = useTypedSelector((state) => state.settings.problemFilter);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const [useNodesEndpoint] = useSetting(USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY);

    const useAutoRefresh = isClusterNodes ? true : autorefresh;
    // If there is no path, it's cluster Nodes tab
    const useGetComputeNodes = path && !useNodesEndpoint;
    const nodesQuery = nodesApi.useGetNodesQuery(useGetComputeNodes ? skipToken : {path}, {
        pollingInterval: useAutoRefresh ? DEFAULT_POLLING_INTERVAL : 0,
    });
    const computeQuery = nodesApi.useGetComputeNodesQuery(useGetComputeNodes ? {path} : skipToken, {
        pollingInterval: useAutoRefresh ? DEFAULT_POLLING_INTERVAL : 0,
    });

    const {currentData: data, isLoading, error} = useGetComputeNodes ? computeQuery : nodesQuery;

    const [sort, handleSort] = useTableSort({sortValue, sortOrder}, (sortParams) =>
        dispatch(setSort(sortParams as NodesSortParams)),
    );

    const handleSearchQueryChange = (value: string) => {
        dispatch(setSearchValue(value));
    };

    const handleProblemFilterChange = (value: ProblemFilterValue) => {
        dispatch(changeFilter(value));
    };

    const handleUptimeFilterChange = (value: NodesUptimeFilterValues) => {
        dispatch(setUptimeFilter(value));
    };

    // Since Nodes component is used in several places,
    // we need to reset filters, searchValue
    // in nodes reducer when path changes
    React.useEffect(() => {
        return () => {
            // Clean data on component unmount
            dispatch(setInitialState());
        };
    }, [dispatch, path]);

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
            <DataTable
                theme="yandex-cloud"
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
            <TableWithControlsLayout.Table loading={isLoading} className={b('table')}>
                {renderTable()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
