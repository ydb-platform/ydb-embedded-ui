import React from 'react';

import {Magnifier} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import {Icon, Select} from '@gravity-ui/uikit';

import {ResponseError} from '../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search';
import {TableColumnSetup} from '../../components/TableColumnSetup/TableColumnSetup';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
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
import {uiFactory} from '../../uiFactory/uiFactory';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useSelectedColumns} from '../../utils/hooks/useSelectedColumns';
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

interface ClustersProps {
    scrollContainerRef: React.RefObject<HTMLElement>;
}

export function Clusters({scrollContainerRef}: ClustersProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const query = clustersApi.useGetClustersListQuery(undefined, {
        pollingInterval: autoRefreshInterval,
    });

    const dispatch = useTypedDispatch();

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

    const renderControls = () => {
        return (
            <React.Fragment>
                <Search
                    placeholder={i18n('controls_search-placeholder')}
                    endContent={<Icon data={Magnifier} className={b('search-icon')} />}
                    onChange={changeClusterName}
                    value={clusterName}
                    width={320}
                />
                <Select
                    multiple
                    filterable
                    hasClear
                    placeholder={i18n('controls_select-placeholder')}
                    label={i18n('controls_status-select-label')}
                    value={status}
                    options={statuses}
                    onUpdate={changeStatus}
                    width={200}
                />
                <Select
                    multiple
                    filterable
                    hasClear
                    placeholder={i18n('controls_select-placeholder')}
                    label={i18n('controls_service-select-label')}
                    value={service}
                    options={servicesToSelect}
                    onUpdate={changeService}
                    width={200}
                />
                <Select
                    multiple
                    filterable
                    hasClear
                    placeholder={i18n('controls_select-placeholder')}
                    label={i18n('controls_version-select-label')}
                    value={version}
                    options={versions}
                    onUpdate={changeVersion}
                    width={200}
                />
            </React.Fragment>
        );
    };

    const renderColumnSetup = () => {
        return (
            <TableColumnSetup
                className={b('column-setup')}
                key="TableColumnSetup"
                popupWidth={242}
                items={columnsToSelect}
                showStatus
                onUpdate={setColumns}
            />
        );
    };

    const renderContent = () => {
        return (
            <ResizeableDataTable
                isLoading={query.isLoading}
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
        );
    };

    return (
        <TableWithControlsLayout fullHeight className={b(null)}>
            <TableWithControlsLayout.Controls renderExtraControls={renderColumnSetup}>
                {renderControls()}
            </TableWithControlsLayout.Controls>
            {query.isError ? <ResponseError error={query.error} /> : null}
            <TableWithControlsLayout.Table
                scrollContainerRef={scrollContainerRef}
                className={b('table-wrapper')}
            >
                {renderContent()}
            </TableWithControlsLayout.Table>
        </TableWithControlsLayout>
    );
}
