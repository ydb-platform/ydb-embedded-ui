import React from 'react';

import {CirclePlus, TrashBin} from '@gravity-ui/icons';
import type {Column} from '@gravity-ui/react-data-table';
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
    useDeleteDatabaseFeatureAvailable,
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
import {uiFactory} from '../../uiFactory/uiFactory';
import {cn} from '../../utils/cn';
import {DEFAULT_TABLE_SETTINGS} from '../../utils/constants';
import {
    formatCPU,
    formatNumber,
    formatStorageValuesToGb,
} from '../../utils/dataFormatters/dataFormatters';
import {useAutoRefreshInterval, useTypedDispatch, useTypedSelector} from '../../utils/hooks';
import {useClusterNameFromQuery} from '../../utils/hooks/useDatabaseFromQuery';

import i18n from './i18n';

import './Tenants.scss';

const b = cn('tenants');

const DATABASES_COLUMNS_WIDTH_LS_KEY = 'databasesTableColumnsWidth';

interface TenantsProps {
    additionalTenantsProps?: AdditionalTenantsProps;
}

export const Tenants = ({additionalTenantsProps}: TenantsProps) => {
    const dispatch = useTypedDispatch();

    const clusterName = useClusterNameFromQuery();

    const [autoRefreshInterval] = useAutoRefreshInterval();
    const {currentData, isFetching, error} = tenantsApi.useGetTenantsInfoQuery(
        {clusterName},
        {pollingInterval: autoRefreshInterval},
    );
    const loading = isFetching && currentData === undefined;

    const isCreateDBAvailable =
        useCreateDatabaseFeatureAvailable() && uiFactory.onCreateDB !== undefined;
    const isDeleteDBAvailable =
        useDeleteDatabaseFeatureAvailable() && uiFactory.onDeleteDB !== undefined;

    const tenants = useTypedSelector((state) => selectTenants(state, clusterName));
    const searchValue = useTypedSelector(selectTenantsSearchValue);
    const filteredTenants = useTypedSelector((state) => selectFilteredTenants(state, clusterName));
    const problemFilter = useTypedSelector(selectProblemFilter);

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
                {renderCreateDBButton()}
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
                width: 90,
                render: ({row}) => (row.State ? row.State.toLowerCase() : '—'),
                customStyle: () => ({textTransform: 'capitalize'}),
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
                    return '—';
                },
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'memory',
                header: 'Memory',
                width: 120,
                render: ({row}) => (row.memory ? formatStorageValuesToGb(row.memory) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'storage',
                header: 'Storage',
                width: 120,
                render: ({row}) => (row.storage ? formatStorageValuesToGb(row.storage) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'nodesCount',
                header: 'Nodes',
                width: 100,
                render: ({row}) => (row.nodesCount ? formatNumber(row.nodesCount) : '—'),
                align: DataTable.RIGHT,
                defaultOrder: DataTable.DESCENDING,
            },
            {
                name: 'groupsCount',
                header: 'Groups',
                width: 100,
                render: ({row}) => (row.groupsCount ? formatNumber(row.groupsCount) : '—'),
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
        ];

        if (isDeleteDBAvailable) {
            columns.push({
                name: 'actions',
                header: '',
                width: 40,
                resizeable: false,
                align: DataTable.CENTER,
                render: ({row}) => {
                    const databaseId = row.UserAttributes?.database_id;
                    const databaseName = row.Name;

                    let menuItems: (DropdownMenuItem | DropdownMenuItem[])[] = [];

                    if (clusterName && databaseName && databaseId) {
                        menuItems = [
                            {
                                text: i18n('remove'),
                                iconStart: <TrashBin />,
                                action: () => {
                                    uiFactory.onDeleteDB?.({
                                        clusterName,
                                        databaseId,
                                        databaseName,
                                    });
                                },
                                className: b('remove-db'),
                            },
                        ];
                    }

                    if (!menuItems.length) {
                        return null;
                    }
                    return (
                        <DropdownMenu
                            defaultSwitcherProps={{
                                view: 'flat',
                                size: 's',
                                pin: 'brick-brick',
                            }}
                            items={menuItems}
                        />
                    );
                },
            });
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
            />
        );
    };

    return (
        <div className={b('table-wrapper')}>
            <TableWithControlsLayout>
                <TableWithControlsLayout.Controls className={b('controls')}>
                    {renderControls()}
                </TableWithControlsLayout.Controls>
                {error ? <ResponseError error={error} /> : null}
                <TableWithControlsLayout.Table loading={loading}>
                    {currentData ? renderTable() : null}
                </TableWithControlsLayout.Table>
            </TableWithControlsLayout>
        </div>
    );
};
