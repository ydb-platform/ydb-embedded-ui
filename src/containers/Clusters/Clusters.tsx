import React from 'react';

import {Magnifier} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import {Flex, Icon, Select, Text} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';

import {AutoRefreshControl} from '../../components/AutoRefreshControl/AutoRefreshControl';
import {PageError} from '../../components/Errors/PageError/PageError';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Loader} from '../../components/Loader';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search';
import {TableColumnSetup} from '../../components/TableColumnSetup/TableColumnSetup';
import {
    useDeleteClusterFeatureAvailable,
    useEditClusterFeatureAvailable,
} from '../../store/reducers/capabilities/hooks';
import {changeClustersFilters, clustersApi} from '../../store/reducers/clusters/clusters';
import {
    filterClusters,
    selectClusterNameFilter,
    selectServiceFilter,
    selectStatusFilter,
    selectVersionFilter,
} from '../../store/reducers/clusters/selectors';
import {setHeaderBreadcrumbs} from '../../store/reducers/header/header';
import {uiFactory} from '../../uiFactory/uiFactory';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useSelectedColumns} from '../../utils/hooks/useSelectedColumns';
import {isAccessError} from '../../utils/response';
import {getMinorVersion} from '../../utils/versions';

import {CLUSTERS_COLUMNS_WIDTH_LS_KEY, getClustersColumns} from './columns';
import {
    CLUSTERS_SELECTED_COLUMNS_KEY,
    COLUMNS_NAMES,
    COLUMNS_TITLES,
    DEFAULT_COLUMNS,
} from './constants';
import i18n from './i18n';
import {b} from './shared';

import './Clusters.scss';

export function Clusters() {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const query = clustersApi.useGetClustersListQuery(undefined, {
        pollingInterval: autoRefreshInterval,
    });

    const dispatch = useTypedDispatch();

    React.useEffect(() => {
        dispatch(setHeaderBreadcrumbs('clusters', {}));
    }, [dispatch]);

    const isEditClusterAvailable =
        useEditClusterFeatureAvailable() && uiFactory.onEditCluster !== undefined;
    const isDeleteClusterAvailable =
        useDeleteClusterFeatureAvailable() && uiFactory.onDeleteCluster !== undefined;

    const clusterName = useTypedSelector(selectClusterNameFilter);
    const status = useTypedSelector(selectStatusFilter);
    const service = useTypedSelector(selectServiceFilter);
    const version = useTypedSelector(selectVersionFilter);

    const changeStatus = (value: string[]) => {
        dispatch(changeClustersFilters({status: value}));
    };
    const changeService = (value: string[]) => {
        dispatch(changeClustersFilters({service: value}));
    };
    const changeClusterName = (value: string) => {
        dispatch(changeClustersFilters({clusterName: value}));
    };
    const changeVersion = (value: string[]) => {
        dispatch(changeClustersFilters({version: value}));
    };

    const rawColumns = React.useMemo(() => {
        return getClustersColumns({isEditClusterAvailable, isDeleteClusterAvailable});
    }, [isDeleteClusterAvailable, isEditClusterAvailable]);

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        rawColumns,
        CLUSTERS_SELECTED_COLUMNS_KEY,
        COLUMNS_TITLES,
        DEFAULT_COLUMNS,
        [COLUMNS_NAMES.TITLE],
    );

    const clusters = query.data;

    const {servicesToSelect, versions} = React.useMemo(() => {
        const clustersServices = new Set<string>();
        const uniqVersions = new Set<string>();

        const clusterList = clusters ?? [];
        clusterList.forEach((cluster) => {
            if (cluster.service) {
                clustersServices.add(cluster.service);
            }
            cluster.cluster?.Versions?.forEach((v) => {
                uniqVersions.add(getMinorVersion(v));
            });
        });

        return {
            servicesToSelect: Array.from(clustersServices).map((value) => ({
                value,
                content: value,
            })),
            versions: Array.from(uniqVersions).map((value) => ({value, content: value})),
        };
    }, [clusters]);

    const filteredClusters = React.useMemo(() => {
        return filterClusters(clusters ?? [], {clusterName, status, service, version});
    }, [clusterName, clusters, service, status, version]);

    const statuses = React.useMemo(() => {
        return Array.from(
            new Set(
                (clusters ?? []).map((cluster) => cluster.status).filter(Boolean),
            ) as Set<string>,
        )
            .sort()
            .map((el) => ({value: el, content: el}));
    }, [clusters]);

    const renderPageTitle = () => {
        return (
            <Flex justifyContent="space-between" className={b('title-wrapper')}>
                <Text variant="header-1">{uiFactory.clustersPageTitle ?? i18n('page_title')}</Text>
                <AutoRefreshControl className={b('autorefresh')} />
            </Flex>
        );
    };

    const showBlockingError = isAccessError(query.error);

    const errorProps = showBlockingError ? uiFactory.clusterOrDatabaseAccessError : undefined;

    return (
        <PageError
            error={showBlockingError ? query.error : undefined}
            {...errorProps}
            errorPageTitle={uiFactory.clustersPageTitle ?? i18n('page_title')}
        >
            <div className={b()}>
                <Helmet>
                    <title>{i18n('page_title')}</title>
                </Helmet>

                {renderPageTitle()}

                <Flex className={b('controls-wrapper')}>
                    <div className={b('control', {wide: true})}>
                        <Search
                            placeholder={i18n('controls_search-placeholder')}
                            endContent={<Icon data={Magnifier} className={b('search-icon')} />}
                            onChange={changeClusterName}
                            value={clusterName}
                        />
                    </div>
                    <div className={b('control')}>
                        <Select
                            multiple
                            filterable
                            hasClear
                            placeholder={i18n('controls_select-placeholder')}
                            label={i18n('controls_status-select-label')}
                            value={status}
                            options={statuses}
                            onUpdate={changeStatus}
                            width="max"
                        />
                    </div>
                    <div className={b('control')}>
                        <Select
                            multiple
                            filterable
                            hasClear
                            placeholder={i18n('controls_select-placeholder')}
                            label={i18n('controls_service-select-label')}
                            value={service}
                            options={servicesToSelect}
                            onUpdate={changeService}
                            width="max"
                        />
                    </div>
                    <div className={b('control')}>
                        <Select
                            multiple
                            filterable
                            hasClear
                            placeholder={i18n('controls_select-placeholder')}
                            label={i18n('controls_version-select-label')}
                            value={version}
                            options={versions}
                            onUpdate={changeVersion}
                            width="max"
                        />
                    </div>
                    <TableColumnSetup
                        className={b('column-setup')}
                        key="TableColumnSetup"
                        popupWidth={242}
                        items={columnsToSelect}
                        showStatus
                        onUpdate={setColumns}
                        sortable={false}
                    />
                </Flex>
                {clusters?.length ? (
                    <Text color="secondary">
                        {i18n('clusters-count', {count: filteredClusters?.length})}
                    </Text>
                ) : null}
                {query.isError ? <ResponseError error={query.error} /> : null}
                {query.isLoading ? <Loader size="l" /> : null}
                {query.fulfilledTimeStamp ? (
                    <div className={b('table-wrapper')}>
                        <div className={b('table-content')}>
                            <ResizeableDataTable
                                columnsWidthLSKey={CLUSTERS_COLUMNS_WIDTH_LS_KEY}
                                wrapperClassName={b('table')}
                                data={filteredClusters}
                                columns={columnsToShow}
                                settings={{...DEFAULT_TABLE_SETTINGS, dynamicRender: false}}
                                initialSortOrder={{
                                    columnId: COLUMNS_NAMES.TITLE,
                                    order: DataTable.ASCENDING,
                                }}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </PageError>
    );
}
