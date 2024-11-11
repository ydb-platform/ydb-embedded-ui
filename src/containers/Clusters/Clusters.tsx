import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {Select, TableColumnSetup} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';

import {AutoRefreshControl} from '../../components/AutoRefreshControl/AutoRefreshControl';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Loader} from '../../components/Loader';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search';
import {changeClustersFilters, clustersApi} from '../../store/reducers/clusters/clusters';
import {
    aggregateClustersInfo,
    filterClusters,
    selectClusterNameFilter,
    selectServiceFilter,
    selectStatusFilter,
    selectVersionFilter,
} from '../../store/reducers/clusters/selectors';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useSelectedColumns} from '../../utils/hooks/useSelectedColumns';
import {getMinorVersion} from '../../utils/versions';

import {ClustersStatistics} from './ClustersStatistics';
import {CLUSTERS_COLUMNS, CLUSTERS_COLUMNS_WIDTH_LS_KEY} from './columns';
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

    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        CLUSTERS_COLUMNS,
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

    const aggregation = React.useMemo(
        () => aggregateClustersInfo(filteredClusters),
        [filteredClusters],
    );

    const statuses = React.useMemo(() => {
        return Array.from(
            new Set(
                (clusters ?? []).map((cluster) => cluster.status).filter(Boolean),
            ) as Set<string>,
        )
            .sort()
            .map((el) => ({value: el, content: el}));
    }, [clusters]);

    return (
        <div className={b()}>
            <Helmet>
                <title>{i18n('page_title')}</title>
            </Helmet>

            <ClustersStatistics stats={aggregation} count={filteredClusters.length} />
            <div className={b('controls')}>
                <div className={b('control', {wide: true})}>
                    <Search
                        placeholder={i18n('controls_search-placeholder')}
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
                <div className={b('control')}>
                    <TableColumnSetup
                        key="TableColumnSetup"
                        popupWidth={242}
                        items={columnsToSelect}
                        showStatus
                        onUpdate={setColumns}
                        sortable={false}
                    />
                </div>
                <AutoRefreshControl className={b('autorefresh')} />
            </div>
            {query.isError ? <ResponseError error={query.error} className={b('error')} /> : null}
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
    );
}
