import {useCallback, useEffect} from 'react';
import cn from 'bem-cn-lite';
import {useDispatch} from 'react-redux';

import DataTable from '@gravity-ui/react-data-table';

import type {EPathType} from '../../types/api/schema';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';

import {AccessDenied} from '../../components/Errors/403';
import {Illustration} from '../../components/Illustration';
import {Search} from '../../components/Search';
import {ProblemFilter} from '../../components/ProblemFilter';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {EntitiesCount} from '../../components/EntitiesCount';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {ResponseError} from '../../components/Errors/ResponseError';

import {DEFAULT_TABLE_SETTINGS, USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY} from '../../utils/constants';
import {useAutofetcher, useSetting, useTypedSelector} from '../../utils/hooks';
import {AdditionalNodesInfo, isUnavailableNode, NodesUptimeFilterValues} from '../../utils/nodes';

import {
    getNodes,
    getFilteredPreparedNodesList,
    setNodesUptimeFilter,
    setSearchValue,
    resetNodesState,
    getComputeNodes,
} from '../../store/reducers/nodes/nodes';
import {changeFilter, ProblemFilterValues} from '../../store/reducers/settings/settings';

import {isDatabaseEntityType} from '../Tenant/utils/schema';

import {getNodesColumns} from './getNodesColumns';

import './Nodes.scss';

import i18n from './i18n';

const b = cn('ydb-nodes');

interface NodesProps {
    path?: string;
    type?: EPathType;
    additionalNodesInfo?: AdditionalNodesInfo;
}

export const Nodes = ({path, type, additionalNodesInfo = {}}: NodesProps) => {
    const dispatch = useDispatch();

    const isClusterNodes = !path;

    // Since Nodes component is used in several places,
    // we need to reset filters, searchValue and loading state
    // in nodes reducer when path changes
    useEffect(() => {
        dispatch(resetNodesState());
    }, [dispatch, path]);

    const {wasLoaded, loading, error, nodesUptimeFilter, searchValue, totalNodes} =
        useTypedSelector((state) => state.nodes);
    const problemFilter = useTypedSelector((state) => state.settings.problemFilter);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const nodes = useTypedSelector(getFilteredPreparedNodesList);

    const [useNodesEndpoint] = useSetting(USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY);

    const fetchNodes = useCallback(() => {
        // For not DB entities we always use /compute endpoint instead of /nodes
        // since /nodes can return data only for tenants
        if (path && (!useNodesEndpoint || !isDatabaseEntityType(type))) {
            dispatch(getComputeNodes(path));
        } else {
            dispatch(getNodes({tenant: path}));
        }
    }, [dispatch, path, type, useNodesEndpoint]);

    useAutofetcher(fetchNodes, [fetchNodes], isClusterNodes ? true : autorefresh);

    const handleSearchQueryChange = (value: string) => {
        dispatch(setSearchValue(value));
    };

    const handleProblemFilterChange = (value: string) => {
        dispatch(changeFilter(value as ProblemFilterValue));
    };

    const handleUptimeFilterChange = (value: string) => {
        dispatch(setNodesUptimeFilter(value as NodesUptimeFilterValues));
    };

    const renderControls = () => {
        return (
            <>
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
            </>
        );
    };

    const renderTable = () => {
        const columns = getNodesColumns({
            getNodeRef: additionalNodesInfo.getNodeRef,
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
                initialSortOrder={{
                    columnId: 'NodeId',
                    order: DataTable.ASCENDING,
                }}
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
