import React from 'react';

import DataTable from '@gravity-ui/react-data-table';
import {Select, TableColumnSetup} from '@gravity-ui/uikit';
import {Helmet} from 'react-helmet-async';

import {Loader} from '../../components/Loader';
import {Search} from '../../components/Search';
import {changeClustersFilters, fetchClustersList} from '../../store/reducers/clusters/clusters';
import {
    selectClusterNameFilter,
    selectClustersAggregation,
    selectClustersList,
    selectFilteredClusters,
    selectLoadingFlag,
    selectServiceFilter,
    selectStatusFilter,
    selectVersionFilter,
    selectVersions,
} from '../../store/reducers/clusters/selectors';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutofetcher, useTypedDispatch, useTypedSelector} from '../../utils/hooks';

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
    const dispatch = useTypedDispatch();

    const loading = useTypedSelector(selectLoadingFlag);
    const clusters = useTypedSelector(selectClustersList);
    const filteredClusters = useTypedSelector(selectFilteredClusters);
    const aggregation = useTypedSelector(selectClustersAggregation);
    const clusterName = useTypedSelector(selectClusterNameFilter);
    const status = useTypedSelector(selectStatusFilter);
    const service = useTypedSelector(selectServiceFilter);
    const version = useTypedSelector(selectVersionFilter);
    const versions = useTypedSelector(selectVersions);

    const fetchData = React.useCallback(() => {
        dispatch(fetchClustersList());
    }, [dispatch]);

    useAutofetcher(fetchData, [fetchData], true);

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

    const servicesToSelect = React.useMemo(() => {
        const clustersServices = new Set<string>();

        clusters.forEach((cluster) => {
            if (cluster.service) {
                clustersServices.add(cluster.service);
            }
        });

        return Array.from(clustersServices).map((clusterService) => {
            return {
                value: clusterService,
                content: clusterService,
            };
        });
    }, [clusters]);

    if (loading && !clusters.length) {
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
                    <div>
                        <TableColumnSetup
                            key="TableColumnSetup"
                            popupWidth={242}
                            items={columnsToSelect}
                            showStatus
                            onUpdate={setColumns}
                        />
                    </div>
                </div>
            </div>
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
