import React from 'react';

import {Magnifier} from '@gravity-ui/icons';
import DataTable from '@gravity-ui/react-data-table';
import {Icon, Select, Text} from '@gravity-ui/uikit';

import {ResponseError} from '../../components/Errors/ResponseError';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search';
import {TableColumnSetup} from '../../components/TableColumnSetup/TableColumnSetup';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {useEmMetaAvailable} from '../../store/reducers/capabilities/hooks';
import {changeClustersFilters, clustersApi} from '../../store/reducers/clusters/clusters';
import {
    filterClusters,
    selectClusterNameFilter,
    selectGalaxyFilter,
    selectServiceFilter,
    selectStatusFilter,
    selectVersionFilter,
} from '../../store/reducers/clusters/selectors';
import {uiFactory} from '../../uiFactory/uiFactory';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useSelectedColumns} from '../../utils/hooks/useSelectedColumns';
import {getMinorVersion} from '../../utils/versions';

import {ClusterDrawerHealthcheck} from './ClusterDrawerHealthcheck';
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

    const emMetaAvailable = useEmMetaAvailable();
    const isEditClusterAvailable = emMetaAvailable && uiFactory.onEditCluster !== undefined;
    const isDeleteClusterAvailable = emMetaAvailable && uiFactory.onDeleteCluster !== undefined;

    const clusterName = useTypedSelector(selectClusterNameFilter);
    const status = useTypedSelector(selectStatusFilter);
    const service = useTypedSelector(selectServiceFilter);
    const version = useTypedSelector(selectVersionFilter);
    const galaxy = useTypedSelector(selectGalaxyFilter);

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
    const changeGalaxy = (value: string[]) => {
        dispatch(changeClustersFilters({galaxy: value}));
    };

    const [healthcheckClusterName, setHealthcheckClusterName] = React.useState<string | undefined>(
        undefined,
    );
    const handleStatusClick = React.useCallback((row: {name?: string}) => {
        if (row.name) {
            setHealthcheckClusterName(row.name);
        }
    }, []);
    const handleDrawerClose = React.useCallback(() => {
        setHealthcheckClusterName(undefined);
    }, []);

    const rawColumns = React.useMemo(() => {
        return getClustersColumns({
            isEditClusterAvailable,
            isDeleteClusterAvailable,
            onStatusClick: handleStatusClick,
        });
    }, [isDeleteClusterAvailable, isEditClusterAvailable, handleStatusClick]);

    const clusters = query.data;

    // Check which columns have data across all clusters
    const {hasAnyStatus, hasAnyService, hasAnyGalaxy} = React.useMemo(() => {
        if (!clusters || clusters.length === 0) {
            return {hasAnyStatus: true, hasAnyService: true, hasAnyGalaxy: true};
        }

        return {
            hasAnyStatus: clusters.some((cluster) => cluster.status),
            hasAnyService: clusters.some((cluster) => cluster.service),
            hasAnyGalaxy: clusters.some((cluster) => cluster.galaxy),
        };
    }, [clusters]);

    // Filter columns: remove empty columns unless user has explicitly selected them
    // We need to do this before calling useSelectedColumns to avoid showing empty columns in the selector
    const filteredColumns = React.useMemo(() => {
        return rawColumns.filter((column) => {
            // Check if this is one of the columns we want to hide when empty
            const isEmptyCheckColumn =
                column.name === COLUMNS_NAMES.STATUS ||
                column.name === COLUMNS_NAMES.SERVICE ||
                column.name === COLUMNS_NAMES.GALAXY;

            if (!isEmptyCheckColumn) {
                // Not a column we're checking, always include
                return true;
            }

            // Hide empty columns (will be overridden by useSelectedColumns if user selected them)
            if (column.name === COLUMNS_NAMES.STATUS && !hasAnyStatus) {
                return false;
            }
            if (column.name === COLUMNS_NAMES.SERVICE && !hasAnyService) {
                return false;
            }
            if (column.name === COLUMNS_NAMES.GALAXY && !hasAnyGalaxy) {
                return false;
            }

            return true;
        });
    }, [rawColumns, hasAnyStatus, hasAnyService, hasAnyGalaxy]);

    // Adjust default columns to match filtered columns
    const adjustedDefaultColumns = React.useMemo(() => {
        const filteredColumnNames = new Set(filteredColumns.map((col) => col.name));
        return DEFAULT_COLUMNS.filter((columnName) => filteredColumnNames.has(columnName));
    }, [filteredColumns]);

    const {columnsToShow, columnsToSelect, setColumns, selectedColumnIds} = useSelectedColumns(
        filteredColumns,
        CLUSTERS_SELECTED_COLUMNS_KEY,
        COLUMNS_TITLES,
        adjustedDefaultColumns,
        [COLUMNS_NAMES.TITLE],
    );

    // Re-add explicitly selected empty columns that were filtered out
    const finalColumnsToShow = React.useMemo(() => {
        const columnsToAdd: typeof rawColumns = [];

        // Check if user explicitly selected any of the empty columns
        if (selectedColumnIds.has(COLUMNS_NAMES.STATUS) && !hasAnyStatus) {
            const statusColumn = rawColumns.find((col) => col.name === COLUMNS_NAMES.STATUS);
            if (statusColumn && !columnsToShow.includes(statusColumn)) {
                columnsToAdd.push(statusColumn);
            }
        }
        if (selectedColumnIds.has(COLUMNS_NAMES.SERVICE) && !hasAnyService) {
            const serviceColumn = rawColumns.find((col) => col.name === COLUMNS_NAMES.SERVICE);
            if (serviceColumn && !columnsToShow.includes(serviceColumn)) {
                columnsToAdd.push(serviceColumn);
            }
        }
        if (selectedColumnIds.has(COLUMNS_NAMES.GALAXY) && !hasAnyGalaxy) {
            const galaxyColumn = rawColumns.find((col) => col.name === COLUMNS_NAMES.GALAXY);
            if (galaxyColumn && !columnsToShow.includes(galaxyColumn)) {
                columnsToAdd.push(galaxyColumn);
            }
        }

        return columnsToAdd.length > 0 ? [...columnsToShow, ...columnsToAdd] : columnsToShow;
    }, [columnsToShow, rawColumns, selectedColumnIds, hasAnyStatus, hasAnyService, hasAnyGalaxy]);

    const {servicesToSelect, versions, galaxiesToSelect} = React.useMemo(() => {
        const clustersServices = new Set<string>();
        const uniqVersions = new Set<string>();
        const clustersGalaxies = new Set<string>();

        const clusterList = clusters ?? [];
        clusterList.forEach((cluster) => {
            if (cluster.service) {
                clustersServices.add(cluster.service);
            }
            if (cluster.galaxy) {
                clustersGalaxies.add(cluster.galaxy);
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
            galaxiesToSelect: Array.from(clustersGalaxies).map((value) => ({
                value,
                content: value,
            })),
        };
    }, [clusters]);

    const filteredClusters = React.useMemo(() => {
        return filterClusters(clusters ?? [], {clusterName, status, service, version, galaxy});
    }, [clusterName, clusters, service, status, version, galaxy]);

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
                {galaxiesToSelect.length > 0 || galaxy.length > 0 ? (
                    <Select
                        multiple
                        filterable
                        hasClear
                        placeholder={i18n('controls_select-placeholder')}
                        label={i18n('controls_galaxy-select-label')}
                        value={galaxy}
                        options={galaxiesToSelect}
                        onUpdate={changeGalaxy}
                        width={200}
                    />
                ) : null}
                {statuses.length > 0 || status.length > 0 ? (
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
                ) : null}
                {servicesToSelect.length > 0 || service.length > 0 ? (
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
                ) : null}
                {versions.length > 0 || version.length > 0 ? (
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
                ) : null}
            </React.Fragment>
        );
    };

    const renderColumnSetup = () => {
        return (
            <TableColumnSetup
                popupWidth={242}
                items={columnsToSelect}
                showStatus
                onUpdate={setColumns}
            />
        );
    };

    const renderClustersCount = () => {
        if (query.isLoading) {
            return null;
        }
        return (
            <Text variant="body-1" color="hint" className={b('clusters-count')}>
                {i18n('clusters-count', {count: filteredClusters.length})}
            </Text>
        );
    };

    const renderContent = () => {
        return (
            <ResizeableDataTable
                isLoading={query.isLoading}
                columnsWidthLSKey={CLUSTERS_COLUMNS_WIDTH_LS_KEY}
                wrapperClassName={b('table')}
                data={filteredClusters}
                columns={finalColumnsToShow}
                settings={{...DEFAULT_TABLE_SETTINGS, dynamicRender: false}}
                initialSortOrder={{
                    columnId: COLUMNS_NAMES.TITLE,
                    order: DataTable.ASCENDING,
                }}
            />
        );
    };

    return (
        <ClusterDrawerHealthcheck
            clusterName={healthcheckClusterName}
            isVisible={Boolean(healthcheckClusterName)}
            onClose={handleDrawerClose}
        >
            <TableWithControlsLayout fullHeight className={b(null)}>
                <TableWithControlsLayout.Controls
                    className={b('controls')}
                    renderExtraControls={renderColumnSetup}
                >
                    {renderControls()}
                </TableWithControlsLayout.Controls>
                {query.isError ? <ResponseError error={query.error} /> : null}
                {renderClustersCount()}
                <TableWithControlsLayout.Table
                    scrollContainerRef={scrollContainerRef}
                    className={b('table-wrapper')}
                >
                    {renderContent()}
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </ClusterDrawerHealthcheck>
    );
}
