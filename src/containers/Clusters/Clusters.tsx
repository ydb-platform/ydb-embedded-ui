import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {Select, TableColumnSetup} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';

import {ResponseError} from '../../components/Errors/ResponseError';
import {Loader} from '../../components/Loader';
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
import {DEFAULT_POLLING_INTERVAL, DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {getMinorVersion} from '../../utils/versions';

import {ClustersStatistics} from './ClustersStatistics';
import {CLUSTERS_COLUMNS} from './columns';
import {
    CLUSTER_STATUSES,
    COLUMNS_NAMES,
    COLUMNS_TITLES,
    DEFAULT_COLUMNS,
    SELECTED_COLUMNS_KEY,
} from './constants';
import i18n from './i18n';
import {b} from './shared';
import {useSelectedColumns} from './useSelectedColumns';

import './Clusters.scss';

export function Clusters() {
    const query = clustersApi.useGetClustersListQuery(undefined, {
        pollingInterval: DEFAULT_POLLING_INTERVAL,
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
        SELECTED_COLUMNS_KEY,
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

    if (query.isLoading) {
        return <Loader size="l" />;
    }

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
                        options={CLUSTER_STATUSES}
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
            </div>
            {query.isError ? <ResponseError error={query.error} className={b('error')} /> : null}
            <div className={b('table-wrapper')}>
                <div className={b('table-content')}>
                    <DataTable
                        theme="yandex-cloud"
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
        </div>
    );
}
