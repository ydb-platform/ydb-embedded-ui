import React from 'react';

import {CirclePlus} from '@gravity-ui/icons';
import type {Column, SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import type {LabelProps} from '@gravity-ui/uikit';
import {Button, Flex, Icon, Label} from '@gravity-ui/uikit';
import {useHistory} from 'react-router-dom';

import {EntitiesCount} from '../../components/EntitiesCount';
import {ResponseError} from '../../components/Errors/ResponseError';
import {PoolsGraph} from '../../components/PoolsGraph/PoolsGraph';
import {ProblemFilter} from '../../components/ProblemFilter/ProblemFilter';
import {keepSortPriority} from '../../components/ResizeableDataTable/keepSortPriority';
import {Search} from '../../components/Search';
import {TableColumnSetup} from '../../components/TableColumnSetup/TableColumnSetup';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {TenantNameWrapper} from '../../components/TenantNameWrapper/TenantNameWrapper';
import {getTenantLink} from '../../components/TenantNameWrapper/utils';
import {TitleWithHelpMark} from '../../components/TitleWithHelpmark/TitleWithHelpmark';
import {
    useBridgeModeEnabled,
    useEmMetaAvailable,
    useViewerTenantInfoHasBridgeFields,
} from '../../store/reducers/capabilities/hooks';
import {useClusterBaseInfo} from '../../store/reducers/cluster/cluster';
import {
    filterTenantsByDomain,
    filterTenantsByProblems,
    filterTenantsBySearch,
} from '../../store/reducers/tenants/filters';
import {tenantsApi} from '../../store/reducers/tenants/tenants';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import {State} from '../../types/api/tenant';
import {uiFactory} from '../../uiFactory/uiFactory';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {BRAND_BUTTON_CLASS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {
    formatCPU,
    formatNumber,
    formatStorageValuesToGb,
} from '../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval} from '../../utils/hooks';
import {useSelectedColumns} from '../../utils/hooks/useSelectedColumns';
import {getIllustration} from '../../utils/illustrations';
import {isNumeric, parseOptionalNonNegativeNumber} from '../../utils/utils';
import {TableGroup} from '../Storage/TableGroup/TableGroup';
import {useExpandedGroups} from '../Storage/TableGroup/useExpandedTableGroups';

import type {DatabaseStatusClickHandler} from './DatabaseDrawerHealthcheck';
import {DatabaseDrawerHealthcheck} from './DatabaseDrawerHealthcheck';
import {DatabaseRowsTable} from './DatabaseRowsTable';
import {resourceGroupTitle} from './ResourceGroupFilter';
import {getDatabaseBridgeColumns} from './bridgeColumns';
import {
    DATABASES_COLUMNS_IDS,
    DATABASES_COLUMNS_TITLES,
    DATABASES_DEFAULT_COLUMNS,
    DATABASES_REQUIRED_COLUMNS,
    DATABASES_TABLE_SETTINGS_KEYS,
    MY_DATABASES_DEFAULT_COLUMNS,
    MY_DATABASES_TABLE_SETTINGS_KEYS,
} from './constants';
import {renderOptionalNumber} from './formatters';
import i18n from './i18n';
import {
    getMyDatabasesColumns,
    groupResourceColumns,
    ungroupResourceColumns,
} from './resourceColumns';
import type {DatabaseRow} from './types';
import {isMyDatabase, useMyDatabasesView} from './useMyDatabasesView';
import {useTenantsQueryParams} from './useTenantsQueryParams';

import './Tenants.scss';

const b = cn('tenants');

function formatDatabaseState(state?: State): string {
    if (!state) {
        return EMPTY_DATA_PLACEHOLDER;
    }

    // Map specific state values to user-friendly display names
    switch (state) {
        case State.STATE_UNSPECIFIED:
            return 'Unspecified';
        case State.PENDING_RESOURCES:
            return 'Pending';
        default:
            // For other states, use capitalized version (first letter uppercase, rest lowercase)
            return state.charAt(0).toUpperCase() + state.slice(1).toLowerCase();
    }
}

function databaseStateToLabelTheme(state?: State): LabelProps['theme'] {
    switch (state) {
        case 'CREATING':
        case 'CONFIGURING': {
            return 'info';
        }
        case 'RUNNING': {
            return 'success';
        }
        case 'REMOVING': {
            return 'danger';
        }
        case 'PENDING_RESOURCES': {
            return 'warning';
        }
        case 'STATE_UNSPECIFIED':
        default: {
            return 'unknown';
        }
    }
}

interface TenantsTableProps {
    myDatabases?: boolean;
    clusterName?: string;
    environmentName?: string;

    isMetaDatabasesAvailable?: boolean;

    scrollContainerRef: React.RefObject<HTMLElement>;
    additionalTenantsProps?: AdditionalTenantsProps;

    showDomainDatabase?: boolean;
    showWithProblemsFilter?: boolean;
    showPoolsColumn?: boolean;
}

interface TenantsTableContentProps extends TenantsTableProps {
    onStatusClick: DatabaseStatusClickHandler;
}

const EMPTY_TENANTS: PreparedTenant[] = [];

function TenantsTableContent({
    myDatabases,
    clusterName,
    environmentName,
    isMetaDatabasesAvailable,
    showDomainDatabase,
    showWithProblemsFilter,
    scrollContainerRef,
    additionalTenantsProps,
    showPoolsColumn,
    onStatusClick,
}: TenantsTableContentProps) {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = tenantsApi.useGetTenantsInfoQuery(
        {clusterName, environmentName, isMetaDatabasesAvailable},
        {pollingInterval: autoRefreshInterval},
    );
    const {search, withProblems, handleSearchChange, handleWithProblemsChange} =
        useTenantsQueryParams();
    const {domain: domainRoot, settings, isResolved: isClusterInfoResolved} = useClusterBaseInfo();
    const useMetaProxySetting = settings?.use_meta_proxy;
    const useDatabaseIdSetting = settings?.use_database_id;

    // We should apply domain filter before other filters
    // It is done to ensure proper entities count
    // It should be 8/8 instead of 8/9 when no filters applied but show domain setting is off
    const tenants = React.useMemo(() => {
        const rawTenants = currentData ?? EMPTY_TENANTS;
        const pageTenants = myDatabases
            ? rawTenants.filter(isMyDatabase)
            : filterTenantsByDomain(rawTenants, showDomainDatabase);

        return pageTenants.map(
            (tenant): DatabaseRow => ({
                ...tenant,
                link: getTenantLink({
                    tenant,
                    additionalTenantsProps,
                    externalLink: Boolean(environmentName),
                    useDatabaseId: uiFactory.useDatabaseId,
                    isMetaDatabasesAvailable,
                    settings: {
                        use_meta_proxy: useMetaProxySetting,
                        use_database_id: useDatabaseIdSetting,
                    },
                }),
            }),
        );
    }, [
        currentData,
        myDatabases,
        showDomainDatabase,
        additionalTenantsProps,
        environmentName,
        isMetaDatabasesAvailable,
        useMetaProxySetting,
        useDatabaseIdSetting,
    ]);

    const filterRows = React.useCallback(
        (rows: DatabaseRow[]) => {
            const filteredByProblems = showWithProblemsFilter
                ? filterTenantsByProblems(rows, withProblems)
                : rows;

            return filterTenantsBySearch(filteredByProblems, search);
        },
        [withProblems, search, showWithProblemsFilter],
    );

    const myDatabasesView = useMyDatabasesView({
        enabled: Boolean(myDatabases),
        tenants,
        filterRows,
        environmentName,
    });
    const {rows: filteredTenants, groups, withAllocatedResources} = myDatabasesView;

    const hasData = currentData !== undefined;
    const SuccessImage = getIllustration('SuccessOperation');
    const history = useHistory();
    const [sortParams, setSortParams] = React.useState<SortOrder | SortOrder[] | undefined>();
    const isCreateDBAvailable = useEmMetaAvailable() && uiFactory.onCreateDB !== undefined;
    const bridgeModeEnabled = useBridgeModeEnabled();
    const tenantInfoHasBridgeFields = useViewerTenantInfoHasBridgeFields();
    const bridgeColumnsAvailable = bridgeModeEnabled && tenantInfoHasBridgeFields;
    const loading = (isFetching && !hasData) || !isClusterInfoResolved;

    const openTenant = React.useCallback(
        ({link}: DatabaseRow) => {
            if (!isClusterInfoResolved || !link) {
                return;
            }
            if (link.isExternalLink) {
                window.open(link.href, '_blank', 'noopener,noreferrer');
                return;
            }

            history.push(link.href);
        },
        [history, isClusterInfoResolved],
    );

    const renderCreateDBButton = () => {
        const buttonAvailable = isCreateDBAvailable && clusterName;

        if (buttonAvailable && !loading) {
            return (
                <Button
                    view="action"
                    className={BRAND_BUTTON_CLASS}
                    onClick={() => uiFactory.onCreateDB?.({clusterName, domainRoot})}
                >
                    <Icon data={CirclePlus} />
                    {i18n('create-database')}
                </Button>
            );
        }

        return null;
    };

    const renderControls = () => {
        return (
            <React.Fragment>
                <Search
                    tableFilter
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={i18n('controls_search-placeholder')}
                    className={b('search')}
                />
                {showWithProblemsFilter ? (
                    <ProblemFilter value={withProblems} onChange={handleWithProblemsChange} />
                ) : null}
                {myDatabasesView.controls}
                <EntitiesCount
                    total={tenants?.length}
                    current={filteredTenants?.length || 0}
                    label={i18n('field_databases')}
                    loading={loading}
                />
            </React.Fragment>
        );
    };

    const tableColumns = React.useMemo(() => {
        const columns: Column<DatabaseRow>[] = [
            {
                name: DATABASES_COLUMNS_IDS.Name,
                header: DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.Name],
                render: ({row}) => (
                    <TenantNameWrapper
                        tenant={row}
                        clusterName={clusterName}
                        additionalTenantsProps={additionalTenantsProps}
                        externalLink={Boolean(environmentName)}
                        link={row.link}
                        onStatusClick={onStatusClick}
                    />
                ),
                width: 440,
                resizeMinWidth: 200,
                sortable: true,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: DATABASES_COLUMNS_IDS.Type,
                header: DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.Type],
                width: 200,
                resizeMinWidth: 150,
                render: ({row}) => {
                    if (row.Type !== 'Serverless') {
                        return row.Type;
                    }

                    return (
                        <div className={b('type')}>
                            <span className={b('type-value')}>{row.Type}</span>
                            <Button
                                className={b('type-button')}
                                onClick={() => handleSearchChange(row.sharedTenantName || '')}
                            >
                                Show shared
                            </Button>
                        </div>
                    );
                },
            },
            {
                name: DATABASES_COLUMNS_IDS.State,
                header: DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.State],
                width: 150,
                render: ({row}) => {
                    const state = formatDatabaseState(row.State);
                    return (
                        <Label
                            theme={databaseStateToLabelTheme(row.State)}
                            width="auto"
                            title={state}
                        >
                            {state}
                        </Label>
                    );
                },
            },
            ...(bridgeColumnsAvailable ? getDatabaseBridgeColumns() : []),
            {
                name: DATABASES_COLUMNS_IDS.CPU,
                header: (
                    <TitleWithHelpMark
                        header={DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.CPU]}
                        note={i18n('description_cpu-used')}
                    />
                ),
                width: 140,
                sortAccessor: (row) => parseOptionalNonNegativeNumber(row.CoresUsed),
                render: ({row}) =>
                    renderOptionalNumber(row.CoresUsed, (cores) => formatCPU(cores * 1_000_000)),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: DATABASES_COLUMNS_IDS.Memory,
                header: (
                    <TitleWithHelpMark
                        header={DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.Memory]}
                        note={i18n('description_memory-used')}
                    />
                ),
                width: 165,
                sortAccessor: (row) => parseOptionalNonNegativeNumber(row.MemoryUsed),
                render: ({row}) =>
                    renderOptionalNumber(row.MemoryUsed, (used) => formatStorageValuesToGb(used)),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: DATABASES_COLUMNS_IDS.Storage,
                header: (
                    <TitleWithHelpMark
                        header={DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.Storage]}
                        note={i18n('description_storage-used')}
                    />
                ),
                width: 135,
                sortAccessor: (row) => parseOptionalNonNegativeNumber(row.StorageAllocatedSize),
                render: ({row}) =>
                    renderOptionalNumber(row.StorageAllocatedSize, (value) =>
                        formatStorageValuesToGb(value),
                    ),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
        ];

        columns.push({
            name: DATABASES_COLUMNS_IDS.Network,
            header: DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.Network],
            width: 120,
            align: DataTable.RIGHT,
            defaultOrder: DataTable.DESCENDING,
            sortAccessor: ({NetworkWriteThroughput = 0}) => Number(NetworkWriteThroughput),
            render: ({row}) => {
                const {NetworkWriteThroughput} = row;

                if (!isNumeric(NetworkWriteThroughput)) {
                    return EMPTY_DATA_PLACEHOLDER;
                }

                return formatBytes({
                    value: NetworkWriteThroughput,
                    size: 'mb',
                    withSpeedLabel: true,
                    precision: 2,
                });
            },
        });

        columns.push(
            {
                name: DATABASES_COLUMNS_IDS.NodesCount,
                header: DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.NodesCount],
                width: 100,
                sortAccessor: (row) => row.NodeIds?.length,
                render: ({row}) => renderOptionalNumber(row.NodeIds?.length, formatNumber),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: DATABASES_COLUMNS_IDS.GroupsCount,
                header: DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.GroupsCount],
                width: 100,
                sortAccessor: (row) => parseOptionalNonNegativeNumber(row.StorageGroups),
                render: ({row}) => renderOptionalNumber(row.StorageGroups, formatNumber),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
        );

        if (showPoolsColumn) {
            columns.push({
                name: DATABASES_COLUMNS_IDS.PoolStats,
                header: DATABASES_COLUMNS_TITLES[DATABASES_COLUMNS_IDS.PoolStats],
                width: 100,
                resizeMinWidth: 60,
                sortAccessor: ({PoolStats = []}) =>
                    PoolStats.reduce((acc, item) => acc + (item.Usage || 0), 0),
                defaultOrder: DataTable.DESCENDING,
                align: DataTable.LEFT,
                render: ({row}) => <PoolsGraph pools={row.PoolStats} />,
            });
        }

        return myDatabases ? getMyDatabasesColumns(columns, {withAllocatedResources}) : columns;
    }, [
        myDatabases,
        withAllocatedResources,
        bridgeColumnsAvailable,
        clusterName,
        additionalTenantsProps,
        environmentName,
        handleSearchChange,
        onStatusClick,
        showPoolsColumn,
    ]);

    const tableKeys = myDatabases
        ? MY_DATABASES_TABLE_SETTINGS_KEYS
        : DATABASES_TABLE_SETTINGS_KEYS;
    const {columnsToShow, columnsToSelect, setColumns} = useSelectedColumns(
        tableColumns,
        tableKeys.columns,
        DATABASES_COLUMNS_TITLES,
        myDatabases ? MY_DATABASES_DEFAULT_COLUMNS : DATABASES_DEFAULT_COLUMNS,
        DATABASES_REQUIRED_COLUMNS,
    );

    const layout = React.useMemo(
        () =>
            myDatabases
                ? groupResourceColumns(columnsToSelect)
                : {columns: columnsToShow, items: columnsToSelect},
        [myDatabases, columnsToShow, columnsToSelect],
    );

    const handleSortChange = React.useCallback(
        (order: SortOrder | SortOrder[] | undefined) =>
            setSortParams((previous) => keepSortPriority(previous, order)),
        [],
    );

    const {expandedGroups, setIsGroupExpanded} = useExpandedGroups(groups);

    const renderRows = (rows: DatabaseRow[]) => {
        return (
            <div>
                <DatabaseRowsTable
                    onKeyboardActivate={openTenant}
                    getKeyboardRowKey={(tenant) =>
                        JSON.stringify([tenant.Cluster, tenant.Id ?? tenant.Name])
                    }
                    getKeyboardRowLabel={(tenant) =>
                        tenant.controlPlaneName ||
                        tenant.Name ||
                        tenant.Id ||
                        EMPTY_DATA_PLACEHOLDER
                    }
                    columnsWidthLSKey={tableKeys.widths}
                    data={rows}
                    columns={layout.columns}
                    emptyDataMessage={i18n('no-databases')}
                    sortOrder={sortParams}
                    onSortChange={handleSortChange}
                />
            </div>
        );
    };

    const renderTable = () => {
        if (!filteredTenants.length && withProblems) {
            return <SuccessImage width={200} height={200} />;
        }
        if (groups) {
            if (!groups.length) {
                return renderRows([]);
            }
            return groups.map((group) => (
                <TableGroup
                    key={group.name}
                    name={group.name}
                    title={resourceGroupTitle(group)}
                    count={group.rows.length}
                    entityName={i18n('field_databases')}
                    expanded={Boolean(expandedGroups[group.name])}
                    onIsExpandedChange={setIsGroupExpanded}
                >
                    {renderRows(group.rows)}
                </TableGroup>
            ));
        }
        return renderRows(filteredTenants);
    };

    const renderColumnSetup = () => {
        return (
            <TableColumnSetup
                popupWidth={200}
                items={layout.items}
                showStatus
                onUpdate={(updated) =>
                    setColumns(
                        myDatabases ? ungroupResourceColumns(updated, columnsToSelect) : updated,
                    )
                }
            />
        );
    };

    const renderExtraControls = () => {
        return (
            <Flex direction="row" gap={3}>
                {renderCreateDBButton()}
                {renderColumnSetup()}
            </Flex>
        );
    };

    return (
        <div className={b('table-wrapper')}>
            <TableWithControlsLayout
                fullHeight
                keyboardNavigationResetKey={JSON.stringify([
                    withProblems,
                    showDomainDatabase,
                    showWithProblemsFilter,
                    ...myDatabasesView.filters,
                ])}
            >
                <TableWithControlsLayout.Controls renderExtraControls={renderExtraControls}>
                    {renderControls()}
                </TableWithControlsLayout.Controls>
                {error ? <ResponseError error={error} /> : null}
                <TableWithControlsLayout.Table
                    scrollContainerRef={scrollContainerRef}
                    loading={loading}
                    scrollDependencies={[
                        search,
                        withProblems,
                        sortParams,
                        ...myDatabasesView.filters,
                    ]}
                >
                    <div>{hasData ? renderTable() : null}</div>
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </div>
    );
}

export function TenantsTable(props: TenantsTableProps) {
    return (
        <DatabaseDrawerHealthcheck
            key={`${props.clusterName ?? ''}:${props.environmentName ?? ''}`}
            clusterName={props.clusterName}
        >
            {(onStatusClick) => <TenantsTableContent {...props} onStatusClick={onStatusClick} />}
        </DatabaseDrawerHealthcheck>
    );
}
