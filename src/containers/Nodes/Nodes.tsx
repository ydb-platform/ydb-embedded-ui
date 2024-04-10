import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {ASCENDING} from '@gravity-ui/react-data-table/build/esm/lib/constants';

import {EntitiesCount} from '../../components/EntitiesCount';
import {AccessDenied} from '../../components/Errors/403';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {ProblemFilter} from '../../components/ProblemFilter';
import {Search} from '../../components/Search';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {
    getComputeNodes,
    getNodes,
    resetNodesState,
    setDataWasNotLoaded,
    setNodesUptimeFilter,
    setSearchValue,
    setSort,
} from '../../store/reducers/nodes/nodes';
import {selectFilteredNodes} from '../../store/reducers/nodes/selectors';
import type {NodesSortParams} from '../../store/reducers/nodes/types';
import {ProblemFilterValues, changeFilter} from '../../store/reducers/settings/settings';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import type {AdditionalNodesProps} from '../../types/additionalProps';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS, USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY} from '../../utils/constants';
import {
    useAutofetcher,
    useSetting,
    useTableSort,
    useTypedDispatch,
    useTypedSelector,
} from '../../utils/hooks';
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

    // Since Nodes component is used in several places,
    // we need to reset filters, searchValue and loading state
    // in nodes reducer when path changes
    React.useEffect(() => {
        dispatch(resetNodesState());
    }, [dispatch, path]);

    const {
        wasLoaded,
        loading,
        error,
        nodesUptimeFilter,
        searchValue,
        sortOrder = ASCENDING,
        sortValue = 'NodeId',
        totalNodes,
    } = useTypedSelector((state) => state.nodes);
    const problemFilter = useTypedSelector((state) => state.settings.problemFilter);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const nodes = useTypedSelector(selectFilteredNodes);

    const [useNodesEndpoint] = useSetting(USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY);

    const fetchNodes = React.useCallback(
        (isBackground: boolean) => {
            if (!isBackground) {
                dispatch(setDataWasNotLoaded());
            }

            // If there is no path, it's cluster Nodes tab
            if (path && !useNodesEndpoint) {
                dispatch(getComputeNodes({path}));
            } else {
                dispatch(getNodes({path}));
            }
        },
        [dispatch, path, useNodesEndpoint],
    );

    useAutofetcher(fetchNodes, [fetchNodes], isClusterNodes ? true : autorefresh);

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
        dispatch(setNodesUptimeFilter(value));
    };

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
                <UptimeFilter value={nodesUptimeFilter} onChange={handleUptimeFilterChange} />
                <EntitiesCount
                    total={totalNodes}
                    current={nodes?.length || 0}
                    label={'Nodes'}
                    loading={loading && !wasLoaded}
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
                nodesUptimeFilter !== NodesUptimeFilterValues.All
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
        if (error.status === 403) {
            return <AccessDenied />;
        }
        return <ResponseError error={error} />;
    }

    return (
        <TableWithControlsLayout>
            <TableWithControlsLayout.Controls>{renderControls()}</TableWithControlsLayout.Controls>
            <TableWithControlsLayout.Table loading={loading && !wasLoaded} className={b('table')}>
                {renderTable()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
};
