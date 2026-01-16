import React from 'react';

import {CirclePlus} from '@gravity-ui/icons';
import type {Column, SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import type {LabelProps} from '@gravity-ui/uikit';
import {Button, Icon, Label} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../components/EntitiesCount';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {PoolsGraph} from '../../components/PoolsGraph/PoolsGraph';
import {ProblemFilter} from '../../components/ProblemFilter/ProblemFilter';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {TenantNameWrapper} from '../../components/TenantNameWrapper/TenantNameWrapper';
import {useCreateDatabaseFeatureAvailable} from '../../store/reducers/capabilities/hooks';
import {SETTING_KEYS} from '../../store/reducers/settings/constants';
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
import {DEFAULT_TABLE_SETTINGS, EMPTY_DATA_PLACEHOLDER} from '../../utils/constants';
import {
    formatCPU,
    formatNumber,
    formatStorageValuesToGb,
} from '../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval, useSetting} from '../../utils/hooks';
import {isNumeric} from '../../utils/utils';

import i18n from './i18n';
import {useTenantsQueryParams} from './useTenantsQueryParams';

import './Tenants.scss';

const b = cn('tenants');

const DATABASES_COLUMNS_WIDTH_LS_KEY = 'databasesTableColumnsWidth';

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
    clusterName?: string;
    environmentName?: string;

    isMetaDatabasesAvailable?: boolean;

    scrollContainerRef: React.RefObject<HTMLElement>;
    additionalTenantsProps?: AdditionalTenantsProps;

    showDomainDatabase?: boolean;
    showWithProblemsFilter?: boolean;
    showPoolsColumn?: boolean;
}

export const TenantsTable = ({
    clusterName,
    environmentName,
    isMetaDatabasesAvailable,
    scrollContainerRef,
    additionalTenantsProps,
    showDomainDatabase,
    showWithProblemsFilter,
    showPoolsColumn,
}: TenantsTableProps) => {
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = tenantsApi.useGetTenantsInfoQuery(
        {clusterName, environmentName, isMetaDatabasesAvailable},
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;

    // Track sort state for scroll dependencies
    const [sortParams, setSortParams] = React.useState<SortOrder | SortOrder[] | undefined>();

    const isCreateDBAvailable =
        useCreateDatabaseFeatureAvailable() && uiFactory.onCreateDB !== undefined;

    const {search, withProblems, handleSearchChange, handleWithProblemsChange} =
        useTenantsQueryParams();

    const [showNetworkUtilization] = useSetting<boolean>(SETTING_KEYS.SHOW_NETWORK_UTILIZATION);

    // We should apply domain filter before other filters
    // It is done to ensure proper entities count
    // It should be 8/8 instead of 8/9 when no filters applied but show domain setting is off
    const tenants = React.useMemo(() => {
        const rawTenants = currentData ?? [];

        return filterTenantsByDomain(rawTenants, showDomainDatabase);
    }, [currentData, showDomainDatabase]);

    const filteredTenants = React.useMemo(() => {
        let filteredByProblems = tenants;
        if (showWithProblemsFilter) {
            filteredByProblems = filterTenantsByProblems(tenants, withProblems);
        }

        const filteredBySearch = filterTenantsBySearch(filteredByProblems, search);

        return filteredBySearch;
    }, [tenants, withProblems, search]);

    const renderCreateDBButton = () => {
        const buttonAvailable = isCreateDBAvailable && clusterName;

        if (buttonAvailable && !loading) {
            return (
                <Button view="action" onClick={() => uiFactory.onCreateDB?.({clusterName})}>
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
                    value={search}
                    onChange={handleSearchChange}
                    placeholder="Database name"
                    className={b('search')}
                />
                {showWithProblemsFilter ? (
                    <ProblemFilter value={withProblems} onChange={handleWithProblemsChange} />
                ) : null}
                <EntitiesCount
                    total={tenants?.length}
                    current={filteredTenants?.length || 0}
                    label={'Databases'}
                    loading={loading}
                />
            </React.Fragment>
        );
    };

    const databasesColumns = React.useMemo(() => {
        const columns: Column<PreparedTenant>[] = [
            {
                name: 'Name',
                header: 'Database',
                render: ({row}) => (
                    <TenantNameWrapper
                        tenant={row}
                        clusterName={clusterName}
                        additionalTenantsProps={additionalTenantsProps}
                        externalLink={Boolean(environmentName)}
                    />
                ),
                width: 440,
                sortable: true,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'Type',
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
                name: 'State',
                width: 150,
                render: ({row}) => (
                    <Label theme={databaseStateToLabelTheme(row.State)}>
                        {formatDatabaseState(row.State)}
                    </Label>
                ),
            },
            {
                name: 'cpu',
                header: 'CPU',
                width: 80,
                render: ({row}) => {
                    // Don't show values below 0.01 when formatted
                    if (row.cpu && row.cpu > 10_000) {
                        return formatCPU(row.cpu);
                    }
                    return EMPTY_DATA_PLACEHOLDER;
                },
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'memory',
                header: 'Memory',
                width: 120,
                render: ({row}) =>
                    row.memory ? formatStorageValuesToGb(row.memory) : EMPTY_DATA_PLACEHOLDER,
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'storage',
                header: 'Storage',
                width: 120,
                render: ({row}) =>
                    row.storage ? formatStorageValuesToGb(row.storage) : EMPTY_DATA_PLACEHOLDER,
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
        ];

        if (showNetworkUtilization) {
            columns.push({
                name: 'Network',
                header: 'Network',
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
        }

        columns.push(
            {
                name: 'nodesCount',
                header: 'Nodes',
                width: 100,
                render: ({row}) =>
                    row.nodesCount ? formatNumber(row.nodesCount) : EMPTY_DATA_PLACEHOLDER,
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'groupsCount',
                header: 'Groups',
                width: 100,
                render: ({row}) =>
                    row.groupsCount ? formatNumber(row.groupsCount) : EMPTY_DATA_PLACEHOLDER,
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
        );

        if (showPoolsColumn) {
            columns.push({
                name: 'PoolStats',
                header: 'Pools',
                width: 100,
                resizeMinWidth: 60,
                sortAccessor: ({PoolStats = []}) =>
                    PoolStats.reduce((acc, item) => acc + (item.Usage || 0), 0),
                defaultOrder: DataTable.DESCENDING,
                align: DataTable.LEFT,
                render: ({row}) => <PoolsGraph pools={row.PoolStats} />,
            });
        }

        return columns;
    }, [
        clusterName,
        additionalTenantsProps,
        environmentName,
        handleSearchChange,
        showNetworkUtilization,
        showPoolsColumn,
    ]);

    const renderTable = () => {
        if (filteredTenants.length === 0 && withProblems) {
            return <Illustration name="thumbsUp" width={200} />;
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={DATABASES_COLUMNS_WIDTH_LS_KEY}
                data={filteredTenants}
                columns={databasesColumns}
                settings={DEFAULT_TABLE_SETTINGS}
                emptyDataMessage="No such tenants"
                onSortChange={setSortParams}
            />
        );
    };

    return (
        <div className={b('table-wrapper')}>
            <TableWithControlsLayout fullHeight>
                <TableWithControlsLayout.Controls renderExtraControls={renderCreateDBButton}>
                    {renderControls()}
                </TableWithControlsLayout.Controls>
                {error ? <ResponseError error={error} /> : null}
                <TableWithControlsLayout.Table
                    scrollContainerRef={scrollContainerRef}
                    loading={loading}
                    scrollDependencies={[search, withProblems, sortParams]}
                >
                    {currentData ? renderTable() : null}
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </div>
    );
};
