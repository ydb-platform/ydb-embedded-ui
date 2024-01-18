import {useCallback, useMemo} from 'react';
import {useDispatch} from 'react-redux';

import DataTable from '@gravity-ui/react-data-table';

import {TableColumnSetup, Select} from '@gravity-ui/uikit';

import {Search} from '../../components/Search';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutofetcher} from '../../utils/hooks';

import {useTypedSelector} from '../../utils/hooks/useTypedSelector';

import {fetchClustersList, changeClustersFilters} from '../../store/reducers/clusters/clusters';
import {
    selectClustersList,
    selectLoadingFlag,
    selectClusterNameFilter,
    selectStatusFilter,
    selectServiceFilter,
    selectVersionFilter,
    selectVersions,
    selectFilteredClusters,
    selectClustersAggregation,
} from '../../store/reducers/clusters/selectors';

import {
    COLUMNS_NAMES,
    COLUMNS_TITLES,
    CLUSTER_STATUSES,
    DEFAULT_COLUMNS,
    SELECTED_COLUMNS_KEY,
} from './constants';
import {ClustersStatistics} from './ClustersStatistics';
import {CLUSTERS_COLUMNS} from './columns';
import {useSelectedColumns} from './useSelectedColumns';
import {b} from './shared';

import './Clusters.scss';
import {Loader} from '../../components/Loader';
import i18n from './i18n';

export function Clusters() {
    const dispatch = useDispatch();

    const loading = useTypedSelector(selectLoadingFlag);
    const clusters = useTypedSelector(selectClustersList);
    const filteredClusters = useTypedSelector(selectFilteredClusters);
    const aggregation = useTypedSelector(selectClustersAggregation);
    const clusterName = useTypedSelector(selectClusterNameFilter);
    const status = useTypedSelector(selectStatusFilter);
    const service = useTypedSelector(selectServiceFilter);
    const version = useTypedSelector(selectVersionFilter);
    const versions = useTypedSelector(selectVersions);

    const fetchData = useCallback(() => {
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

    const servicesToSelect = useMemo(() => {
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
                            popupWidth="242px"
                            items={columnsToSelect}
                            showStatus
                            onUpdate={setColumns}
                            className={b('table-settings')}
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
