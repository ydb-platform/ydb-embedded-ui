import {useCallback, useEffect} from 'react';
import cn from 'bem-cn-lite';
import {useDispatch} from 'react-redux';

import DataTable from '@gravity-ui/react-data-table';

import {AccessDenied} from '../../components/Errors/403';
import {Illustration} from '../../components/Illustration';
import {Loader} from '../../components/Loader';

import {Search} from '../../components/Search';
import {ProblemFilter} from '../../components/ProblemFilter';
import {UptimeFilter} from '../../components/UptimeFIlter';
import {EntitiesCount} from '../../components/EntitiesCount';

import routes, {CLUSTER_PAGES, createHref} from '../../routes';

import {
    ALL,
    DEFAULT_TABLE_SETTINGS,
    USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY,
} from '../../utils/constants';
import {useAutofetcher, useTypedSelector} from '../../utils/hooks';
import {isUnavailableNode, NodesUptimeFilterValues} from '../../utils/nodes';

import {setHeader} from '../../store/reducers/header';
import {
    getNodes,
    getFilteredPreparedNodesList,
    setNodesUptimeFilter,
    setSearchValue,
    resetNodesState,
    getComputeNodes,
} from '../../store/reducers/nodes';
import {changeFilter, getSettingValue} from '../../store/reducers/settings';
import {hideTooltip, showTooltip} from '../../store/reducers/tooltip';

import {getNodesColumns} from './getNodesColumns';

import './Nodes.scss';

import i18n from './i18n';

const b = cn('ydb-nodes');

interface IAdditionalNodesInfo extends Record<string, unknown> {
    getNodeRef?: Function;
}

interface NodesProps {
    tenantPath?: string;
    className?: string;
    additionalNodesInfo?: IAdditionalNodesInfo;
}

export const Nodes = ({tenantPath, className, additionalNodesInfo = {}}: NodesProps) => {
    const dispatch = useDispatch();

    const isClusterNodes = !tenantPath;

    // Since Nodes component is used in several places,
    // we need to reset filters, searchValue and loading state
    // in nodes reducer when path changes
    useEffect(() => {
        dispatch(resetNodesState());
    }, [dispatch, tenantPath]);

    const {wasLoaded, loading, error, nodesUptimeFilter, searchValue, totalNodes} =
        useTypedSelector((state) => state.nodes);
    const problemFilter = useTypedSelector((state) => state.settings.problemFilter);
    const {autorefresh} = useTypedSelector((state) => state.schema);

    const nodes = useTypedSelector(getFilteredPreparedNodesList);

    const useNodesEndpoint = useTypedSelector((state) =>
        getSettingValue(state, USE_NODES_ENDPOINT_IN_DIAGNOSTICS_KEY),
    );

    const fetchNodes = useCallback(() => {
        if (tenantPath && !JSON.parse(useNodesEndpoint)) {
            dispatch(getComputeNodes(tenantPath));
        } else {
            dispatch(getNodes({tenant: tenantPath}));
        }
    }, [dispatch, tenantPath, useNodesEndpoint]);

    useAutofetcher(fetchNodes, [fetchNodes], isClusterNodes ? true : autorefresh);

    useEffect(() => {
        if (isClusterNodes) {
            dispatch(
                setHeader([
                    {
                        text: CLUSTER_PAGES.nodes.title,
                        link: createHref(routes.cluster, {activeTab: CLUSTER_PAGES.nodes.id}),
                    },
                ]),
            );
        }
    }, [dispatch, isClusterNodes]);

    const handleSearchQueryChange = (value: string) => {
        dispatch(setSearchValue(value));
    };

    const handleProblemFilterChange = (value: string) => {
        dispatch(changeFilter(value));
    };

    const handleUptimeFilterChange = (value: string) => {
        dispatch(setNodesUptimeFilter(value as NodesUptimeFilterValues));
    };

    const renderControls = () => {
        return (
            <div className={b('controls')}>
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
            </div>
        );
    };

    const onShowTooltip = (...args: Parameters<typeof showTooltip>) => {
        dispatch(showTooltip(...args));
    };

    const onHideTooltip = () => {
        dispatch(hideTooltip());
    };

    const renderTable = () => {
        const columns = getNodesColumns({
            showTooltip: onShowTooltip,
            hideTooltip: onHideTooltip,
            getNodeRef: additionalNodesInfo.getNodeRef,
        });

        if (nodes && nodes.length === 0) {
            if (problemFilter !== ALL || nodesUptimeFilter !== NodesUptimeFilterValues.All) {
                return <Illustration name="thumbsUp" width="200" />;
            }
        }

        return (
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>
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
                </div>
            </div>
        );
    };

    const renderContent = () => {
        return (
            <div className={b(null, className)}>
                {renderControls()}
                {renderTable()}
            </div>
        );
    };

    if (loading && !wasLoaded) {
        return <Loader size={isClusterNodes ? 'l' : 'm'} />;
    }

    if (error) {
        if (error.status === 403) {
            return <AccessDenied />;
        }
        return <div>{error.statusText}</div>;
    }

    return renderContent();
};
