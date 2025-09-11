import React from 'react';

import {CirclePlus, Pencil, TrashBin} from '@gravity-ui/icons';
import type {Column, SortOrder} from '@gravity-ui/react-data-table';
import DataTable from '@gravity-ui/react-data-table';
import type {DropdownMenuItem} from '@gravity-ui/uikit';
import {Button, DropdownMenu, Icon} from '@gravity-ui/uikit';

import {EntitiesCount} from '../../components/EntitiesCount';
import {ResponseError} from '../../components/Errors/ResponseError';
import {Illustration} from '../../components/Illustration';
import {PoolsGraph} from '../../components/PoolsGraph/PoolsGraph';
import {ProblemFilter} from '../../components/ProblemFilter';
import {ResizeableDataTable} from '../../components/ResizeableDataTable/ResizeableDataTable';
import {Search} from '../../components/Search';
import {TableWithControlsLayout} from '../../components/TableWithControlsLayout/TableWithControlsLayout';
import {TenantNameWrapper} from '../../components/TenantNameWrapper/TenantNameWrapper';
import {
    useCreateDatabaseFeatureAvailable,
    useDatabasesAvailable,
    useDeleteDatabaseFeatureAvailable,
    useEditDatabaseFeatureAvailable,
} from '../../store/reducers/capabilities/hooks';
import {
    ProblemFilterValues,
    changeFilter,
    selectProblemFilter,
} from '../../store/reducers/settings/settings';
import type {ProblemFilterValue} from '../../store/reducers/settings/types';
import {
    selectFilteredTenants,
    selectTenants,
    selectTenantsSearchValue,
} from '../../store/reducers/tenants/selectors';
import {setSearchValue, tenantsApi} from '../../store/reducers/tenants/tenants';
import type {PreparedTenant} from '../../store/reducers/tenants/types';
import type {AdditionalTenantsProps} from '../../types/additionalProps';
import {State} from '../../types/api/tenant';
import {uiFactory} from '../../uiFactory/uiFactory';
import {formatBytes} from '../../utils/bytesParsers';
import {cn} from '../../utils/cn';
import {
    DEFAULT_TABLE_SETTINGS,
    EMPTY_DATA_PLACEHOLDER,
    SHOW_NETWORK_UTILIZATION,
} from '../../utils/constants';
import {
    formatCPU,
    formatNumber,
    formatStorageValuesToGb,
} from '../../utils/dataFormatters/dataFormatters';
import {
    useAutoRefreshInterval,
    useSetting,
    useTypedDispatch,
    useTypedSelector,
} from '../../utils/hooks';
import {useClusterNameFromQuery} from '../../utils/hooks/useDatabaseFromQuery';
import {isNumeric} from '../../utils/utils';

import i18n from './i18n';

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

interface TenantsProps {
    scrollContainerRef: React.RefObject<HTMLElement>;
    additionalTenantsProps?: AdditionalTenantsProps;
}

export const Tenants = ({additionalTenantsProps, scrollContainerRef}: TenantsProps) => {
    const dispatch = useTypedDispatch();

    const clusterName = useClusterNameFromQuery();
    const isMetaDatabasesAvailable = useDatabasesAvailable();
    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = tenantsApi.useGetTenantsInfoQuery(
        {clusterName, isMetaDatabasesAvailable},
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;

    // Track sort state for scroll dependencies
    const [sortParams, setSortParams] = React.useState<SortOrder | SortOrder[] | undefined>();

    const isCreateDBAvailable =
        useCreateDatabaseFeatureAvailable() && uiFactory.onCreateDB !== undefined;
    const isEditDBAvailable = useEditDatabaseFeatureAvailable() && uiFactory.onEditDB !== undefined;
    const isDeleteDBAvailable =
        useDeleteDatabaseFeatureAvailable() && uiFactory.onDeleteDB !== undefined;

    const tenants = useTypedSelector((state) => selectTenants(state, clusterName));
    const searchValue = useTypedSelector(selectTenantsSearchValue);
    const filteredTenants = useTypedSelector((state) => selectFilteredTenants(state, clusterName));
    const problemFilter = useTypedSelector(selectProblemFilter);

    const [showNetworkUtilization] = useSetting<boolean>(SHOW_NETWORK_UTILIZATION);

    const handleProblemFilterChange = (value: ProblemFilterValue) => {
        dispatch(changeFilter(value));
    };

    const handleSearchChange = (value: string) => {
        dispatch(setSearchValue(value));
    };

    const renderCreateDBButton = () => {
        const buttonAvailable = isCreateDBAvailable && clusterName;

        if (buttonAvailable && !loading) {
            return (
                <Button
                    view="action"
                    onClick={() => uiFactory.onCreateDB?.({clusterName})}
                    className={b('create-database')}
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
                    value={searchValue}
                    onChange={handleSearchChange}
                    placeholder="Database name"
                    className={b('search')}
                />
                <ProblemFilter value={problemFilter} onChange={handleProblemFilterChange} />
                <EntitiesCount
                    total={tenants.length}
                    current={filteredTenants?.length || 0}
                    label={'Databases'}
                    loading={loading}
                />
            </React.Fragment>
        );
    };

    const renderTable = () => {
        const columns: Column<PreparedTenant>[] = [
            {
                name: 'Name',
                header: 'Database',
                render: ({row}) => (
                    <TenantNameWrapper
                        tenant={row}
                        additionalTenantsProps={additionalTenantsProps}
                    />
                ),
                width: 440,
                sortable: true,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'controlPlaneName',
                header: 'Name',
                render: ({row}) => {
                    return row.controlPlaneName;
                },
                width: 200,
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
                render: ({row}) => formatDatabaseState(row.State),
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
            {
                name: 'PoolStats',
                header: 'Pools',
                width: 100,
                resizeMinWidth: 60,
                sortAccessor: ({PoolStats = []}) =>
                    PoolStats.reduce((acc, item) => acc + (item.Usage || 0), 0),
                defaultOrder: DataTable.DESCENDING,
                align: DataTable.LEFT,
                render: ({row}) => <PoolsGraph pools={row.PoolStats} />,
            },
        );

        if (clusterName && (isDeleteDBAvailable || isEditDBAvailable)) {
            const actionsColumn = getDBActionsColumn({
                clusterName,
                isDeleteDBAvailable,
                isEditDBAvailable,
            });

            columns.push(actionsColumn);
        }

        if (filteredTenants.length === 0 && problemFilter !== ProblemFilterValues.ALL) {
            return <Illustration name="thumbsUp" width="200" />;
        }

        return (
            <ResizeableDataTable
                columnsWidthLSKey={DATABASES_COLUMNS_WIDTH_LS_KEY}
                data={filteredTenants}
                columns={columns}
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
                    scrollDependencies={[searchValue, problemFilter, sortParams]}
                >
                    {currentData ? renderTable() : null}
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </div>
    );
};

function getDBActionsColumn({
    clusterName,
    isEditDBAvailable,
    isDeleteDBAvailable,
}: {
    clusterName: string;
    isEditDBAvailable?: boolean;
    isDeleteDBAvailable?: boolean;
}) {
    return {
        name: 'actions',
        header: '',
        width: 40,
        resizeable: false,
        align: DataTable.CENTER,
        render: ({row}) => {
            const menuItems: (DropdownMenuItem | DropdownMenuItem[])[] = [];

            // Do not show edit and delete actions for domain
            if (row.Type === 'Domain') {
                return null;
            }

            if (isEditDBAvailable) {
                menuItems.push({
                    text: i18n('edit'),
                    iconStart: <Pencil />,
                    action: () => {
                        uiFactory.onEditDB?.({
                            clusterName,
                            databaseData: row,
                        });
                    },
                });
            }
            if (isDeleteDBAvailable) {
                menuItems.push({
                    text: i18n('remove'),
                    iconStart: <TrashBin />,
                    action: () => {
                        uiFactory.onDeleteDB?.({
                            clusterName,
                            databaseData: row,
                        });
                    },
                    theme: 'danger',
                });
            }

            if (!menuItems.length) {
                return null;
            }

            return <DropdownMenu items={menuItems} />;
        },
    } satisfies Column<PreparedTenant>;
}
